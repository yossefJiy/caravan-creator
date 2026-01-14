import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const { prompt, contentType, targetType, model, saveToHistory, userId } = await req.json();

    // Select model and API based on content type
    let selectedModel = model || 'mistralai/mistral-nemo';
    let systemPrompt = '';
    let useGemini = false; // Flag to use Lovable AI (Gemini) instead of OpenRouter

    switch (contentType) {
      case 'text':
        // For text content - use mistral-nemo via OpenRouter
        selectedModel = 'mistralai/mistral-nemo';
        systemPrompt = `אתה כותב תוכן שיווקי מקצועי בעברית עבור אתר של חברה לייצור פודטראקים ומשאיות מזון.
כתוב תוכן קצר, ברור ומשכנע. התמקד ביתרונות ובערך ללקוח.
סגנון: מקצועי אך נגיש, עם קריאות לפעולה ברורות.`;
        break;
      
      case 'features':
        // For feature lists - use mistral-nemo via OpenRouter
        selectedModel = 'mistralai/mistral-nemo';
        systemPrompt = `אתה מומחה לפודטראקים ומשאיות מזון בישראל.
צור רשימת תכונות ויתרונות מקצועית בעברית.
כל תכונה צריכה להיות קצרה (עד 6 מילים) וממוקדת ביתרון ללקוח.
החזר רשימה של 5-8 תכונות, כל אחת בשורה נפרדת.`;
        break;
      
      case 'description':
        // For product descriptions - use mistral-nemo via OpenRouter
        selectedModel = 'mistralai/mistral-nemo';
        systemPrompt = `אתה כותב תיאורי מוצרים מקצועי בעברית.
כתוב תיאור קצר (2-3 משפטים) שמדגיש את היתרונות הייחודיים של המוצר.
הימנע ממילות מילוי, התמקד בערך ללקוח.`;
        break;
      
      case 'ux':
        // For UX/architecture suggestions - use Google Gemini via Lovable AI
        useGemini = true;
        selectedModel = 'google/gemini-2.5-flash';
        systemPrompt = `אתה מומחה UX ופיתוח אתרים מנוסה עם ידע נרחב בטכנולוגיות ווב מודרניות.
        
התפקיד שלך:
- לנתח בקשות ולספק המלצות מעשיות לשיפור חווית המשתמש
- להציע פתרונות טכנולוגיים מתקדמים ורלוונטיים
- לזהות בעיות פוטנציאליות ולהציע פתרונות
- להתמקד בשיפורים פרקטיים שניתן ליישם

כללים:
- ענה תמיד בעברית
- התמקד בהמלצות קונקרטיות וברורות
- הסבר את הסיבות מאחורי כל המלצה
- התייחס להיבטים של נגישות, ביצועים וחווית משתמש
- הצע קוד לדוגמה כשרלוונטי`;
        break;
      
      default:
        systemPrompt = 'אתה עוזר יצירתי בעברית. ענה בקצרה ובבהירות.';
    }

    console.log(`Generating content with model: ${selectedModel}, contentType: ${contentType}, useGemini: ${useGemini}`);

    let response;
    
    if (useGemini) {
      // Use Lovable AI Gateway for Gemini models
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY is not configured');
      }
      
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
        }),
      });
    } else {
      // Use OpenRouter for other models
      if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not configured');
      }
      
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || '';

    // Optionally save to history
    if (saveToHistory && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('ai_content_history').insert({
        content_type: contentType,
        prompt: prompt,
        generated_content: generatedContent,
        model_used: selectedModel,
        target_type: targetType || null,
        created_by: userId,
      });
    }

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