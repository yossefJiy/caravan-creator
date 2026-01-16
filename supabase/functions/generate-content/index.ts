import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model tier configuration with cost estimates
const MODEL_TIERS = {
  lite: {
    name: 'gemini-2.5-flash-lite-preview-06-17',
    maxTokens: 2048,
    costPer1MOutput: 0.40,
  },
  flash: {
    name: 'gemini-2.5-flash-preview-05-20',
    maxTokens: 4096,
    costPer1MOutput: 2.50,
  },
  pro: {
    name: 'gemini-2.5-pro-preview-05-06',
    maxTokens: 8192,
    costPer1MOutput: 10.00,
  },
};

// Smart default model tier based on content type
const getDefaultModelTier = (contentType: string): 'lite' | 'flash' | 'pro' => {
  switch (contentType) {
    case 'text':
    case 'description':
    case 'features':
      return 'lite'; // Simple content - use cheapest
    case 'ux':
      return 'flash'; // Complex but not critical
    default:
      return 'lite';
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_AI_STUDIO_API_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    
    const { prompt, contentType, targetType, modelTier, saveToHistory, userId } = await req.json();

    // Determine model tier - use provided or smart default
    const tier = modelTier || getDefaultModelTier(contentType);
    const modelConfig = MODEL_TIERS[tier as keyof typeof MODEL_TIERS] || MODEL_TIERS.lite;
    
    let systemPrompt = '';
    let useGoogleAI = !!GOOGLE_AI_STUDIO_API_KEY; // Prefer Google AI if key exists

    switch (contentType) {
      case 'text':
        systemPrompt = `אתה כותב תוכן שיווקי מקצועי בעברית עבור אתר של חברה לייצור פודטראקים ומשאיות מזון.
כתוב תוכן קצר, ברור ומשכנע. התמקד ביתרונות ובערך ללקוח.
סגנון: מקצועי אך נגיש, עם קריאות לפעולה ברורות.`;
        break;
      
      case 'features':
        systemPrompt = `אתה מומחה לפודטראקים ומשאיות מזון בישראל.
צור רשימת תכונות ויתרונות מקצועית בעברית.
כל תכונה צריכה להיות קצרה (עד 6 מילים) וממוקדת ביתרון ללקוח.
החזר רשימה של 5-8 תכונות, כל אחת בשורה נפרדת.`;
        break;
      
      case 'description':
        systemPrompt = `אתה כותב תיאורי מוצרים מקצועי בעברית.
כתוב תיאור קצר (2-3 משפטים) שמדגיש את היתרונות הייחודיים של המוצר.
הימנע ממילות מילוי, התמקד בערך ללקוח.`;
        break;
      
      case 'ux':
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

    console.log(`Generating content - model: ${modelConfig.name}, tier: ${tier}, contentType: ${contentType}, useGoogleAI: ${useGoogleAI}`);

    let generatedContent = '';
    let actualModel = modelConfig.name;
    
    if (useGoogleAI) {
      // Use Google AI Studio directly
      const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.name}:generateContent?key=${GOOGLE_AI_STUDIO_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: modelConfig.maxTokens,
          }
        }),
      });

      if (!googleResponse.ok) {
        const errorText = await googleResponse.text();
        console.error('Google AI Studio error:', googleResponse.status, errorText);
        throw new Error(`Google AI Studio error: ${googleResponse.status}`);
      }

      const googleData = await googleResponse.json();
      generatedContent = googleData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
    } else if (OPENROUTER_API_KEY) {
      // Fallback to OpenRouter with Mistral
      actualModel = 'mistralai/mistral-nemo';
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.dev',
          'X-Title': 'Caravan Creator',
        },
        body: JSON.stringify({
          model: actualModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: modelConfig.maxTokens,
          temperature: 0.7,
        }),
      });

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error('OpenRouter API error:', openRouterResponse.status, errorText);
        throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
      }

      const data = await openRouterResponse.json();
      generatedContent = data.choices?.[0]?.message?.content || '';
    } else {
      throw new Error('No AI API key configured');
    }

    // Optionally save to history
    if (saveToHistory && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('ai_content_history').insert({
        content_type: contentType,
        prompt: prompt,
        generated_content: generatedContent,
        model_used: actualModel,
        target_type: targetType || null,
        created_by: userId,
      });
    }

    return new Response(JSON.stringify({ 
      content: generatedContent,
      model: actualModel,
      modelTier: tier,
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
