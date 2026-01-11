const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsSearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  source: string;
  publishedAt?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = 'saúde mental', limit = 10 } = await req.json();

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query based on category
    const categoryQueries: Record<string, string> = {
      'Todos': 'saúde mental bem-estar psicologia estudos recentes',
      'Meditação': 'meditação mindfulness atenção plena benefícios estudos',
      'Sono': 'sono qualidade sono insônia saúde mental estudos',
      'Nutrição': 'nutrição alimentação saúde mental humor estudos',
      'Exercícios': 'exercícios físicos ansiedade depressão saúde mental',
      'Social': 'relacionamentos sociais bem-estar saúde mental conexões',
      'Trabalho': 'saúde mental trabalho burnout estresse profissional',
      'Ansiedade': 'ansiedade tratamento sintomas técnicas estudos',
      'Depressão': 'depressão saúde mental tratamento estudos recentes',
    };

    const searchQuery = categoryQueries[category] || `${category} saúde mental bem-estar`;

    console.log(`Searching news for category: ${category}, query: ${searchQuery}`);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: limit,
        lang: 'pt',
        country: 'BR',
        tbs: 'qdr:w', // Last week
        // Removed scrapeOptions to speed up search (was causing 60s+ delays)
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform results into news articles
    const articles: NewsSearchResult[] = (data.data || []).map((result: any, index: number) => {
      // Extract domain as source
      let source = 'Fonte desconhecida';
      try {
        const url = new URL(result.url);
        source = url.hostname.replace('www.', '');
      } catch (e) {
        console.log('Error parsing URL:', e);
      }

      // Categorize based on content
      const content = (result.title + ' ' + result.description).toLowerCase();
      let detectedCategory = category !== 'Todos' ? category : 'Saúde Mental';
      
      if (content.includes('meditação') || content.includes('mindfulness')) {
        detectedCategory = 'Meditação';
      } else if (content.includes('sono') || content.includes('dormir')) {
        detectedCategory = 'Sono';
      } else if (content.includes('nutrição') || content.includes('alimentação') || content.includes('dieta')) {
        detectedCategory = 'Nutrição';
      } else if (content.includes('exercício') || content.includes('atividade física')) {
        detectedCategory = 'Exercícios';
      } else if (content.includes('relacionamento') || content.includes('social')) {
        detectedCategory = 'Social';
      } else if (content.includes('trabalho') || content.includes('burnout') || content.includes('profissional')) {
        detectedCategory = 'Trabalho';
      } else if (content.includes('ansiedade')) {
        detectedCategory = 'Ansiedade';
      } else if (content.includes('depressão')) {
        detectedCategory = 'Depressão';
      }

      return {
        id: `news-${Date.now()}-${index}`,
        title: result.title || 'Artigo sem título',
        description: result.description || result.markdown?.substring(0, 200) || 'Sem descrição disponível',
        url: result.url || '',
        category: detectedCategory,
        source: source,
        publishedAt: new Date().toISOString(),
      };
    });

    console.log(`Found ${articles.length} articles`);

    return new Response(
      JSON.stringify({ success: true, data: articles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch news';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
