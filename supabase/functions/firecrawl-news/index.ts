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
    const { category = 'Estudos', limit = 12 } = await req.json();

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const categoryQueries: Record<string, string> = {
      // Estudos
      'Estudos': 'estudos científicos recentes saúde bem-estar psicologia neurociência descoberta pesquisa resultados positivos',
      'Estudos-Sono': 'estudos científicos sono qualidade descanso ritmo circadiano benefícios pesquisa',
      'Estudos-Nutrição': 'estudos científicos nutrição alimentação saudável dieta saúde benefícios pesquisa',
      'Estudos-Exercícios': 'estudos científicos exercícios atividade física saúde mental benefícios pesquisa',
      'Estudos-Meditação': 'estudos científicos meditação mindfulness atenção plena benefícios cérebro pesquisa',
      'Estudos-Saúde Mental': 'estudos científicos saúde mental psicologia terapia bem-estar emocional pesquisa',
      // Boas Notícias - geral
      'Boas Notícias': 'boas notícias positivas mundo progresso avanço conquista humanidade esperança melhoria sociedade descoberta animais natureza tecnologia solidariedade',
      // Boas Notícias - sub-filtros
      'BoasNoticias-Meio Ambiente': 'boas notícias meio ambiente natureza animais recuperação espécies reflorestamento energia renovável oceanos preservação sustentabilidade progresso ambiental',
      'BoasNoticias-Tecnologia': 'boas notícias tecnologia inovação descoberta científica avanço cura energia limpa inteligência artificial progresso',
      'BoasNoticias-Solidariedade': 'boas notícias solidariedade voluntariado doação comunidade ajuda humanitária gentileza bondade superação história inspiradora',
      'BoasNoticias-Saúde': 'boas notícias saúde cura vacina tratamento descoberta médica avanço medicina qualidade vida melhoria',
      'BoasNoticias-Cultura': 'boas notícias cultura educação arte inclusão diversidade patrimônio conquista social igualdade avanço cultural',
    };

    const searchQuery = categoryQueries[category] || categoryQueries['Boas Notícias'];

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
        tbs: 'qdr:m',
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

    // Determine display category
    const isBoasNoticias = category === 'Boas Notícias' || category.startsWith('BoasNoticias-');
    const displayCategory = isBoasNoticias
      ? (category.startsWith('BoasNoticias-') ? category.replace('BoasNoticias-', '') : 'Boas Notícias')
      : (category.startsWith('Estudos-') ? category.replace('Estudos-', '') : 'Estudos');

    const articles: NewsSearchResult[] = (data.data || []).map((result: any, index: number) => {
      let source = 'Fonte desconhecida';
      try {
        const url = new URL(result.url);
        source = url.hostname.replace('www.', '');
      } catch (e) {
        console.log('Error parsing URL:', e);
      }

      let finalCategory = displayCategory;
      if (!isBoasNoticias && displayCategory === 'Estudos') {
        const content = (result.title + ' ' + result.description).toLowerCase();
        if (content.includes('sono') || content.includes('dormir')) finalCategory = 'Sono';
        else if (content.includes('nutrição') || content.includes('alimentação')) finalCategory = 'Nutrição';
        else if (content.includes('exercício') || content.includes('atividade física')) finalCategory = 'Exercícios';
        else if (content.includes('meditação') || content.includes('mindfulness')) finalCategory = 'Meditação';
        else if (content.includes('saúde mental') || content.includes('psicolog')) finalCategory = 'Saúde Mental';
      }

      if (isBoasNoticias && displayCategory === 'Boas Notícias') {
        const content = (result.title + ' ' + result.description).toLowerCase();
        if (content.includes('animal') || content.includes('espécie') || content.includes('floresta') || content.includes('clima') || content.includes('oceano')) finalCategory = 'Meio Ambiente';
        else if (content.includes('tecnologia') || content.includes('inovação') || content.includes('científic')) finalCategory = 'Tecnologia';
        else if (content.includes('solidariedade') || content.includes('voluntário') || content.includes('doação') || content.includes('ajuda')) finalCategory = 'Solidariedade';
        else if (content.includes('saúde') || content.includes('cura') || content.includes('vacina') || content.includes('tratamento')) finalCategory = 'Saúde';
        else if (content.includes('cultura') || content.includes('educação') || content.includes('arte') || content.includes('inclusão')) finalCategory = 'Cultura';
      }

      return {
        id: `news-${Date.now()}-${index}`,
        title: result.title || 'Artigo sem título',
        description: result.description || result.markdown?.substring(0, 200) || 'Sem descrição disponível',
        url: result.url || '',
        category: finalCategory,
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
