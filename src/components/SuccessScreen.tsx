import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';

interface SuccessScreenProps {
  onReset: () => void;
}

export const SuccessScreen = ({ onReset }: SuccessScreenProps) => {
  const { getContent } = useSiteContent();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-scale-in px-4">
      <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-success" />
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
        {getContent('success_title', 'הבקשה נשלחה בהצלחה!')}
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        {getContent('success_message', 'קיבלנו את הפרטים שלכם ונחזור אליכם בהקדם עם הצעת מחיר מותאמת אישית לפודטראק החלומות שלכם.')}
      </p>

      <div className="p-6 rounded-2xl bg-accent border border-primary/20 max-w-md mb-8">
        <p className="text-sm text-accent-foreground">
          💡 <strong>טיפ:</strong> בזמן ההמתנה, תוכלו לעיין בגלריית הפרויקטים שלנו באתר לקבלת השראה נוספת.
        </p>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
        <span>{getContent('success_button', 'התחל תהליך חדש')}</span>
      </button>
    </div>
  );
};
