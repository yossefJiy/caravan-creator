import { ArrowLeft, Truck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
        {/* Logo / Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            נעים להכיר! 👋
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-primary">
            בואו נבנה את הפודטראק המושלם עבורכם
          </h2>
        </div>

        {/* Description */}
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg">
            אנחנו <span className="font-semibold text-foreground">אליה קרוואנים</span> - מומחים לייצור פודטראקים ומשאיות מזון יוקרתיות בישראל
          </p>
          <p>
            בתהליך הקצר הזה נתאים עבורכם את הפודטראק המושלם לצרכים שלכם - מבחירת הדגם והגודל, דרך הציוד המקצועי, ועד להצעת מחיר מותאמת אישית
          </p>
        </div>

        {/* Steps Preview */}
        <div className="grid grid-cols-3 gap-4 py-6">
          {[
            { step: 1, label: 'פרטים אישיים' },
            { step: 2, label: 'בחירת דגם וגודל' },
            { step: 3, label: 'ציוד וסיכום' },
          ].map(({ step, label }) => (
            <div key={step} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold">
                {step}
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          className={cn(
            'inline-flex items-center gap-3 px-10 py-4 rounded-xl',
            'bg-primary text-primary-foreground font-bold text-lg',
            'shadow-gold hover:opacity-90 transition-all duration-200',
            'transform hover:scale-105'
          )}
        >
          <span>בוא נתחיל!</span>
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Trust Badge */}
        <p className="text-sm text-muted-foreground">
          🔒 הפרטים שלכם מאובטחים ונשמרים בסודיות מלאה
        </p>
      </div>
    </div>
  );
};
