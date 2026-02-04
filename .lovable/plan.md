
# תוכנית: שיפור גלילה וקיפול במסך פרטי ליד

## סקירת הבעיה

דיאלוג פרטי הליד מכיל הרבה מידע - פרטי לקוח, טראק, ציוד, הערות, סיכום מחיר וסטטוס הצעה. במסכים קטנים ובמובייל, התוכן חורג מגובה המסך ואי אפשר לגלול לראות הכל.

## הפתרון המוצע

שילוב של שני שיפורים:

### 1. הוספת גלילה לדיאלוג
- הגבלת גובה מקסימלי ל-85% מגובה המסך במובייל ו-90% בדסקטופ
- הפעלת גלילה אוטומטית כשהתוכן חורג

### 2. הפיכת QuoteSummary לקיפול חכם
**לפני:**
```text
┌─────────────────────────────┐
│ סיכום הצעת מחיר             │
├─────────────────────────────┤
│ גודל טראק:        ₪50,000   │
│ ציוד (5 פריטים):  ₪12,000   │
│─────────────────────────────│
│ סה"כ לפני מע"מ:   ₪62,000   │
│ מע"מ (18%):       ₪11,160   │
│─────────────────────────────│
│ סה"כ כולל מע"מ:   ₪73,160   │
└─────────────────────────────┘
```

**אחרי (מקופל כברירת מחדל):**
```text
┌─────────────────────────────────────┐
│ ▸ סיכום הצעת מחיר    סה"כ: ₪73,160 │
└─────────────────────────────────────┘
```

לחיצה פותחת את הפירוט המלא.

---

## פרטים טכניים

### שינוי 1: DialogContent בקובץ LeadsManagement.tsx

```tsx
<DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
```

### שינוי 2: רכיב QuoteSummary עם קיפול

שימוש ב-Collapsible מ-Radix (כבר מותקן):

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export const QuoteSummary = ({ ... }: QuoteSummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // ... חישובים קיימים ...

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-muted/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/70 transition-colors">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                סיכום הצעת מחיר
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">
                  {formatPrice(calculations.total)}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isOpen && "rotate-180"
                )} />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-2 text-sm pt-0">
            {/* הפירוט המלא - נשאר כמו שהוא */}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
```

---

## קבצים שיעודכנו

| קובץ | שינוי |
|------|-------|
| `src/pages/admin/LeadsManagement.tsx` | הוספת max-height ו-overflow לדיאלוג |
| `src/components/admin/QuoteSummary.tsx` | הפיכה לרכיב Collapsible עם סה"כ בכותרת |

---

## תוצאה צפויה

- **גלילה חלקה** - גם אם יש הרבה תוכן, ניתן לגלול בדיאלוג
- **ממשק נקי** - סיכום המחיר מקופל ומציג רק את הסה"כ
- **גמישות** - לחיצה פותחת את הפירוט המלא
- **תואם מובייל** - עובד טוב על כל גודל מסך
