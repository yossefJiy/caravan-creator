import { useState } from 'react';
import { Plus, Minus, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Equipment, EquipmentCategory } from '@/hooks/useEquipmentData';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface EquipmentSelectorProps {
  categories: EquipmentCategory[];
  equipment: Equipment[];
  selectedEquipment: Map<string, number>;
  onToggle: (equipmentId: string, quantity: number) => void;
  onClearAll?: () => void;
}

export const EquipmentSelector = ({ 
  categories, 
  equipment, 
  selectedEquipment, 
  onToggle,
  onClearAll
}: EquipmentSelectorProps) => {
  const [expandedImage, setExpandedImage] = useState<Equipment | null>(null);

  const getEquipmentByCategory = (categoryId: string) => {
    return equipment.filter(e => e.categoryId === categoryId);
  };

  const getCategoryCount = (categoryId: string) => {
    const items = getEquipmentByCategory(categoryId);
    return items.reduce((count, item) => {
      return count + (selectedEquipment.get(item.id) || 0);
    }, 0);
  };

  // Find first category with items to auto-open
  const firstCategoryWithItems = categories.find(c => getEquipmentByCategory(c.id).length > 0);

  return (
    <div className="space-y-4">
      {/* All categories as accordion - single open mode with first auto-opened */}
      <Accordion 
        type="single" 
        collapsible 
        defaultValue={firstCategoryWithItems?.id} 
        className="space-y-3"
      >
        {categories.map((category) => {
          const categoryItems = getEquipmentByCategory(category.id);
          const selectedCount = getCategoryCount(category.id);
          
          if (categoryItems.length === 0) return null;
          
          return (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="border border-border rounded-xl overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{category.nameHe}</span>
                  {selectedCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                      {selectedCount}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  {categoryItems.map((item) => (
                    <EquipmentCard
                      key={item.id}
                      item={item}
                      quantity={selectedEquipment.get(item.id) || 0}
                      onToggle={onToggle}
                      onExpandImage={() => setExpandedImage(item)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Selected summary with clear button */}
      {selectedEquipment.size > 0 && (
        <div className="p-4 rounded-xl bg-accent border border-primary/20 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-accent-foreground">
            נבחרו {selectedEquipment.size} פריטים ({Array.from(selectedEquipment.values()).reduce((a, b) => a + b, 0)} יחידות)
          </p>
          {onClearAll && (
            <button
              onClick={onClearAll}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              נקה הכל
            </button>
          )}
        </div>
      )}

      {/* Image modal */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {expandedImage && (
            <div className="relative">
              <img
                src={expandedImage.image}
                alt={expandedImage.name}
                className="w-full h-auto"
              />
              <div className="p-4 bg-background">
                <h3 className="font-bold text-lg text-foreground">{expandedImage.name}</h3>
                {expandedImage.description && (
                  <p className="text-muted-foreground mt-1">{expandedImage.description}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface EquipmentCardProps {
  item: Equipment;
  quantity: number;
  onToggle: (equipmentId: string, quantity: number) => void;
  onExpandImage: () => void;
}

const EquipmentCard = ({ item, quantity, onToggle, onExpandImage }: EquipmentCardProps) => {
  const isSelected = quantity > 0;

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        isSelected 
          ? 'border-primary/50 bg-accent/30' 
          : 'border-border bg-background hover:border-muted-foreground/30'
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div 
          className="w-14 h-14 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0 cursor-pointer group relative"
          onClick={onExpandImage}
        >
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ZoomIn className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground leading-tight">{item.name}</h4>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
          )}
        </div>

        {/* Add/Quantity controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSelected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(item.id, quantity - 1)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-semibold text-sm">{quantity}</span>
              <button
                onClick={() => onToggle(item.id, quantity + 1)}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onToggle(item.id, 1)}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
