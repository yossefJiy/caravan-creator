import { ChevronLeft } from 'lucide-react';
import { foodTruckTypes } from '@/data/foodtrucks';

interface SelectedTruckSummaryProps {
  selectedType: string;
  selectedSize: string;
  onEdit: () => void;
}

export const SelectedTruckSummary = ({ 
  selectedType, 
  selectedSize, 
  onEdit 
}: SelectedTruckSummaryProps) => {
  const truckType = foodTruckTypes.find(t => t.id === selectedType);
  const size = truckType?.sizes.find(s => s.id === selectedSize);

  if (!truckType || !size) return null;

  return (
    <button
      onClick={onEdit}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group"
    >
      {/* Image */}
      <div className="w-16 h-12 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
        <img
          src={truckType.image}
          alt={truckType.nameHe}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 text-right">
        <h4 className="font-semibold text-foreground">{truckType.nameHe}</h4>
        <p className="text-sm text-muted-foreground">
          {size.name} • {size.dimensions}
        </p>
      </div>

      {/* Edit indicator */}
      <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-sm font-medium">שנה בחירה</span>
        <ChevronLeft className="w-4 h-4" />
      </div>
    </button>
  );
};
