import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  notes: string | null;
  selected_truck_type: string | null;
  selected_truck_size: string | null;
  selected_equipment: string[] | null;
}

interface EditLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Lead>) => void;
  isSaving?: boolean;
}

export const EditLeadDialog = ({
  lead,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: EditLeadDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: '',
    selected_truck_type: '',
    selected_truck_size: '',
    selected_equipment: [] as string[],
  });

  // Fetch truck types
  const { data: truckTypes } = useQuery({
    queryKey: ['edit-lead-truck-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_types')
        .select('id, name, name_he')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch truck sizes
  const { data: truckSizes } = useQuery({
    queryKey: ['edit-lead-truck-sizes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_sizes')
        .select('id, name, dimensions, truck_type_id')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch equipment
  const { data: equipment } = useQuery({
    queryKey: ['edit-lead-equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, description')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Get truck type ID from name_he
  const selectedTruckType = truckTypes?.find(
    t => t.name_he === formData.selected_truck_type
  );

  // Filter sizes by selected truck type
  const filteredSizes = truckSizes?.filter(
    s => selectedTruckType ? s.truck_type_id === selectedTruckType.id : true
  );

  useEffect(() => {
    if (lead && open) {
      setFormData({
        full_name: lead.full_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        notes: lead.notes || '',
        selected_truck_type: lead.selected_truck_type || '',
        selected_truck_size: lead.selected_truck_size || '',
        selected_equipment: lead.selected_equipment || [],
      });
    }
  }, [lead, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      full_name: formData.full_name,
      email: formData.email || null,
      phone: formData.phone,
      notes: formData.notes || null,
      selected_truck_type: formData.selected_truck_type || null,
      selected_truck_size: formData.selected_truck_size || null,
      selected_equipment: formData.selected_equipment,
    });
  };

  const toggleEquipment = (equipmentName: string) => {
    setFormData(prev => ({
      ...prev,
      selected_equipment: prev.selected_equipment.includes(equipmentName)
        ? prev.selected_equipment.filter(e => e !== equipmentName)
        : [...prev.selected_equipment, equipmentName],
    }));
  };

  // Check if equipment is selected (by name or ID)
  const isEquipmentSelected = (eq: { id: string; name: string; description: string | null }) => {
    const fullName = eq.description ? `${eq.name} (${eq.description})` : eq.name;
    return formData.selected_equipment.some(
      item => item === eq.id || item === eq.name || item === fullName || item.startsWith(eq.name)
    );
  };

  // Get equipment display name
  const getEquipmentDisplayName = (eq: { name: string; description: string | null }) => {
    return eq.description ? `${eq.name} (${eq.description})` : eq.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת ליד</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">שם מלא</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סוג טראק</Label>
              <Select
                value={formData.selected_truck_type}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  selected_truck_type: value,
                  selected_truck_size: '', // Reset size when truck type changes
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג" />
                </SelectTrigger>
                <SelectContent>
                  {truckTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.name_he}>
                      {type.name_he}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>גודל טראק</Label>
              <Select
                value={formData.selected_truck_size}
                onValueChange={(value) => setFormData(prev => ({ ...prev, selected_truck_size: value }))}
                disabled={!formData.selected_truck_type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר גודל" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSizes?.map((size) => (
                    <SelectItem key={size.id} value={size.name}>
                      {size.name} - {size.dimensions}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ציוד</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {equipment?.map((eq) => (
                <div key={eq.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`eq-${eq.id}`}
                    checked={isEquipmentSelected(eq)}
                    onCheckedChange={() => {
                      const displayName = getEquipmentDisplayName(eq);
                      toggleEquipment(displayName);
                    }}
                  />
                  <Label htmlFor={`eq-${eq.id}`} className="text-sm cursor-pointer">
                    {getEquipmentDisplayName(eq)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};