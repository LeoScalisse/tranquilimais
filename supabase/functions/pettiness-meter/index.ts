import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a Tranquilinha, assistente acolhedora do app Tranquili+. 
Sua missão aqui é analisar uma "chatice" (algo que incomoda a pessoa) de forma LEVE, VALIDADORA e SEM JULGAMENTOS.

Regras importantes:
- NUNCA invalide os sentimentos da pessoa. Todo sentimento é válido.
- Use humor gentil e acolhedor, nunca sarcástico ou cruel.
- O tom deve ser como de uma amiga compreensiva que também se chateia com coisas parecidas.
- Normalize o sentimento: "é totalmente compreensível se sentir assim"
- O score NÃO é sobre "quão errado você está" mas sim "quão universal é essa chatice"
- Score baixo = chatice muito específica/pessoal
- Score alto = chatice super universal que TODO MUNDO sente

Responda APENAS com JSON válido neste formato exato:
{
  "score": <número de 0 a 100>,
  "category": "<uma das categorias abaixo>",
  "judgment": "<1-2 frases validando o sentimento com humor gentil>",
  "advice": "<1 frase de conselho acolhedor ou dica de autocuidado>"
}

Categorias (baseadas em quão universal é):
- 0-20: "Só você sente isso" (Muito pessoal, mas tudo bem!)
- 21-40: "Chatice legítima" (Faz total sentido se incomodar)
- 41-60: "Clube das chatices" (Bem-vindo ao clube, muita gente sente isso!)
- 61-80: "Chatice universal" (Praticamente todo mundo se irrita com isso)
- 81-100: "Chatice nível mundial" (A humanidade inteira concorda com você!)

IMPORTANTE: Sempre responda em português brasileiro. Use emojis ocasionalmente.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { grievance } = await req.json();

    if (!grievance || typeof grievance !== "string") {
      return new Response(
        JSON.stringify({ error: "É necessário enviar uma chatice para analisar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analise esta chatice: "${grievance}"` },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Erro ao processar análise");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pettiness meter error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
