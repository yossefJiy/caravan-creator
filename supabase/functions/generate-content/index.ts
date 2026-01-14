import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const { prompt, contentType, targetType, model } = await req.json();

    // Select model based on content type
    let selectedModel = model || 'mistralai/mistral-nemo';
    let systemPrompt = '';

    switch (contentType) {
      case 'text':
        // For text content - use mistral-nemo
        selectedModel = 'mistralai/mistral-nemo';
        systemPrompt = `אתה כותב תוכן שיווקי מקצועי בעברית עבור אתר של חברה לייצור פודטראקים ומשאיות מזון.
כתוב תוכן קצר, ברור ומשכנע. התמקד ביתרונות ובערך ללקוח.
סגנון: מקצועי אך נגיש, עם קריאות לפעולה ברורות.`;
        break;
      
      case 'features':
        // For feature lists
        selectedModel = 'mistralai/mistral-nemo';
        systemPrompt = `אתה מומחה לפודטראקים ומשאיות מזון בישראל.
צור רשימת תכונות ויתרונות מקצועית בעברית.
כל תכונה צריכה להיות קצרה (עד 6 מילים) וממוקדת ביתרון ללקוח.
החזר רשימה של 5-8 תכונות, כל אחת בשורה נפרדת.`;
        break;
      
      case 'description':
        // For product descriptions
        selectedModel = 'mistralai/mistral-nemo';
        systemPrompt = `אתה כותב תיאורי מוצרים מקצועי בעברית.
כתוב תיאור קצר (2-3 משפטים) שמדגיש את היתרונות הייחודיים של המוצר.
הימנע ממילות מילוי, התמקד בערך ללקוח.`;
        break;
      
      case 'ux':
        // For UX/architecture suggestions - use a more capable model
        selectedModel = 'anthropic/claude-3-haiku';
        systemPrompt = `אתה מומחה UX ופיתוח אתרים.
נתח את הבקשה וספק המלצות מעשיות לשיפור חווית המשתמש.
התמקד בשיפורים פרקטיים שניתן ליישם.
ענה בעברית.`;
        break;
      
      default:
        systemPrompt = 'אתה עוזר יצירתי בעברית. ענה בקצרה ובבהירות.';
    }

    console.log(`Generating content with model: ${selectedModel}, contentType: ${contentType}`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Caravan Creator',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ 
      content: generatedContent,
      model: selectedModel,
      contentType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
