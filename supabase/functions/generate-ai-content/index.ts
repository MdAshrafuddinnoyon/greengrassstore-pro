import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
function validateInput(data: unknown): { systemPrompt: string; userPrompt: string; type: string } {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }

  const { systemPrompt, userPrompt, type } = data as Record<string, unknown>;

  // Validate systemPrompt
  if (typeof systemPrompt !== 'string' || systemPrompt.length === 0 || systemPrompt.length > 2000) {
    throw new Error('systemPrompt must be a string between 1 and 2000 characters');
  }

  // Validate userPrompt
  if (typeof userPrompt !== 'string' || userPrompt.length === 0 || userPrompt.length > 2000) {
    throw new Error('userPrompt must be a string between 1 and 2000 characters');
  }

  // Validate type
  const allowedTypes = ['title', 'description', 'full', 'excerpt', 'content'];
  if (typeof type !== 'string' || !allowedTypes.includes(type)) {
    throw new Error(`type must be one of: ${allowedTypes.join(', ')}`);
  }

  return { systemPrompt, userPrompt, type };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    const { systemPrompt, userPrompt, type } = validatedInput;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: type === 'full' ? 2000 : 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your account.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('AI content generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
