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

      {/* Credits strip */}
      <div className="mt-12 pt-6 border-t border-border/50 w-full max-w-md">
        <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="block text-center mb-3 group">
          <span className="text-muted-foreground/50 text-[10px] md:text-xs group-hover:text-muted-foreground/80 transition-colors">רוצים גם מערכת הזמנות משוכללת לעסק שלכם?</span>
        </a>
        <div className="flex items-center justify-center gap-3 md:gap-6">
          <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
            <img src="/images/credits/jiy.svg" alt="JIY" className="h-3 md:h-5 brightness-0 opacity-50 hover:opacity-80 transition-opacity" />
            <span className="text-muted-foreground/60 text-[9px] md:text-xs">Marketing</span>
          </a>
          <div className="w-px h-3 bg-border" />
          <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
            <img src="/images/credits/storytell.svg" alt="Storytell" className="h-3 md:h-5 brightness-0 opacity-50 hover:opacity-80 transition-opacity" />
            <span className="text-muted-foreground/60 text-[9px] md:text-xs">UX/UI</span>
          </a>
          <div className="w-px h-3 bg-border" />
          <a href="https://jiy.co.il" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
            <img src="/images/credits/converto.svg" alt="Converto" className="h-3 md:h-5 brightness-0 opacity-50 hover:opacity-80 transition-opacity" />
            <span className="text-muted-foreground/60 text-[9px] md:text-xs">Built by</span>
          </a>
        </div>
      </div>
    </div>
  );
};
