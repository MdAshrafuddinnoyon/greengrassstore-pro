import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model, maxTokens, temperature, provider, apiKey } = await req.json();

    let response: string;

    if (provider === 'lovable' || !apiKey) {
      // Use Lovable AI Gateway
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY is not configured');
      }

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'google/gemini-2.5-flash',
          messages,
          max_tokens: maxTokens || 500,
          temperature: temperature || 0.7,
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            response: "I'm a bit busy right now. Please try again in a moment! 🙏"
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ 
            error: 'Payment required',
            response: "I'm currently unavailable. Please contact support."
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await aiResponse.text();
        console.error('Lovable AI error:', aiResponse.status, errorText);
        throw new Error(`AI gateway error: ${aiResponse.status}`);
      }

      const data = await aiResponse.json();
      response = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.';

    } else if (provider === 'openai') {
      // Use OpenAI directly
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages,
          max_tokens: maxTokens || 500,
          temperature: temperature || 0.7,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('OpenAI error:', aiResponse.status, errorText);
        throw new Error(`OpenAI error: ${aiResponse.status}`);
      }

      const data = await aiResponse.json();
      response = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.';

    } else if (provider === 'gemini') {
      // Use Google Gemini directly
      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-pro'}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: messages.map((m: { role: string; content: string }) => ({
              role: m.role === 'assistant' ? 'model' : m.role,
              parts: [{ text: m.content }]
            })),
            generationConfig: {
              maxOutputTokens: maxTokens || 500,
              temperature: temperature || 0.7,
            }
          }),
        }
      );

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('Gemini error:', aiResponse.status, errorText);
        throw new Error(`Gemini error: ${aiResponse.status}`);
      }

      const data = await aiResponse.json();
      response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response.';

    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat AI error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      response: "I'm sorry, I encountered an issue. Please try again or contact our support team."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
