import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Phone, Mail, Calendar, Truck, Package, FileText, Eye, Trash2, AlertTriangle, Send } from 'lucide-react';
import { QuoteSummary } from '@/components/admin/QuoteSummary';
import { QuoteStatus } from '@/components/admin/QuoteStatus';
import { EditLeadDialog } from '@/components/admin/EditLeadDialog';

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  id_number: string | null;
  notes: string | null;
  selected_truck_type: string | null;
  selected_truck_size: string | null;
  selected_equipment: string[] | null;
  status: string;
  is_complete: boolean;
  privacy_accepted: boolean;
  created_at: string;
  updated_at: string;
  quote_id: string | null;
  quote_number: string | null;
  quote_created_at: string | null;
  quote_sent_at: string | null;
  quote_total: number | null;
  quote_url: string | null;
  id_validation_error: string | null;
}

interface TruckType {
  id: string;
  name: string;
  name_he: string;
}

interface TruckSize {
  id: string;
  name: string;
  truck_type_id: string;
}

interface Equipment {
  id: string;
  name: string;
  description: string | null;
}

const statusOptions = [
  { value: 'new', label: 'חדש', color: 'bg-blue-500' },
  { value: 'contacted', label: 'נוצר קשר', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'בתהליך', color: 'bg-orange-500' },
  { value: 'quoted', label: 'נשלחה הצעה', color: 'bg-purple-500' },
  { value: 'closed_won', label: 'סגור - זכייה', color: 'bg-green-500' },
  { value: 'closed_lost', label: 'סגור - אבוד', color: 'bg-red-500' },
];

