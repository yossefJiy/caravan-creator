import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Phone, Mail, Calendar, Truck, Package, FileText, Eye, Trash2 } from 'lucide-react';

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  notes: string | null;
  selected_truck_type: string | null;
  selected_truck_size: string | null;
  selected_equipment: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Badge className={`${statusOption?.color || 'bg-gray-500'} text-white`}>
        {statusOption?.label || status}
      </Badge>
    );
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
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {lead.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {lead.email}
                      </span>
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
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>פרטי ליד</DialogTitle>
          </DialogHeader>
          
          {selectedLead && (
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
                    <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">
                      {selectedLead.email}
                    </a>
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
                    ציוד שנבחר
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLead.selected_equipment.map((item, index) => (
                      <Badge key={index} variant="secondary">{item}</Badge>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsManagement;
