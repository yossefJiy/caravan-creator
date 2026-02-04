import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Send, Edit, Download } from 'lucide-react';

interface QuoteStatusProps {
  quoteId: string | null;
  quoteNumber: string | null;
  quoteCreatedAt: string | null;
  quoteSentAt: string | null;
  quoteTotal: number | null;
  quoteUrl: string | null;
  onCreateQuote?: () => void;
  onSendToClient?: () => void;
  onEdit?: () => void;
  isCreating?: boolean;
  isSending?: boolean;
  hasProducts?: boolean;
  hasEmail?: boolean;
}

export const QuoteStatus = ({
  quoteId,
  quoteNumber,
  quoteCreatedAt,
  quoteSentAt,
  quoteTotal,
  quoteUrl,
  onCreateQuote,
  onSendToClient,
  onEdit,
  isCreating = false,
  isSending = false,
  hasProducts = false,
  hasEmail = false,
}: QuoteStatusProps) => {
  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!quoteUrl) return;
    
    try {
      const response = await fetch(quoteUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quoteNumber || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Fallback: open in new tab
      window.open(quoteUrl, '_blank');
    }
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // State 1: No quote exists yet - quote is created automatically, so this is rare
  if (!quoteId) {
    if (!hasProducts) {
      return null;
    }

    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-3">
          לא נוצרה הצעת מחיר עדיין
        </p>
        <div className="flex gap-2">
          {onEdit && (
            <Button
              variant="outline"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 ml-2" />
              ערוך פרטים
            </Button>
          )}
          <Button
            onClick={onCreateQuote}
            disabled={isCreating}
          >
            <FileText className="h-4 w-4 ml-2" />
            {isCreating ? 'יוצר הצעה...' : 'צור הצעת מחיר'}
          </Button>
        </div>
      </div>
    );
  }

  // State 2: Quote exists but not sent yet
  if (!quoteSentAt) {
    return (
      <div className="bg-accent/30 border border-accent rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-medium">הצעת מחיר נוצרה</span>
          <Badge variant="secondary">
            מס׳ {quoteNumber}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {quoteCreatedAt && (
            <div>
              <span className="text-muted-foreground">נוצרה בתאריך: </span>
              <span>{format(new Date(quoteCreatedAt), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
            </div>
          )}
          {quoteTotal !== null && (
            <div>
              <span className="text-muted-foreground">סה"כ לתשלום: </span>
              <span className="font-medium">{formatPrice(quoteTotal)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {quoteUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(quoteUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 ml-2" />
                צפה ב-PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
              >
                <Download className="h-4 w-4 ml-2" />
                הורד
              </Button>
            </>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 ml-2" />
              ערוך
            </Button>
          )}
          {onSendToClient && hasEmail && (
            <Button
              size="sm"
              onClick={onSendToClient}
              disabled={isSending}
            >
              <Send className="h-4 w-4 ml-2" />
              {isSending ? 'שולח...' : 'שלח ללקוח'}
            </Button>
          )}
          {!hasEmail && (
            <p className="text-sm text-muted-foreground">
              אין מייל - לא ניתן לשלוח
            </p>
          )}
        </div>
      </div>
    );
  }

  // State 3: Quote was sent
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
            <span className="text-muted-foreground">סה"כ לתשלום: </span>
            <span className="font-medium">{formatPrice(quoteTotal)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {quoteUrl && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(quoteUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 ml-2" />
              צפה ב-PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
            >
              <Download className="h-4 w-4 ml-2" />
              הורד
            </Button>
          </>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 ml-2" />
            ערוך
          </Button>
        )}
        {onSendToClient && hasEmail && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSendToClient}
            disabled={isSending}
          >
            <Send className="h-4 w-4 ml-2" />
            {isSending ? 'שולח...' : 'שלח שוב'}
          </Button>
        )}
      </div>
    </div>
  );
};