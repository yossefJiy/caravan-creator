import { useState } from 'react';
import { Plus, Minus, Check, ChevronDown, ChevronUp, ZoomIn, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { equipment, categoryNames } from '@/data/foodtrucks';
import type { Equipment, EquipmentCategory } from '@/types/configurator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';

interface EquipmentSelectorProps {
  selectedEquipment: Map<string, number>;
  onToggle: (equipmentId: string, quantity: number) => void;
}

export const EquipmentSelector = ({ selectedEquipment, onToggle }: EquipmentSelectorProps) => {
  const [expandedImage, setExpandedImage] = useState<Equipment | null>(null);
  
  const categories: EquipmentCategory[] = ['cooking', 'refrigeration', 'furniture', 'utilities', 'extras'];

  const getEquipmentByCategory = (category: EquipmentCategory) => {
    return equipment.filter(e => e.category === category);
  };

  const getCategoryCount = (category: EquipmentCategory) => {
    const items = getEquipmentByCategory(category);
    return items.reduce((count, item) => {
      return count + (selectedEquipment.get(item.id) || 0);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* All categories as accordion */}
      <Accordion type="multiple" className="space-y-3">
        {categories.map((category) => {
          const categoryItems = getEquipmentByCategory(category);
          const selectedCount = getCategoryCount(category);
          
          return (
            <AccordionItem
              key={category}
              value={category}
              className="border border-border rounded-xl overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30 [&[data-state=open]>div>.chevron]:rotate-180">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{categoryNames[category]}</span>
                    {selectedCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                        {selectedCount}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="chevron w-5 h-5 text-muted-foreground transition-transform duration-200" />
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

      {/* Selected summary */}
      {selectedEquipment.size > 0 && (
        <div className="p-4 rounded-xl bg-accent border border-primary/20">
          <p className="text-sm font-medium text-accent-foreground">
            נבחרו {selectedEquipment.size} פריטים ({Array.from(selectedEquipment.values()).reduce((a, b) => a + b, 0)} יחידות)
          </p>
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
  const [isExpanded, setIsExpanded] = useState(false);
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
      {/* Main row - always visible */}
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

        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 animate-fade-in">
          <div className="flex gap-3 pt-3 border-t border-border/50">
            <div 
              className="w-24 h-24 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0 cursor-pointer"
              onClick={onExpandImage}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-foreground">{item.name}</h5>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              )}
              <button
                onClick={onExpandImage}
                className="mt-2 text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                <ZoomIn className="w-3 h-3" />
                צפה בתמונה מוגדלת
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
