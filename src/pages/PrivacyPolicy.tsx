import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לדף הבית
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8">מדיניות פרטיות</h1>

        <div className="prose prose-lg max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. כללי</h2>
            <p className="text-muted-foreground leading-relaxed">
              אליה קרוואנים ופודטראקים ("החברה", "אנחנו") מכבדת את פרטיותך ומחויבת להגן על המידע האישי שלך. 
              מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. המידע שאנו אוספים</h2>
            <p className="text-muted-foreground leading-relaxed">אנו אוספים את המידע הבא:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
              <li>שם מלא</li>
              <li>מספר טלפון</li>
              <li>כתובת דואר אלקטרוני (אופציונלי)</li>
              <li>העדפות לגבי סוג הפודטראק, גודל וציוד</li>
              <li>הערות נוספות שתספק לנו</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. כיצד אנו משתמשים במידע</h2>
            <p className="text-muted-foreground leading-relaxed">המידע שלך משמש אותנו ל:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
              <li>יצירת קשר עמך בנוגע לבקשתך</li>
              <li>הכנת הצעת מחיר מותאמת אישית</li>
              <li>שיפור השירותים שלנו</li>
              <li>שליחת עדכונים רלוונטיים (רק אם הסכמת לכך)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. שיתוף מידע עם צדדים שלישיים</h2>
            <p className="text-muted-foreground leading-relaxed">
              אנו לא מוכרים, משכירים או משתפים את המידע האישי שלך עם צדדים שלישיים למטרות שיווקיות. 
              המידע שלך עשוי להיות משותף עם ספקי שירות הפועלים מטעמנו (כגון שירותי דואר אלקטרוני) 
              אך ורק לצורך מתן השירות המבוקש.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. אבטחת מידע</h2>
            <p className="text-muted-foreground leading-relaxed">
              אנו נוקטים באמצעי אבטחה סבירים כדי להגן על המידע שלך מפני גישה לא מורשית, 
              שינוי, חשיפה או השמדה. עם זאת, אין שיטת העברה באינטרנט או אחסון אלקטרוני שהיא בטוחה ב-100%.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. זכויותיך</h2>
            <p className="text-muted-foreground leading-relaxed">יש לך את הזכות:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
              <li>לבקש לראות את המידע שאנו מחזיקים עליך</li>
              <li>לבקש תיקון של מידע שגוי</li>
              <li>לבקש מחיקת המידע שלך</li>
              <li>להתנגד לעיבוד המידע שלך</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              לכל בקשה, אנא צור קשר עמנו באמצעות פרטי הקשר המפורטים למטה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. עוגיות (Cookies)</h2>
            <p className="text-muted-foreground leading-relaxed">
              האתר שלנו משתמש בעוגיות לצורך שמירת התקדמותך בקונפיגורטור ושיפור חווית המשתמש. 
              אתה יכול לנהל את העדפות העוגיות בהגדרות הדפדפן שלך.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. שינויים במדיניות</h2>
            <p className="text-muted-foreground leading-relaxed">
              אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. שינויים מהותיים יפורסמו באתר זה. 
              מומלץ לעיין במדיניות זו מעת לעת.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. יצירת קשר</h2>
            <p className="text-muted-foreground leading-relaxed">
              לשאלות או בקשות בנוגע למדיניות פרטיות זו או למידע האישי שלך, ניתן ליצור קשר:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4 mt-2">
              <li>טלפון: 050-1234567</li>
              <li>אימייל: info@eliya-caravans.co.il</li>
            </ul>
          </section>

          <p className="text-sm text-muted-foreground mt-8 pt-4 border-t border-border">
            עודכן לאחרונה: פברואר 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
