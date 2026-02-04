import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePricing } from '@/hooks/usePricing';
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
  description: string | null;
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

interface EditingPrices {
  cost: string;
  sale: string;
}

const PricingManagement = () => {
  const { getPricing, upsertPricing } = usePricing();
  const [editingPrices, setEditingPrices] = useState<Record<string, EditingPrices>>({});
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

  const getPrices = (itemType: string, itemId: string): EditingPrices => {
    const key = `${itemType}:${itemId}`;
    if (editingPrices[key]) {
      return editingPrices[key];
    }
    const existingPricing = getPricing(itemType, itemId);
    return {
      cost: existingPricing ? existingPricing.cost_price.toString() : '',
      sale: existingPricing ? existingPricing.sale_price.toString() : '',
    };
  };

  const handlePriceChange = (itemType: string, itemId: string, field: 'cost' | 'sale', value: string) => {
    const key = `${itemType}:${itemId}`;
    setEditingPrices(prev => ({
      ...prev,
      [key]: {
        ...getPrices(itemType, itemId),
        [field]: value,
      },
    }));
  };

  const handleSavePrice = async (itemType: 'truck_size' | 'equipment', itemId: string) => {
    const key = `${itemType}:${itemId}`;
    const prices = editingPrices[key];
    
    if (!prices) return;
    
    const costPrice = parseFloat(prices.cost) || 0;
    const salePrice = parseFloat(prices.sale) || 0;
    setSavingItem(key);
    
    const existingPricing = getPricing(itemType, itemId);
    
    upsertPricing({
      id: existingPricing?.id,
      item_type: itemType,
      item_id: itemId,
      cost_price: costPrice,
      sale_price: salePrice,
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

  const hasChanges = (itemType: string, itemId: string) => {
    const key = `${itemType}:${itemId}`;
    return editingPrices[key] !== undefined;
  };

  if (loadingTrucks || loadingCategories) {
    return (
      <div className="p-6 space-y-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
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
                    <div className="flex items-center justify-between w-full">
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
                        <Badge variant="secondary" className="ml-4">
                          {pricedSizesCount}/{sizes.length} מתומחרים
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-right py-2 px-2 font-medium">גודל</th>
                            <th className="text-right py-2 px-2 font-medium">מידות</th>
                            <th className="text-center py-2 px-2 font-medium w-24">עלות</th>
                            <th className="text-center py-2 px-2 font-medium w-24">מכירה</th>
                            <th className="text-left py-2 px-2 font-medium w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sizes.length > 0 ? (
                            sizes.map((size) => {
                              const prices = getPrices('truck_size', size.id);
                              return (
                                <tr key={size.id} className="border-b last:border-b-0">
                                  <td className="py-3 px-2">
                                    <p className="font-medium">{size.name}</p>
                                  </td>
                                  <td className="py-3 px-2">
                                    <p className="text-muted-foreground">{size.dimensions}</p>
                                  </td>
                                  <td className="py-3 px-2">
                                    <Input
                                      type="number"
                                      placeholder="₪"
                                      value={prices.cost}
                                      onChange={(e) => handlePriceChange('truck_size', size.id, 'cost', e.target.value)}
                                      className="text-center h-9"
                                      dir="ltr"
                                    />
                                  </td>
                                  <td className="py-3 px-2">
                                    <Input
                                      type="number"
                                      placeholder="₪"
                                      value={prices.sale}
                                      onChange={(e) => handlePriceChange('truck_size', size.id, 'sale', e.target.value)}
                                      className="text-center h-9"
                                      dir="ltr"
                                    />
                                  </td>
                                  <td className="py-3 px-2 text-left">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-9 w-9"
                                      onClick={() => handleSavePrice('truck_size', size.id)}
                                      disabled={savingItem === `truck_size:${size.id}` || !hasChanges('truck_size', size.id)}
                                    >
                                      {savingItem === `truck_size:${size.id}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Save className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center text-muted-foreground py-4">
                                אין גדלים לסוג טראק זה
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-right py-2 px-2 font-medium w-14">תמונה</th>
                            <th className="text-right py-2 px-2 font-medium">מוצר</th>
                            <th className="text-right py-2 px-2 font-medium">תיאור</th>
                            <th className="text-center py-2 px-2 font-medium w-24">עלות</th>
                            <th className="text-center py-2 px-2 font-medium w-24">מכירה</th>
                            <th className="text-left py-2 px-2 font-medium w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryEquipment.map((item) => {
                            const prices = getPrices('equipment', item.id);
                            return (
                              <tr key={item.id} className="border-b last:border-b-0">
                                <td className="py-3 px-2">
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
                                </td>
                                <td className="py-3 px-2">
                                  <p className="font-medium">{item.name}</p>
                                  {!item.is_active && (
                                    <Badge variant="outline" className="text-muted-foreground text-xs">
                                      לא פעיל
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-3 px-2">
                                  <p className="text-muted-foreground text-sm">
                                    {item.description || '—'}
                                  </p>
                                </td>
                                <td className="py-3 px-2">
                                  <Input
                                    type="number"
                                    placeholder="₪"
                                    value={prices.cost}
                                    onChange={(e) => handlePriceChange('equipment', item.id, 'cost', e.target.value)}
                                    className="text-center h-9"
                                    dir="ltr"
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <Input
                                    type="number"
                                    placeholder="₪"
                                    value={prices.sale}
                                    onChange={(e) => handlePriceChange('equipment', item.id, 'sale', e.target.value)}
                                    className="text-center h-9"
                                    dir="ltr"
                                  />
                                </td>
                                <td className="py-3 px-2 text-left">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9"
                                    onClick={() => handleSavePrice('equipment', item.id)}
                                    disabled={savingItem === `equipment:${item.id}` || !hasChanges('equipment', item.id)}
                                  >
                                    {savingItem === `equipment:${item.id}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                          {categoryEquipment.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center text-muted-foreground py-4">
                                אין ציוד בקטגוריה זו
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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