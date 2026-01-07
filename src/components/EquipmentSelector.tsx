import { useState } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { equipment, categoryNames } from '@/data/foodtrucks';
import type { EquipmentCategory } from '@/types/configurator';

interface EquipmentSelectorProps {
  selectedEquipment: Map<string, number>;
  onToggle: (equipmentId: string, quantity: number) => void;
}

export const EquipmentSelector = ({ selectedEquipment, onToggle }: EquipmentSelectorProps) => {
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory>('cooking');
  
  const categories: EquipmentCategory[] = ['cooking', 'refrigeration', 'furniture', 'utilities', 'extras'];
  
  const filteredEquipment = equipment.filter(e => e.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
              activeCategory === category
                ? 'bg-primary text-primary-foreground shadow-gold'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {categoryNames[category]}
          </button>
        ))}
      </div>

      {/* Equipment grid */}
      <div className="stagger-children grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredEquipment.map((item) => {
          const quantity = selectedEquipment.get(item.id) || 0;
          const isSelected = quantity > 0;

          return (
            <div
              key={item.id}
              className={cn(
                'selection-card p-3 opacity-0',
                isSelected && 'selected'
              )}
            >
              {/* Image */}
              <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-secondary/30">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="mb-3">
                <h4 className="font-semibold text-sm text-foreground leading-tight">{item.name}</h4>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                )}
              </div>

              {/* Quantity controls */}
              <div className="flex items-center justify-between">
                {isSelected ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggle(item.id, quantity - 1)}
                      className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-semibold">{quantity}</span>
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
                    className="w-full py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>הוסף</span>
                  </button>
                )}

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                    <Check className="w-4 h-4 text-success-foreground" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected summary */}
      {selectedEquipment.size > 0 && (
        <div className="p-4 rounded-xl bg-accent border border-primary/20">
          <p className="text-sm font-medium text-accent-foreground">
            נבחרו {selectedEquipment.size} פריטים ({Array.from(selectedEquipment.values()).reduce((a, b) => a + b, 0)} יחידות)
          </p>
        </div>
      )}
    </div>
  );
};
