import { useState } from 'react';
import { User, Phone, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ContactDetails } from '@/types/configurator';

interface ContactFormProps {
  onSubmit: (details: ContactDetails) => void;
  initialData?: ContactDetails | null;
  selectedTruckType?: string | null;
  selectedTruckSize?: string | null;
  selectedEquipment?: string[];
}

export const ContactForm = ({ 
  onSubmit, 
  initialData, 
  selectedTruckType,
  selectedTruckSize,
  selectedEquipment 
}: ContactFormProps) => {
  const [formData, setFormData] = useState<ContactDetails>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    notes: initialData?.notes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactDetails, string>>>({});
  const { toast } = useToast();

  const validate = () => {
    const newErrors: Partial<Record<keyof ContactDetails, string>> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'שם פרטי הוא שדה חובה';
    if (!formData.lastName.trim()) newErrors.lastName = 'שם משפחה הוא שדה חובה';
    if (!formData.phone.trim()) {
      newErrors.phone = 'מספר טלפון הוא שדה חובה';
    } else if (!/^0\d{8,9}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'מספר טלפון לא תקין';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('leads').insert({
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email || '',
        phone: formData.phone,
        notes: formData.notes || null,
        selected_truck_type: selectedTruckType || null,
        selected_truck_size: selectedTruckSize || null,
        selected_equipment: selectedEquipment || null,
      });
      if (error) throw error;
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast({ title: 'שגיאה', description: 'לא הצלחנו לשלוח את הבקשה. נסה שוב.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-foreground mb-2">כמעט סיימנו!</h3>
        <p className="text-muted-foreground">השאירו פרטים ונחזור אליכם עם הצעת מחיר מותאמת אישית</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center gap-2"><User className="w-4 h-4" />שם פרטי *</Label>
          <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="הזינו שם פרטי" className={errors.firstName ? 'border-destructive' : ''} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="flex items-center gap-2"><User className="w-4 h-4" />שם משפחה *</Label>
          <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="הזינו שם משפחה" className={errors.lastName ? 'border-destructive' : ''} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" />טלפון *</Label>
        <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="050-000-0000" className={errors.phone ? 'border-destructive' : ''} dir="ltr" />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" />אימייל</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" className={errors.email ? 'border-destructive' : ''} dir="ltr" />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />הערות נוספות</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="יש לכם בקשות מיוחדות? ספרו לנו..." rows={4} />
      </div>
      <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-gold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
        {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />שולח...</> : 'שלח בקשה להצעת מחיר'}
      </button>
    </div>
  );
};