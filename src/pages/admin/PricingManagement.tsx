import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePricing } from '@/hooks/usePricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Truck, Package, Save, Loader2 } from 'lucide-react';

interface TruckType {
  id: string;
  name: string;
  name_he: string;
  is_active: boolean;
  image_url: string | null;
}

interface TruckSize {
  id: string;
  name: string;
  dimensions: string;
  truck_type_id: string;
  is_active: boolean;
}

interface Equipment {
  id: string;
  name: string;
  category_id: string;
  is_active: boolean;
  image_url: string | null;
}

interface EquipmentCategory {
  id: string;
  name: string;
  name_he: string;
  is_active: boolean;
}

const PricingManagement = () => {
  const { pricing, getPricing, upsertPricing, isUpdating } = usePricing();
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [savingItem, setSavingItem] = useState<string | null>(null);

  // Fetch truck types
  const { data: truckTypes, isLoading: loadingTrucks } = useQuery({
    queryKey: ['admin-truck-types-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_types')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as TruckType[];
    },
  });

  // Fetch truck sizes
  const { data: truckSizes } = useQuery({
    queryKey: ['admin-truck-sizes-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_sizes')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as TruckSize[];
    },
  });

  // Fetch equipment categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['admin-equipment-categories-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as EquipmentCategory[];
    },
  });

  // Fetch equipment
  const { data: equipment } = useQuery({
    queryKey: ['admin-equipment-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Equipment[];
    },
  });

  const getPrice = (itemType: string, itemId: string) => {
    const key = `${itemType}:${itemId}`;
    if (editingPrices[key] !== undefined) {
      return editingPrices[key];
    }
    const existingPricing = getPricing(itemType, itemId);
    return existingPricing ? existingPricing.price.toString() : '';
  };

  const handlePriceChange = (itemType: string, itemId: string, value: string) => {
    const key = `${itemType}:${itemId}`;
    setEditingPrices(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePrice = async (itemType: 'truck_size' | 'equipment', itemId: string) => {
    const key = `${itemType}:${itemId}`;
    const priceValue = editingPrices[key];
    
    if (priceValue === undefined) return;
    
    const price = parseFloat(priceValue) || 0;
    setSavingItem(key);
    
    const existingPricing = getPricing(itemType, itemId);
    
    upsertPricing({
      id: existingPricing?.id,
      item_type: itemType,
      item_id: itemId,
      price,
      currency: 'ILS',
      notes: null,
      is_active: true,
    }, {
      onSettled: () => {
        setSavingItem(null);
        setEditingPrices(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      },
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loadingTrucks || loadingCategories) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ניהול מחירונים</h1>
        <p className="text-muted-foreground">
          הגדרת מחירים לטראקים וציוד לצורך הפקת הצעות מחיר
        </p>
      </div>

      <Tabs defaultValue="trucks" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="trucks" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            סוגי טראקים
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            ציוד
          </TabsTrigger>
        </TabsList>

        {/* Trucks Tab */}
        <TabsContent value="trucks" className="space-y-4">
          <Accordion type="multiple" className="space-y-3">
            {truckTypes?.map((truckType) => {
              const sizes = truckSizes?.filter(s => s.truck_type_id === truckType.id) || [];
              const pricedSizesCount = sizes.filter(s => getPricing('truck_size', s.id)).length;
              
              return (
                <AccordionItem
                  key={truckType.id}
                  value={truckType.id}
                  className="border border-border rounded-xl overflow-hidden bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
                    <div className="flex items-center justify-between w-full pl-4">
                      <div className="flex items-center gap-3">
                        {truckType.image_url && (
                          <img 
                            src={truckType.image_url} 
                            alt={truckType.name_he}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        )}
                        <span className="font-semibold">{truckType.name_he}</span>
                        {!truckType.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">לא פעיל</Badge>
                        )}
                      </div>
                      {pricedSizesCount > 0 && (
                        <Badge variant="secondary">
                          {pricedSizesCount}/{sizes.length} מתומחרים
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {sizes.length > 0 ? (
                        sizes.map((size) => {
                          const sizePricing = getPricing('truck_size', size.id);
                          return (
                            <div 
                              key={size.id} 
                              className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{size.name}</p>
                                <p className="text-sm text-muted-foreground">{size.dimensions}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="מחיר ב-₪"
                                  value={getPrice('truck_size', size.id)}
                                  onChange={(e) => handlePriceChange('truck_size', size.id, e.target.value)}
                                  className="w-32 text-left"
                                  dir="ltr"
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleSavePrice('truck_size', size.id)}
                                  disabled={savingItem === `truck_size:${size.id}` || editingPrices[`truck_size:${size.id}`] === undefined}
                                >
                                  {savingItem === `truck_size:${size.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              {sizePricing && (
                                <Badge variant="outline" className="min-w-fit">
                                  {formatPrice(sizePricing.price)}
                                </Badge>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          אין גדלים לסוג טראק זה
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <Accordion type="multiple" className="space-y-3">
            {categories?.map((category) => {
              const categoryEquipment = equipment?.filter(e => e.category_id === category.id) || [];
              const pricedCount = categoryEquipment.filter(e => getPricing('equipment', e.id)).length;
              
              return (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border border-border rounded-xl overflow-hidden bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{category.name_he}</span>
                      {pricedCount > 0 && (
                        <Badge variant="secondary">
                          {pricedCount}/{categoryEquipment.length} מתומחרים
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {categoryEquipment.map((item) => {
                        const itemPricing = getPricing('equipment', item.id);
                        return (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {!item.is_active && (
                                  <Badge variant="outline" className="text-muted-foreground text-xs">
                                    לא פעיל
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="מחיר ב-₪"
                                value={getPrice('equipment', item.id)}
                                onChange={(e) => handlePriceChange('equipment', item.id, e.target.value)}
                                className="w-32 text-left"
                                dir="ltr"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleSavePrice('equipment', item.id)}
                                disabled={savingItem === `equipment:${item.id}` || editingPrices[`equipment:${item.id}`] === undefined}
                              >
                                {savingItem === `equipment:${item.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {itemPricing && (
                              <Badge variant="outline" className="min-w-fit">
                                {formatPrice(itemPricing.price)}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                      {categoryEquipment.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          אין ציוד בקטגוריה זו
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PricingManagement;
