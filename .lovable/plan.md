

# תוכנית: מיילים לפי שני תרחישים + דיליי 30 דקות לטופס חלקי

## סיכום

המערכת תבחין בין טופס שהושלם לבין טופס חלקי, ותשלח מיילים מותאמים לכל תרחיש. טופס חלקי ישלח מיילים רק אחרי 30 דקות - אם הלקוח לא השלים בינתיים.

## תרחיש 1: טופס הושלם (קיים - ללא שינוי)

- **לעסק**: פרטי ליד + הצעת מחיר (אם קיימת)
- **ללקוח**: אישור קבלה עם פרטי הבחירה (בלי מחירים)

## תרחיש 2: טופס חלקי (חדש)

כשלקוח ממלא פרטי קשר (שלב 1) ולא משלים:
- **דיליי 30 דקות**: מייל לא נשלח מיד. במקום זה, cron job רץ כל 5 דקות ובודק לידים חלקיים שנוצרו לפני 30+ דקות ועדיין לא הושלמו
- **לעסק**: "ליד חדש (חלקי)" - פרטי קשר בלבד
- **ללקוח**: "קיבלנו את הפרטים שלך, השלם את הבחירה" + כפתור CTA

## שינויים

### 1. Edge Function חדשה: `check-partial-leads`

פונקציה שרצה מ-cron job כל 5 דקות:
- שולפת לידים עם `is_complete = false` ו-`created_at < now() - 30 minutes`
- מסננת לידים שכבר נשלח להם מייל חלקי (בודקת `email_logs` לסוג `lead_notification_business_1_partial`)
- לכל ליד מתאים: שולחת 3 מיילים (2 לעסק + 1 ללקוח עם CTA להשלמה)
- משתמשת באותם helpers של idempotency ולוגים

### 2. הגדרת pg_cron job

SQL שמריץ את הפונקציה כל 5 דקות:

```text
cron.schedule('check-partial-leads', '*/5 * * * *', ...)
```

קורא ל-`check-partial-leads` עם HTTP POST.

### 3. עדכון `send-lead-notification` 

הוספת פרמטר `isPartial` (אופציונלי). כשמופעל עם `isPartial: true`:
- מייל לעסק: כותרת "ליד חדש (חלקי)" + פרטי קשר בלבד (בלי בחירות טראק/ציוד)
- מייל ללקוח: "עדיין לא בחרת את סוג הפודטראק" + כפתור "להשלמת הבחירה" עם קישור `?continue=LEAD_ID`
- סוגי אימייל חדשים בלוגים: `lead_notification_business_1_partial`, `lead_notification_business_2_partial`, `lead_confirmation_client_partial`

### 4. ללא שינוי ב-`FoodTruckConfigurator.tsx`

לא שולחים מייל בשלב 1. ה-cron job מטפל בזה אחרי 30 דקות.

### קבצים

| קובץ | שינוי |
|-------|--------|
| `supabase/functions/check-partial-leads/index.ts` | חדש - cron job handler |
| `supabase/functions/send-lead-notification/index.ts` | הוספת תמיכה ב-isPartial |
| `supabase/config.toml` | הוספת הגדרה לפונקציה חדשה |
| SQL (לא migration) | הגדרת pg_cron + pg_net |

