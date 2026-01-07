import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { foodTruckTypes } from '@/data/foodtrucks';
import type { FoodTruckSize } from '@/types/configurator';

interface SizeSelectorProps {
  selectedType: string;
  selectedSize: string | null;
  onSelect: (sizeId: string) => void;
}

export const SizeSelector = ({ selectedType, selectedSize, onSelect }: SizeSelectorProps) => {
  const truckType = foodTruckTypes.find((t) => t.id === selectedType);
  
  if (!truckType) return null;

  return (
    <div className="stagger-children grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {truckType.sizes.map((size) => (
        <SizeCard
          key={size.id}
          size={size}
          isSelected={selectedSize === size.id}
          onClick={() => onSelect(size.id)}
          truckImage={truckType.image}
        />
      ))}
    </div>
  );
};

interface SizeCardProps {
  size: FoodTruckSize;
  isSelected: boolean;
  onClick: () => void;
  truckImage: string;
}

const SizeCard = ({ size, isSelected, onClick, truckImage }: SizeCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'selection-card text-right opacity-0',
        isSelected && 'selected'
      )}
    >
      {/* Header with image */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-foreground">{size.name}</h4>
          <p className="text-sm text-muted-foreground">מידות: {size.dimensions}</p>
        </div>
        <div className="w-20 h-16 rounded-md overflow-hidden bg-secondary/30 flex-shrink-0">
          <img
            src={truckImage}
            alt={size.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Features list */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">מה כלול:</p>
        <ul className="space-y-1">
          {size.baseFeatures.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </button>
  );
};
