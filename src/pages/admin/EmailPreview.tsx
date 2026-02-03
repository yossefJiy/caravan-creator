import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Eye, Building, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SiteContent {
  content_key: string;
  content_value: string;
}

const EmailPreview = () => {
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();

  // Fetch email settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_key, content_value')
        .in('content_key', [
          'notification_emails',
          'sender_email',
          'sender_name',
          'customer_sender_email',
          'customer_sender_name',
        ]);
      if (error) throw error;
      return Object.fromEntries(
        (data as SiteContent[]).map((s) => [s.content_key, s.content_value])
      );
    },
  });

  // Mock lead data for preview
  const mockLeadData = {
    fullName: 'ישראל ישראלי',
    email: testEmail || 'test@example.com',
    phone: '050-1234567',
    selectedTruckType: 'קפה טראק',
    selectedTruckSize: 'L',
    selectedEquipment: [
      'מכונת קפה (2 ראשים)',
      'מקרר תעשייתי (120x60)',
      'כיריים גז (4 להבות)',
      'שולחן נירוסטה (מטר 1)',
    ],
    notes: 'מעוניין בצבע שחור מט',
  };

  // Send test email mutation
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      if (!testEmail) throw new Error('נא להזין כתובת מייל');
      
      const response = await supabase.functions.invoke('send-lead-notification', {
        body: {
          leadId: 'test-preview',
          fullName: mockLeadData.fullName,
          email: testEmail,
          phone: mockLeadData.phone,
          selectedTruckType: mockLeadData.selectedTruckType,
          selectedTruckSize: mockLeadData.selectedTruckSize,
          selectedEquipment: mockLeadData.selectedEquipment,
          notes: mockLeadData.notes,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'מייל טסט נשלח בהצלחה!', description: `נשלח ל-${testEmail}` });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בשליחה', description: error.message, variant: 'destructive' });
    },
  });

  // Build equipment list HTML for preview
  const equipmentHtml = mockLeadData.selectedEquipment
    .map((item) => `<li style="padding: 4px 0;">${item}</li>`)
    .join('');

  // Business email HTML preview
  const businessEmailHtml = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 20px;">
      <h1 style="color: #D4AF37; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">ליד חדש!</h1>
      
      <h2 style="color: #333; margin-top: 20px;">פרטי הלקוח:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">שם מלא:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${mockLeadData.fullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">טלפון:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${mockLeadData.phone}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">אימייל:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${mockLeadData.email}</td>
        </tr>
      </table>

      <h2 style="color: #333; margin-top: 20px;">בחירות הקונפיגורטור:</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">סוג טראק:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${mockLeadData.selectedTruckType}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">גודל:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${mockLeadData.selectedTruckSize}</td>
        </tr>
      </table>

      <h2 style="color: #333; margin-top: 20px;">ציוד שנבחר:</h2>
      <ul style="margin: 0; padding-right: 20px; background: #f9f9f9; padding: 15px 15px 15px 35px; border-radius: 8px;">
        ${equipmentHtml}
      </ul>

      <h2 style="color: #333; margin-top: 20px;">הערות:</h2>
      <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${mockLeadData.notes}</p>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        ניתן לצפות בכל הלידים בממשק הניהול
      </p>
    </div>
  `;

  // Customer email HTML preview
  const customerEmailHtml = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; padding: 20px;">
      <h1 style="color: #D4AF37;">שלום ${mockLeadData.fullName.split(' ')[0]}!</h1>
      
      <p style="font-size: 16px; line-height: 1.6;">
        תודה שפנית אלינו! קיבלנו את הבקשה שלך ונחזור אליך בהקדם.
      </p>

      <h2 style="color: #333; margin-top: 30px;">סיכום הבקשה שלך:</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">סוג טראק:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${mockLeadData.selectedTruckType}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">גודל:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${mockLeadData.selectedTruckSize}</td>
        </tr>
      </table>

      <h3 style="color: #333;">ציוד שנבחר:</h3>
      <ul style="margin: 0; padding-right: 20px; background: #f9f9f9; padding: 15px 15px 15px 35px; border-radius: 8px;">
        ${equipmentHtml}
      </ul>

      <h3 style="color: #333; margin-top: 20px;">הערות:</h3>
      <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${mockLeadData.notes}</p>

      <div style="margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); border-radius: 10px; text-align: center;">
        <p style="color: white; font-size: 18px; margin: 0;">צוות אליה קרוואנים</p>
        <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">נבנה לך את הפודטראק המושלם</p>
      </div>
    </div>
  `;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">תצוגה מקדימה - מיילים</h1>
        <p className="text-muted-foreground">צפה במיילים וודא שהם נראים כמו שצריך</p>
      </div>

      {/* Email Settings Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">הגדרות מייל נוכחיות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">מייל לבעל העסק:</p>
              <p className="text-sm">שולח: {settings?.sender_email || 'לא הוגדר'}</p>
              <p className="text-sm">שם: {settings?.sender_name || 'לא הוגדר'}</p>
              <p className="text-sm">נמענים: {settings?.notification_emails || 'לא הוגדר'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">מייל ללקוח:</p>
              <p className="text-sm">שולח: {settings?.customer_sender_email || 'לא הוגדר'}</p>
              <p className="text-sm">שם: {settings?.customer_sender_name || 'לא הוגדר'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Email Sender */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            שליחת מייל טסט
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="test-email">כתובת מייל לבדיקה</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <Button
              onClick={() => sendTestMutation.mutate()}
              disabled={!testEmail || sendTestMutation.isPending}
            >
              {sendTestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Send className="h-4 w-4 ml-2" />
              )}
              שלח טסט
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            ישלח את שני המיילים (לבעל העסק וללקוח) לכתובת הבדיקה
          </p>
        </CardContent>
      </Card>

      {/* Email Previews */}
      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            מייל לבעל העסק
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            מייל ללקוח
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  תצוגה מקדימה - מייל לבעל העסק
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                נושא: ליד חדש: {mockLeadData.fullName}
              </p>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-lg overflow-hidden bg-white"
                dangerouslySetInnerHTML={{ __html: businessEmailHtml }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  תצוגה מקדימה - מייל ללקוח
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                נושא: קיבלנו את הבקשה שלך - אליה קרוואנים
              </p>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-lg overflow-hidden bg-white"
                dangerouslySetInnerHTML={{ __html: customerEmailHtml }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailPreview;
