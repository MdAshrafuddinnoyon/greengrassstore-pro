import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
function validateInput(data: unknown): { prompt: string; type: 'product' | 'blog' } {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }

  const { prompt, type } = data as Record<string, unknown>;

  // Validate prompt
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt is required and must be a non-empty string');
  }

  if (prompt.length > 2000) {
    throw new Error('Prompt must be 2000 characters or less');
  }

  // Validate type
  const allowedTypes = ['product', 'blog'];
  if (typeof type !== 'string' || !allowedTypes.includes(type)) {
    throw new Error(`type must be one of: ${allowedTypes.join(', ')}`);
  }

  return { prompt: prompt.trim(), type: type as 'product' | 'blog' };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Parse and validate input
    let validatedInput;
    try {
      const rawData = await req.json();
      validatedInput = validateInput(rawData);
    } catch (validationError) {
      console.error('Input validation error:', validationError);
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, type } = validatedInput;

    console.log(`Generating ${type} image with prompt:`, prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''));

    const systemPrompt = type === 'product' 
      ? "Generate a high-quality product photo. The image should be professional, clean background, well-lit, suitable for e-commerce."
      : "Generate a high-quality blog featured image. The image should be visually appealing, relevant to the content, suitable for a blog post header.";

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract image from response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        description: textContent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
