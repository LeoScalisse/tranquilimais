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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { timeOfDay, recentEntries } = await req.json();

    const contextInfo = [];
    if (timeOfDay) contextInfo.push(`Horário do dia: ${timeOfDay}`);
    if (recentEntries?.length) {
      contextInfo.push(`Temas recentes do usuário: ${recentEntries.slice(0, 3).join(', ')}`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente de bem-estar que ajuda pessoas a praticar gratidão.
Sua tarefa é gerar 4 prompts curtos e inspiradores para journaling de gratidão.

Regras:
- Cada prompt deve ter no máximo 60 caracteres
- Use linguagem acolhedora e positiva
- Varie os temas: relacionamentos, conquistas, natureza, momentos simples, saúde, crescimento
- Comece com verbos ou palavras que convidem à reflexão
- Seja específico mas não muito restritivo

${contextInfo.length ? 'Contexto:\n' + contextInfo.join('\n') : ''}

Responda APENAS com um JSON array de 4 strings, sem formatação adicional.
Exemplo: ["Qual momento te fez sorrir hoje?", "Uma pessoa que te apoiou recentemente", "Algo novo que você aprendeu", "Um lugar que te traz paz"]`
          },
          {
            role: 'user',
            content: 'Gere 4 prompts de gratidão para eu refletir hoje.'
          }
        ],
        max_tokens: 300,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Muitas requisições. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the JSON array from the response
    let prompts: string[] = [];
    try {
      // Try to find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        prompts = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback prompts if parsing fails
      prompts = [
        "O que te fez sorrir hoje?",
        "Uma pessoa que você é grato por ter",
        "Um momento simples que te trouxe paz",
        "Algo que você conquistou recentemente"
      ];
    }

    // Ensure we have exactly 4 prompts
    while (prompts.length < 4) {
      prompts.push("O que te deixou feliz hoje?");
    }
    prompts = prompts.slice(0, 4);

    return new Response(
      JSON.stringify({ prompts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate prompts error:', error);
    
    // Return fallback prompts on error
    return new Response(
      JSON.stringify({
        prompts: [
          "O que te fez sorrir hoje?",
          "Uma pessoa que você é grato por ter",
          "Um momento simples que te trouxe paz",
          "Algo que você conquistou recentemente"
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
