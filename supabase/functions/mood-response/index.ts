import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckinData {
  emotions: string[];
  intensity?: string;
  influencer?: string;
  customInfluencer?: string;
}

interface UserProfile {
  name?: string;
  path?: string;
}

const SYSTEM_PROMPT = `Você é a Tranquilinha, uma assistente virtual acolhedora do app Tranquili+.

## Sua Missão
Responder ao check-in emocional do usuário de forma curta, empática e contextual.

## Regras Fundamentais
1. NUNCA invalidar o sentimento do usuário
2. NUNCA tentar "consertar" ou resolver o problema
3. Priorizar acolhimento, presença e consciência emocional
4. Usar linguagem simples, acessível e sem termos clínicos
5. Manter respostas entre 3-5 linhas apenas
6. Tom calmo, humano e gentil

## Comportamentos por Emoção

### Ansiedade (intensidade moderada/intensa)
- Sugerir uma respiração simples ou pausa consciente
- Exemplo: "Respire fundo comigo: inspire por 4 segundos, segure por 4, solte por 4..."

### Tristeza
- Validar o sentimento
- Fazer uma pergunta aberta e acolhedora
- Exemplo: "A tristeza faz parte de nós. O que você gostaria de dizer a ela agora?"

### Gratidão
- Reforçar e ampliar a percepção positiva
- Celebrar o momento
- Exemplo: "Que lindo perceber isso! A gratidão ilumina tudo ao redor."

### Cansaço
- Normalizar o descanso e o cuidado com o corpo
- Exemplo: "Seu corpo está pedindo uma pausa. Descansar também é cuidar de si."

### Outros sentimentos
- Acolher sem julgamento
- Reconhecer a coragem de fazer o check-in
- Oferecer presença

## Fatores Influenciadores
Quando informado, mencione sutilmente o fator que influenciou:
- Corpo: fale sobre autocuidado físico
- Pensamentos: valide a mente ativa
- Pessoas: reconheça o impacto das relações
- Trabalho: normalize a pressão do dia a dia
- Redes sociais: sugira pausas digitais gentilmente
- Nada específico: valorize o autoconhecimento

## Formato da Resposta
- Máximo 3-5 linhas
- Pode incluir 1 emoji no final (💙 preferido)
- Pode fazer 1 pergunta reflexiva suave
- Evitar listas ou estruturas complexas
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { checkinData, userProfile } = await req.json() as { 
      checkinData: CheckinData; 
      userProfile?: UserProfile 
    };

    if (!checkinData) {
      return new Response(
        JSON.stringify({ error: 'Checkin data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the user message based on checkin data
    const emotions = checkinData.emotions.join(', ') || 'não especificado';
    const intensity = checkinData.intensity || 'não informada';
    const influencer = checkinData.customInfluencer || checkinData.influencer || 'não informado';
    const userName = userProfile?.name || 'usuário';

    const userMessage = `
O usuário ${userName} acabou de fazer um check-in emocional:
- Emoções: ${emotions}
- Intensidade: ${intensity}
- Fator influenciador: ${influencer}

Responda de forma acolhedora e empática, seguindo as regras do sistema.
`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.7,
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
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Erro ao processar resposta');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 
      'Obrigada por compartilhar como você está. Cada momento de autoconsciência é um passo importante. 💙';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mood response error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        response: 'Obrigada por fazer esse check-in. Seu bem-estar importa. 💙'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
