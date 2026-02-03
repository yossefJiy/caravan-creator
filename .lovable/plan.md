
# תיקון בעיית שמירת לידים בקונפיגורטור

## סיכום הבעיה
הבעיה היא שה-INSERT מצליח אבל ה-`.select('id').single()` נכשל כי אין SELECT policy לציבור על טבלת leads. זה גורם לשגיאה למרות שהליד בפועל נשמר.

## הפתרון המומלץ
יצירת Edge Function בשם `create-lead` שתבצע את ה-INSERT עם SERVICE_ROLE_KEY (כמו שכבר עשינו ל-update-lead). זה הפתרון הנכון לפרודקשן כי:
- אין צורך להוסיף SELECT policy מסוכן לציבור
- אין חשיפה מיותרת לספאם
- הקוד יותר עקבי (גם create וגם update דרך Edge Functions)

## שלבי הפתרון

### שלב 1: יצירת Edge Function חדשה `create-lead`
יצירת פונקציה שמקבלת את פרטי הליד, מבצעת INSERT עם SERVICE_ROLE_KEY, ומחזירה את ה-ID.

קובץ: `supabase/functions/create-lead/index.ts`
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, ...',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { full_name, email, phone, notes, privacy_accepted } = body

    // Validate required fields
    if (!full_name?.trim() || !phone?.trim() || privacy_accepted !== true) {
      return new Response(
        JSON.stringify({ error: 'missing_fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        full_name: full_name.trim(),
        phone: phone.trim(),
        email: email || null,
        notes: notes || null,
        status: 'new',
        is_complete: false,
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### שלב 2: עדכון config.toml
הוספת הפונקציה החדשה לקונפיגורציה:
```toml
[functions.create-lead]
verify_jwt = false
```

### שלב 3: עדכון הקונפיגורטור
שינוי הפונקציה `handleContactSubmit` ב-`FoodTruckConfigurator.tsx` לקרוא ל-Edge Function במקום INSERT ישיר:

```typescript
const handleContactSubmit = async (details: ContactDetails) => {
  try {
    const fullName = `${details.firstName} ${details.lastName}`;
    
    const { data, error } = await supabase.functions.invoke('create-lead', {
      body: {
        full_name: fullName,
        email: details.email || null,
        phone: details.phone,
        notes: details.notes || null,
        privacy_accepted: true,
      }
    });
    
    if (error) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      return;
    }
    
    if (data?.error) {
      toast({ title: 'שגיאה', description: data.error, variant: 'destructive' });
      return;
    }
    
    setState((prev) => ({ 
      ...prev, 
      contactDetails: details,
      step: 2,
      partialLeadId: data.id,
    }));
  } catch (error) {
    toast({ title: 'שגיאה', description: 'לא הצלחנו לשמור את הפרטים', variant: 'destructive' });
  }
};
```

### שלב 4: עדכון handleFinalSubmit
גם בשלב הסיכום (שלב 5), אם אין partialLeadId קיים, להשתמש ב-Edge Function במקום INSERT ישיר.

## יתרונות הפתרון
- **אין צורך לחשוף SELECT לציבור** - הנתונים האישיים בטבלת leads נשארים מוגנים
- **עקביות** - גם create וגם update עוברים דרך Edge Functions מאובטחות
- **הגנה מספאם** - אפשר להוסיף rate limiting בעתיד
- **שגיאות ברורות** - הפונקציה מחזירה הודעות שגיאה מדויקות

## מה לא ישתנה
- ה-RLS policies הנוכחיים נשארים (אפשר אפילו להסיר את ה-public INSERT policy בהמשך)
- הזרימה למשתמש נשארת זהה
- שלב הסיכום ממשיך לעבוד דרך update-lead כמו היום