const LeadsManagement = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all equipment for name mapping
  const { data: allEquipment } = useQuery({
    queryKey: ['all-equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, description');
      if (error) throw error;
      return data as Equipment[];
    },
  });

  // Fetch truck types for quote calculation
  const { data: truckTypes } = useQuery({
    queryKey: ['truck-types-for-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_types')
        .select('id, name, name_he');
      if (error) throw error;
      return data as TruckType[];
    },
  });

  // Fetch truck sizes for quote calculation
  const { data: truckSizes } = useQuery({
    queryKey: ['truck-sizes-for-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_sizes')
        .select('id, name, truck_type_id');
      if (error) throw error;
      return data as TruckSize[];
    },
  });

  // Create equipment ID to name map
  const equipmentMap = allEquipment?.reduce((acc, eq) => {
    acc[eq.id] = eq.name;
    return acc;
  }, {} as Record<string, string>) || {};

  const { data: leads, isLoading } = useQuery({
    queryKey: ['admin-leads', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast({ title: 'הסטטוס עודכן' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      setSelectedLead(null);
      toast({ title: 'הליד נמחק' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  // Create price quote mutation (creates quote in Morning without sending email)
  const createQuoteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-price-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ leadId, sendEmail: false }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create quote');
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast({ 
        title: 'הצעת המחיר נוצרה בהצלחה', 
        description: `מספר הצעה: ${data.quote_number}` 
      });
      // Refresh the selected lead data
      if (selectedLead) {
        setSelectedLead({
          ...selectedLead,
          quote_id: data.quote_id,
          quote_number: data.quote_number,
          quote_url: data.quote_url,
          quote_total: data.quote_total,
          quote_created_at: new Date().toISOString(),
        });
      }
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה ביצירת הצעת מחיר', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Send quote to client mutation
  const sendQuoteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quote-to-client`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ leadId }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send quote');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast({ title: 'הצעת המחיר נשלחה ללקוח בהצלחה' });
      // Refresh the selected lead data
      if (selectedLead) {
        setSelectedLead({
          ...selectedLead,
          quote_sent_at: new Date().toISOString(),
          status: 'quoted',
        });
      }
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה בשליחת הצעת מחיר', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Send completion link to client mutation
  const sendCompletionLinkMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-completion-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ leadId }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send completion link');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      toast({ title: 'הקישור נשלח ללקוח בהצלחה' });
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה בשליחת הקישור', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Update lead mutation (for editing)
  const updateLeadMutation = useMutation({
    mutationFn: async (data: Partial<Lead> & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ leadId: id, ...updateData }),
        }
      );

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to update lead');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
      setEditingLead(null);
      toast({ title: 'הליד עודכן בהצלחה' });
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה בעדכון הליד', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Badge className={`${statusOption?.color || 'bg-gray-500'} text-white`}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  // Helper function to get equipment name from ID
  const getEquipmentName = (idOrName: string): string => {
    // Check if it's a UUID (equipment ID)
    if (idOrName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return equipmentMap[idOrName] || idOrName;
    }
    // If it's not a UUID, it might already be a name
    return idOrName;
  };

  // Check if lead has products for quoting
  const hasProducts = (lead: Lead) => {
    return !!(lead.selected_truck_size || (lead.selected_equipment && lead.selected_equipment.length > 0));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ניהול לידים</h1>
          <p className="text-muted-foreground">
            {leads?.length || 0} לידים בסה"כ
          </p>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="סנן לפי סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {leads?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            אין לידים עדיין
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads?.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{lead.full_name}</h3>
                      {getStatusBadge(lead.status)}
                      {!lead.is_complete && (
                        <Badge variant="outline" className="text-orange-600 border-orange-400">
                          לא הושלם
                        </Badge>
                      )}
                      {lead.id_validation_error && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          ח.פ. לא תקין
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {lead.phone}
                      </span>
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {lead.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </span>
                    </div>
                    {lead.selected_truck_type && (
                      <div className="flex items-center gap-1 text-sm mt-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <span>{lead.selected_truck_type}</span>
                        {lead.selected_truck_size && <span>• {lead.selected_truck_size}</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Select
                      value={lead.status}
                      onValueChange={(value) => updateStatusMutation.mutate({ id: lead.id, status: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lead Details Dialog */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>פרטי ליד</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">שם מלא</label>
                  <p className="text-lg font-semibold">{selectedLead.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">סטטוס</label>
                  <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">טלפון</label>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selectedLead.phone}`} className="text-primary hover:underline">
                      {selectedLead.phone}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">אימייל</label>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedLead.email ? (
                      <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">
                        {selectedLead.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">לא צוין</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ח.פ. / ת.ז.</label>
                  <p className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {selectedLead.id_number ? (
                      <div className="flex flex-col gap-1">
                        <span dir="ltr">{selectedLead.id_number}</span>
                        {selectedLead.id_validation_error && (
                          <div className="flex items-center gap-1 text-destructive text-sm bg-destructive/10 px-2 py-1 rounded">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>לא תקין במורנינג - יש לתקן לפני יצירת הצעת מחיר</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">לא צוין</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">תאריך יצירה</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedLead.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </p>
                </div>
              </div>

              {(selectedLead.selected_truck_type || selectedLead.selected_truck_size) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    טראק שנבחר
                  </label>
                  <p className="mt-1">
                    {selectedLead.selected_truck_type}
                    {selectedLead.selected_truck_size && ` - ${selectedLead.selected_truck_size}`}
                  </p>
                </div>
              )}

              {selectedLead.selected_equipment && selectedLead.selected_equipment.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    ציוד שנבחר ({selectedLead.selected_equipment.length} פריטים)
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLead.selected_equipment.map((item, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {getEquipmentName(item)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedLead.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    הערות
                  </label>
                  <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                    {selectedLead.notes}
                  </p>
                </div>
              )}

              {/* For incomplete leads - show edit and send completion link buttons */}
              {!selectedLead.is_complete && (
                <div className="space-y-4 p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">ליד לא הושלם</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    הלקוח לא סיים את תהליך הבחירה. ניתן לערוך את הבחירות או לשלוח לו קישור להשלמה.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingLead(selectedLead)}
                    >
                      <FileText className="h-4 w-4 ml-2" />
                      ערוך בחירות
                    </Button>
                    <Button
                      onClick={() => sendCompletionLinkMutation.mutate(selectedLead.id)}
                      disabled={!selectedLead.email || sendCompletionLinkMutation.isPending}
                    >
                      <Send className="h-4 w-4 ml-2" />
                      {sendCompletionLinkMutation.isPending ? 'שולח...' : 'שלח ללקוח להשלמה'}
                    </Button>
                  </div>
                  {!selectedLead.email && (
                    <p className="text-xs text-destructive">* נדרש אימייל לשליחת קישור</p>
                  )}
                </div>
              )}

              {/* Quote Summary - show price calculation */}
              {hasProducts(selectedLead) && (
                <QuoteSummary
                  selectedTruckType={selectedLead.selected_truck_type}
                  selectedTruckSize={selectedLead.selected_truck_size}
                  selectedEquipment={selectedLead.selected_equipment}
                  truckTypes={truckTypes}
                  truckSizes={truckSizes}
                  equipment={allEquipment}
                />
              )}

              {/* Quote Status - 3-step workflow (only for complete leads) */}
              {selectedLead.is_complete && (
                <QuoteStatus
                  quoteId={selectedLead.quote_id}
                  quoteNumber={selectedLead.quote_number}
                  quoteCreatedAt={selectedLead.quote_created_at}
                  quoteSentAt={selectedLead.quote_sent_at}
                  quoteTotal={selectedLead.quote_total}
                  quoteUrl={selectedLead.quote_url}
                  onCreateQuote={() => createQuoteMutation.mutate(selectedLead.id)}
                  onSendToClient={() => sendQuoteMutation.mutate(selectedLead.id)}
                  onEdit={() => setEditingLead(selectedLead)}
                  isCreating={createQuoteMutation.isPending}
                  isSending={sendQuoteMutation.isPending}
                  hasProducts={hasProducts(selectedLead)}
                  hasEmail={!!selectedLead.email}
                />
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('האם למחוק את הליד הזה?')) {
                      deleteLeadMutation.mutate(selectedLead.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחק ליד
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Lead Dialog */}
      <EditLeadDialog
        lead={editingLead}
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        onSaveAndRecreate={async (data) => {
          if (editingLead) {
            // First update the lead
            await updateLeadMutation.mutateAsync({ id: editingLead.id, ...data });
            // Update selectedLead with new data
            if (selectedLead && selectedLead.id === editingLead.id) {
              setSelectedLead({
                ...selectedLead,
                ...data,
                full_name: data.full_name || selectedLead.full_name,
                email: data.email ?? selectedLead.email,
                phone: data.phone || selectedLead.phone,
                id_number: data.id_number ?? selectedLead.id_number,
                notes: data.notes ?? selectedLead.notes,
                selected_truck_type: data.selected_truck_type ?? selectedLead.selected_truck_type,
                selected_truck_size: data.selected_truck_size ?? selectedLead.selected_truck_size,
                selected_equipment: data.selected_equipment ?? selectedLead.selected_equipment,
              });
            }
            // Then recreate the quote
            createQuoteMutation.mutate(editingLead.id);
          }
        }}
        onSaveOnly={async (data) => {
          if (editingLead) {
            await updateLeadMutation.mutateAsync({ id: editingLead.id, ...data });
            // Update selectedLead with new data
            if (selectedLead && selectedLead.id === editingLead.id) {
              setSelectedLead({
                ...selectedLead,
                ...data,
                full_name: data.full_name || selectedLead.full_name,
                email: data.email ?? selectedLead.email,
                phone: data.phone || selectedLead.phone,
                id_number: data.id_number ?? selectedLead.id_number,
                notes: data.notes ?? selectedLead.notes,
                selected_truck_type: data.selected_truck_type ?? selectedLead.selected_truck_type,
                selected_truck_size: data.selected_truck_size ?? selectedLead.selected_truck_size,
                selected_equipment: data.selected_equipment ?? selectedLead.selected_equipment,
              });
            }
            setEditingLead(null);
          }
        }}
        isSaving={updateLeadMutation.isPending || createQuoteMutation.isPending}
        showSaveOnly={editingLead ? !editingLead.is_complete : false}
      />
    </div>
  );
};

export default LeadsManagement;
