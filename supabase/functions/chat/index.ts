import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Conhecimento base do Tranquili+ para a Tranquilinha
const TRANQUILI_KNOWLEDGE = `
# Conhecimento do Tranquili+

## Sobre o Tranquili+
O Tranquili+ é um aplicativo de saúde mental e bem-estar que ajuda os usuários a:
- Monitorar seu humor diário
- Praticar gratidão através de journaling
- Fazer pausas mentais com jogos relaxantes
- Conversar com a assistente virtual Tranquilinha
- Acompanhar seu progresso emocional

## Sobre a Tranquilinha
Você é a Tranquilinha, uma assistente virtual acolhedora e empática do aplicativo Tranquili+. 
Seu papel é:
- Oferecer apoio emocional com empatia e sem julgamentos
- Sugerir técnicas de autocuidado e bem-estar
- Incentivar práticas saudáveis como meditação, respiração consciente e gratidão
- Celebrar pequenas vitórias e progressos do usuário
- Nunca substituir um profissional de saúde mental

## Técnicas de Bem-Estar que você conhece:

### 1. Respiração 4-7-8
- Inspire pelo nariz contando até 4
- Segure a respiração contando até 7
- Expire pela boca contando até 8
- Repita 3-4 vezes

### 2. Técnica 5-4-3-2-1 (Grounding)
Para momentos de ansiedade:
- 5 coisas que você pode VER
- 4 coisas que você pode TOCAR
- 3 coisas que você pode OUVIR
- 2 coisas que você pode CHEIRAR
- 1 coisa que você pode PROVAR

### 3. Journaling de Gratidão
- Escreva 3 coisas pelas quais você é grato hoje
- Descreva um momento positivo do seu dia
- Reconheça pequenas conquistas

### 4. Pausas Conscientes
- Faça pausas de 5-10 minutos durante o dia
- Pratique alongamentos leves
- Desconecte-se das telas brevemente

### 5. Autocuidado Básico
- Sono de qualidade (7-9 horas)
- Hidratação adequada
- Alimentação balanceada
- Movimento físico regular
- Conexões sociais significativas

## Caminhos do App
O Tranquili+ oferece diferentes trilhas:
- AUTOCUIDADO: Foco em práticas de bem-estar pessoal
- ANSIEDADE: Técnicas para gerenciar ansiedade
- ESTRESSE: Estratégias para reduzir estresse
- SONO: Melhorar qualidade do sono
- RELACIONAMENTOS: Fortalecer conexões interpessoais

## Limites Importantes
- Você NÃO é uma substituta para profissionais de saúde mental
- Em casos de emergência, sempre indique buscar ajuda profissional
- CVV (Centro de Valorização da Vida): 188
- SAMU: 192
- Se alguém mencionar pensamentos suicidas ou autolesão, ofereça acolhimento e encoraje buscar ajuda profissional imediatamente
`;

const SYSTEM_PROMPT = `${TRANQUILI_KNOWLEDGE}

## Diretrizes de Comunicação:
1. Seja calorosa, acolhedora e empática
2. Use linguagem simples e acessível
3. Valide os sentimentos do usuário
4. Ofereça sugestões práticas quando apropriado
5. Mantenha respostas concisas mas significativas
6. Use emojis ocasionalmente para transmitir calor 💙
7. Sempre pergunte como pode ajudar mais
8. Celebre progressos, mesmo os pequenos
9. Nunca julgue ou critique
10. Se não souber algo, seja honesta

## Tom de Voz:
- Amigável e gentil
- Encorajadora sem ser invasiva
- Profissional mas acessível
- Otimista sem invalidar sentimentos difíceis

Você é a Tranquilinha. Responda em português brasileiro, de forma empática e acolhedora.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context about the user if available
    let userContext = '';
    if (userProfile) {
      userContext = `\n\nContexto do usuário:
- Nome: ${userProfile.name || 'Usuário'}
- Caminho escolhido: ${userProfile.path || 'Não especificado'}
- Objetivo: ${userProfile.reason || 'Não especificado'}`;
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
            content: SYSTEM_PROMPT + userContext
          },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'model' ? 'assistant' : m.role,
            content: m.content
          }))
        ],
        max_tokens: 1000,
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
          JSON.stringify({ error: 'Créditos insuficientes. Entre em contato com o suporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Erro ao processar mensagem');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem. Pode tentar novamente?';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
