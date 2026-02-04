import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Send } from 'lucide-react';

interface QuoteStatusProps {
  quoteId: string | null;
  quoteNumber: string | null;
  quoteSentAt: string | null;
  quoteTotal: number | null;
  quoteUrl: string | null;
  onResend?: () => void;
  isResending?: boolean;
}

export const QuoteStatus = ({
  quoteId,
  quoteNumber,
  quoteSentAt,
  quoteTotal,
  quoteUrl,
  onResend,
  isResending = false,
}: QuoteStatusProps) => {
  if (!quoteId) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-accent/30 border border-accent rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <span className="font-medium">הצעת מחיר נשלחה</span>
        <Badge variant="secondary">
          מס׳ {quoteNumber}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {quoteSentAt && (
          <div>
            <span className="text-muted-foreground">נשלחה בתאריך: </span>
            <span>{format(new Date(quoteSentAt), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
          </div>
        )}
        {quoteTotal !== null && (
          <div>
            <span className="text-muted-foreground">סכום (לפני מע"מ): </span>
            <span className="font-medium">{formatPrice(quoteTotal)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {quoteUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(quoteUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 ml-2" />
            צפה בהצעה
          </Button>
        )}
        {onResend && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResend}
            disabled={isResending}
          >
            <Send className="h-4 w-4 ml-2" />
            {isResending ? 'שולח...' : 'שלח שוב'}
          </Button>
        )}
      </div>
    </div>
  );
};
