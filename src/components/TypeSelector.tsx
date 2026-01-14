import { cn } from '@/lib/utils';
import type { TruckType } from '@/hooks/useTruckData';

interface TypeSelectorProps {
  truckTypes: TruckType[];
  selectedType: string | null;
  onSelect: (typeId: string) => void;
}

export const TypeSelector = ({ truckTypes, selectedType, onSelect }: TypeSelectorProps) => {
  return (
    <div className="stagger-children grid grid-cols-1 sm:grid-cols-3 gap-4">
      {truckTypes.map((type) => (
        <button
          key={type.id}
          onClick={() => onSelect(type.id)}
          className={cn(
            'selection-card flex flex-col items-center p-6 opacity-0',
            selectedType === type.id && 'selected'
          )}
        >
          <div className="w-full aspect-[4/3] mb-4 overflow-hidden rounded-lg bg-secondary/50">
            <img
              src={type.image}
              alt={type.nameHe}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{type.nameHe}</h3>
          <p className="text-sm text-muted-foreground">{type.name}</p>
        </button>
      ))}
    </div>
  );
};
