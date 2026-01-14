import { Edit2, Check, Truck, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TruckType } from '@/hooks/useTruckData';
import type { ContactDetails } from '@/types/configurator';

interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
}

interface SummaryStepProps {
  truckType: TruckType;
  selectedSizeId: string;
  contactDetails: ContactDetails;
  selectedEquipment: EquipmentItem[];
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const SummaryStep = ({
  truckType,
  selectedSizeId,
  contactDetails,
  selectedEquipment,
  onEditStep,
  onSubmit,
  isSubmitting,
}: SummaryStepProps) => {
  const selectedSize = truckType.sizes.find((s) => s.id === selectedSizeId);
  const totalEquipmentUnits = selectedEquipment.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const SummaryCard = ({
    icon: Icon,
    title,
    editStep,
    children,
  }: {
    icon: React.ElementType;
    title: string;
    editStep: number;
    children: React.ReactNode;
  }) => (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <button
          onClick={() => onEditStep(editStep)}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Edit2 className="w-4 h-4" />
          <span>ערוך</span>
        </button>
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">סיכום ההזמנה</h2>
        <p className="text-muted-foreground">
          בדקו את הפרטים לפני השליחה
        </p>
      </div>

      {/* Contact Details */}
      <SummaryCard icon={User} title="פרטי התקשרות" editStep={1}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">שם: </span>
            <span className="font-medium">{contactDetails.firstName} {contactDetails.lastName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">טלפון: </span>
            <span className="font-medium" dir="ltr">{contactDetails.phone}</span>
          </div>
          {contactDetails.email && (
            <div className="col-span-2">
              <span className="text-muted-foreground">אימייל: </span>
              <span className="font-medium" dir="ltr">{contactDetails.email}</span>
            </div>
          )}
        </div>
      </SummaryCard>

      {/* Truck Selection */}
      <SummaryCard icon={Truck} title="דגם וגודל" editStep={2}>
        <div className="flex items-center gap-4">
          <img
            src={truckType.image}
            alt={truckType.nameHe}
            className="w-20 h-20 object-cover rounded-lg bg-muted"
          />
          <div>
            <p className="font-semibold text-foreground">{truckType.nameHe}</p>
            {selectedSize && (
              <p className="text-sm text-muted-foreground">
                {selectedSize.name} • {selectedSize.dimensions}
              </p>
            )}
          </div>
        </div>
        {selectedSize && selectedSize.baseFeatures.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm font-medium mb-2">כלול בגודל זה:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {selectedSize.baseFeatures.slice(0, 4).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Check className="w-3 h-3 text-success flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SummaryCard>

      {/* Equipment - only show items with quantity > 0 */}
      <SummaryCard icon={Package} title="ציוד נוסף" editStep={4}>
        {selectedEquipment.length > 0 ? (
          <div className="space-y-2">
            {selectedEquipment.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0"
              >
                <span className="text-foreground">{item.name}</span>
                <span className="text-muted-foreground">
                  {item.quantity > 1 ? `×${item.quantity}` : ''}
                </span>
              </div>
            ))}
            <p className="text-sm font-medium text-primary">
              סה״כ {selectedEquipment.length} פריטים ({totalEquipmentUnits} יחידות)
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">לא נבחר ציוד נוסף</p>
        )}
      </SummaryCard>

      {/* Notes */}
      {contactDetails.notes && (
        <div className="bg-muted/50 border border-border rounded-xl p-4">
          <p className="text-sm font-medium mb-1">הערות נוספות:</p>
          <p className="text-sm text-muted-foreground">{contactDetails.notes}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className={cn(
          'w-full py-4 rounded-xl font-bold text-lg transition-all duration-200',
          'bg-primary text-primary-foreground shadow-gold hover:opacity-90',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-center gap-2'
        )}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">⏳</span>
            שולח...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            שלח בקשה להצעת מחיר
          </>
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        נחזור אליכם תוך 24 שעות עם הצעת מחיר מותאמת אישית
      </p>
    </div>
  );
};
