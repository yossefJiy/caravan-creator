import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TruckSize } from '@/hooks/useTruckData';

interface SizeSelectorProps {
  sizes: TruckSize[];
  selectedSize: string | null;
  onSelect: (sizeId: string) => void;
  truckImage: string;
}

// Map size index to M/L/XL labels
const getSizeLabel = (index: number): string => {
  const labels = ['M', 'L', 'XL', 'XXL'];
  return labels[index] || `${index + 1}`;
};

export const SizeSelector = ({ sizes, selectedSize, onSelect, truckImage }: SizeSelectorProps) => {
  if (!sizes.length) return null;

  return (
    <div className="stagger-children grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {sizes.map((size, index) => (
        <SizeCard
          key={size.id}
          size={size}
          sizeLabel={getSizeLabel(index)}
          isSelected={selectedSize === size.id}
          onClick={() => onSelect(size.id)}
          truckImage={truckImage}
        />
      ))}
    </div>
  );
};

interface SizeCardProps {
  size: TruckSize;
  sizeLabel: string;
  isSelected: boolean;
  onClick: () => void;
  truckImage: string;
}

const SizeCard = ({ size, sizeLabel, isSelected, onClick, truckImage }: SizeCardProps) => {
  return (
    <button
      onClick={onClick}
      dir="rtl"
      className={cn(
        'selection-card text-right opacity-0',
        isSelected && 'selected'
      )}
    >
      {/* Header with image */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1">
          <h4 className="text-2xl font-bold text-foreground">{sizeLabel}</h4>
          <p className="text-sm text-muted-foreground mt-1" dir="rtl">מידות: {size.dimensions}</p>
          {size.chassisType && (
            <p className="text-sm text-primary font-medium mt-1" dir="rtl">{size.chassisType}</p>
          )}
        </div>
        <div className="w-20 h-16 rounded-md overflow-hidden bg-secondary/30 flex-shrink-0">
          <img
            src={truckImage}
            alt={sizeLabel}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Features list */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">מה כלול:</p>
        <ul className="space-y-1">
          {size.baseFeatures.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground" dir="rtl">
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