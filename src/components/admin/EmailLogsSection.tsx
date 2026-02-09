import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Mail, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface EmailLog {
  id: string;
  created_at: string;
  type: string;
  to_email: string;
  subject: string;
  status: string;
  attempt: number;
  error_message: string | null;
  provider_message_id: string | null;
  metadata: Record<string, unknown> | null;
}

const typeLabels: Record<string, string> = {
  lead_notification_business_1: 'התראה עסקית #1',
  lead_notification_business_2: 'התראה עסקית #2',
  lead_confirmation_client: 'אישור ללקוח',
  quote_to_client: 'הצעת מחיר ללקוח',
  completion_link: 'קישור להשלמה',
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  sent: { label: 'נשלח', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: 'נכשל', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  queued: { label: 'בתור', icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

// Map email type to the correct edge function
function getRetryFunction(type: string): string {
  if (type.startsWith('lead_notification')) return 'send-lead-notification';
  if (type === 'quote_to_client') return 'send-quote-to-client';
  if (type === 'completion_link') return 'send-completion-link';
  return 'send-lead-notification';
}

interface EmailLogsSectionProps {
  leadId: string;
}

export const EmailLogsSection = ({ leadId }: EmailLogsSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['email-logs', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as EmailLog[];
    },
  });

  const retryMutation = useMutation({
    mutationFn: async ({ type, leadId }: { type: string; leadId: string }) => {
      const functionName = getRetryFunction(type);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ leadId, overrideRetry: true }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Retry failed');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-logs', leadId] });
      toast({ title: 'המייל נשלח מחדש בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בשליחה מחדש', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span className="text-sm">אין היסטוריית מיילים</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Mail className="h-4 w-4" />
        היסטוריית מיילים ({logs.length})
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {logs.map((log) => {
          const config = statusConfig[log.status] || statusConfig.queued;
          const StatusIcon = config.icon;

          return (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 border rounded-lg text-sm gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {typeLabels[log.type] || log.type}
                  </Badge>
                  <Badge className={`text-xs ${config.className} border-0`}>
                    <StatusIcon className="h-3 w-3 ml-1" />
                    {config.label}
                  </Badge>
                  {log.attempt > 1 && (
                    <span className="text-xs text-muted-foreground">ניסיון #{log.attempt}</span>
                  )}
                </div>
                <div className="mt-1 text-muted-foreground text-xs truncate">
                  <span>{log.to_email}</span>
                  <span className="mx-1">•</span>
                  <span>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                </div>
                {log.error_message && (
                  <div className="mt-1 flex items-start gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{log.error_message}</span>
                  </div>
                )}
              </div>
              {log.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => retryMutation.mutate({ type: log.type, leadId })}
                  disabled={retryMutation.isPending}
                >
                  <RefreshCw className={`h-3 w-3 ml-1 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                  שלח שוב
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
