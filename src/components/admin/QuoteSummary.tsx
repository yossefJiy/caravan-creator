import { useMemo, useState } from 'react';
import { usePricing } from '@/hooks/usePricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calculator, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteSummaryProps {
  selectedTruckType: string | null;
  selectedTruckSize: string | null;
  selectedEquipment: string[] | null;
  truckTypes?: Array<{ id: string; name: string; name_he: string; truck_type_id?: string }>;
  truckSizes?: Array<{ id: string; name: string; truck_type_id: string }>;
  equipment?: Array<{ id: string; name: string; description?: string | null }>;
}

const VAT_RATE = 0.18;

export const QuoteSummary = ({ 
  selectedTruckType,
  selectedTruckSize, 
  selectedEquipment, 
  truckTypes = [],
  truckSizes = [], 
  equipment = [] 
}: QuoteSummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getPricing } = usePricing();

  const calculations = useMemo(() => {
    let sizePrice = 0;
    let equipmentTotal = 0;

    // Find truck type ID first
    let truckTypeId: string | null = null;
    if (selectedTruckType) {
      const truckType = truckTypes.find(t => 
        t.name_he === selectedTruckType || t.name === selectedTruckType
      );
      if (truckType) {
        truckTypeId = truckType.id;
      }
    }

    // Find truck size ID and get price - match by truck_type_id if available
    if (selectedTruckSize) {
      let sizeData;
      
      if (truckTypeId) {
        // Try to find size that matches both name and truck type
        sizeData = truckSizes.find(s => 
          s.name === selectedTruckSize && s.truck_type_id === truckTypeId
        );
      }
      
      // Fallback to just matching by name
      if (!sizeData) {
        sizeData = truckSizes.find(s => s.name === selectedTruckSize);
      }
      
      if (sizeData) {
        const pricing = getPricing('truck_size', sizeData.id);
        sizePrice = pricing?.sale_price || 0;
      }
    }

    // Calculate equipment total
    if (selectedEquipment && selectedEquipment.length > 0) {
      selectedEquipment.forEach(equipId => {
        // Check if it's a UUID or a name
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(equipId);
        
        if (isUUID) {
          const pricing = getPricing('equipment', equipId);
          equipmentTotal += pricing?.sale_price || 0;
        } else {
          // Find equipment by name using startsWith to handle descriptions
          const equipData = equipment.find(e => equipId.startsWith(e.name));
          if (equipData) {
            const pricing = getPricing('equipment', equipData.id);
            equipmentTotal += pricing?.sale_price || 0;
          } else {
            // Exact match fallback
            const exactMatch = equipment.find(e => e.name === equipId);
            if (exactMatch) {
              const pricing = getPricing('equipment', exactMatch.id);
              equipmentTotal += pricing?.sale_price || 0;
            }
          }
        }
      });
    }

    const subtotal = sizePrice + equipmentTotal;
    const vat = subtotal * VAT_RATE;
    const total = subtotal + vat;

    return {
      sizePrice,
      equipmentTotal,
      subtotal,
      vat,
      total,
      equipmentCount: selectedEquipment?.length || 0,
    };
  }, [selectedTruckType, selectedTruckSize, selectedEquipment, truckTypes, truckSizes, equipment, getPricing]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (calculations.subtotal === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-muted/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/70 transition-colors rounded-t-lg">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                סיכום הצעת מחיר
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">
                  {formatPrice(calculations.total)}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )} />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-2 text-sm pt-0">
            {calculations.sizePrice > 0 && (
              <div className="flex justify-between">
                <span>גודל טראק:</span>
                <span>{formatPrice(calculations.sizePrice)}</span>
              </div>
            )}
            {calculations.equipmentTotal > 0 && (
              <div className="flex justify-between">
                <span>ציוד ({calculations.equipmentCount} פריטים):</span>
                <span>{formatPrice(calculations.equipmentTotal)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-muted-foreground">
              <span>סה"כ לפני מע"מ:</span>
              <span>{formatPrice(calculations.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>מע"מ (18%):</span>
              <span>{formatPrice(calculations.vat)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>סה"כ כולל מע"מ:</span>
              <span>{formatPrice(calculations.total)}</span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
