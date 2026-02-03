import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SortableItem } from '@/components/admin/SortableItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface EquipmentCategory {
  id: string;
  name: string;
  name_he: string;
  sort_order: number;
  is_active: boolean;
}

interface Equipment {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const EquipmentManagement = () => {
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['admin-equipment-categories'],
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
  const { data: equipment, isLoading: loadingEquipment } = useQuery({
    queryKey: ['admin-equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Equipment[];
    },
  });

  // Reorder mutation for categories
  const reorderCategoriesMutation = useMutation({
    mutationFn: async (cats: { id: string; sort_order: number }[]) => {
      for (const cat of cats) {
        const { error } = await supabase
          .from('equipment_categories')
          .update({ sort_order: cat.sort_order })
          .eq('id', cat.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipment-categories'] });
      toast({ title: 'הסדר עודכן' });
    },
  });

  // Reorder mutation for equipment
  const reorderEquipmentMutation = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase
          .from('equipment')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipment'] });
      toast({ title: 'הסדר עודכן' });
    },
  });

  // Category mutations
  const saveCategoryMutation = useMutation({
    mutationFn: async (category: Partial<EquipmentCategory> & { id?: string }) => {
      if (category.id) {
        const { error } = await supabase
          .from('equipment_categories')
          .update({ name: category.name, name_he: category.name_he, is_active: category.is_active })
          .eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipment_categories')
          .insert({ 
            name: category.name!, 
            name_he: category.name_he!, 
            sort_order: (categories?.length || 0) + 1 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipment-categories'] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({ title: 'נשמר בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipment-categories'] });
      toast({ title: 'נמחק בהצלחה' });
    },
  });

  // Equipment mutations
  const saveEquipmentMutation = useMutation({
    mutationFn: async (item: Partial<Equipment> & { id?: string }) => {
      if (item.id) {
        const { error } = await supabase
          .from('equipment')
          .update({ 
            name: item.name, 
            description: item.description, 
            image_url: item.image_url,
            category_id: item.category_id,
            is_active: item.is_active 
          })
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert({ 
            category_id: item.category_id!, 
            name: item.name!, 
            description: item.description,
            image_url: item.image_url,
            sort_order: (equipment?.filter(e => e.category_id === item.category_id).length || 0) + 1 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipment'] });
      setIsEquipmentDialogOpen(false);
      setEditingEquipment(null);
      toast({ title: 'נשמר בהצלחה' });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipment'] });
      toast({ title: 'נמחק בהצלחה' });
    },
  });

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    const newOrder = arrayMove(categories, oldIndex, newIndex);
    const updates = newOrder.map((cat, index) => ({ id: cat.id, sort_order: index + 1 }));
    reorderCategoriesMutation.mutate(updates);
  };

  const handleEquipmentDragEnd = (categoryId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !equipment) return;

    const categoryEquipment = equipment.filter((e) => e.category_id === categoryId);
    const oldIndex = categoryEquipment.findIndex((e) => e.id === active.id);
    const newIndex = categoryEquipment.findIndex((e) => e.id === over.id);

    const newOrder = arrayMove(categoryEquipment, oldIndex, newIndex);
    const updates = newOrder.map((item, index) => ({ id: item.id, sort_order: index + 1 }));
    reorderEquipmentMutation.mutate(updates);
  };

  if (loadingCategories || loadingEquipment) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ניהול ציוד</h1>
        <p className="text-muted-foreground">גרור לשינוי סדר • הוסף, ערוך ומחק</p>
      </div>

      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equipment">פריטי ציוד</TabsTrigger>
          <TabsTrigger value="categories">קטגוריות</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingEquipment(null); setSelectedCategoryId(categories?.[0]?.id || null); }}>
                  <Plus className="h-4 w-4 ml-2" />
                  פריט חדש
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEquipment ? 'עריכת פריט' : 'פריט חדש'}</DialogTitle>
                </DialogHeader>
                <EquipmentForm
                  equipment={editingEquipment}
                  categories={categories || []}
                  defaultCategoryId={selectedCategoryId}
                  onSave={(data) => saveEquipmentMutation.mutate(data)}
                  isLoading={saveEquipmentMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {categories?.map((category) => {
            const categoryEquipment = equipment?.filter(e => e.category_id === category.id) || [];
            if (categoryEquipment.length === 0) return null;

            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.name_he}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEquipmentDragEnd(category.id)}>
                    <SortableContext items={categoryEquipment.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {categoryEquipment.map((item) => (
                          <SortableItem key={item.id} id={item.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {item.image_url && (
                                <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCategoryId(item.category_id);
                                    setEditingEquipment(item);
                                    setIsEquipmentDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('האם למחוק את הפריט הזה?')) {
                                      deleteEquipmentMutation.mutate(item.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>
            );
          })}

          {equipment?.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                אין פריטי ציוד עדיין. הוסף קטגוריה ואז פריטים.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCategory(null)}>
                  <Plus className="h-4 w-4 ml-2" />
                  קטגוריה חדשה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</DialogTitle>
                </DialogHeader>
                <CategoryForm
                  category={editingCategory}
                  onSave={(data) => saveCategoryMutation.mutate(data)}
                  isLoading={saveCategoryMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
            <SortableContext items={categories?.map((c) => c.id) || []} strategy={verticalListSortingStrategy}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories?.map((category) => (
                  <SortableItem key={category.id} id={category.id}>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category.name_he}</p>
                          <p className="text-sm text-muted-foreground">{category.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {equipment?.filter(e => e.category_id === category.id).length || 0} פריטים
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setIsCategoryDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('האם למחוק את הקטגוריה הזו? כל הפריטים בה יימחקו גם.')) {
                                deleteCategoryMutation.mutate(category.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {categories?.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                אין קטגוריות עדיין. לחץ על "קטגוריה חדשה" להוספה.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Category Form Component
const CategoryForm = ({ 
  category, 
  onSave, 
  isLoading 
}: { 
  category: EquipmentCategory | null; 
  onSave: (data: Partial<EquipmentCategory>) => void;
  isLoading: boolean;
}) => {
  const [name, setName] = useState(category?.name || '');
  const [nameHe, setNameHe] = useState(category?.name_he || '');
  const [isActive, setIsActive] = useState(category?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: category?.id, name, name_he: nameHe, is_active: isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>שם באנגלית</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="cooking" />
      </div>
      <div className="space-y-2">
        <Label>שם בעברית</Label>
        <Input value={nameHe} onChange={(e) => setNameHe(e.target.value)} required placeholder="ציוד בישול" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <Label>פעיל</Label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
      </Button>
    </form>
  );
};

// Equipment Form Component
const EquipmentForm = ({ 
  equipment, 
  categories,
  defaultCategoryId,
  onSave, 
  isLoading 
}: { 
  equipment: Equipment | null; 
  categories: EquipmentCategory[];
  defaultCategoryId: string | null;
  onSave: (data: Partial<Equipment>) => void;
  isLoading: boolean;
}) => {
  const [name, setName] = useState(equipment?.name || '');
  const [description, setDescription] = useState(equipment?.description || '');
  const [imageUrl, setImageUrl] = useState(equipment?.image_url || '');
  const [categoryId, setCategoryId] = useState(equipment?.category_id || defaultCategoryId || '');
  const [isActive, setIsActive] = useState(equipment?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      id: equipment?.id, 
      name, 
      description: description || null, 
      image_url: imageUrl || null,
      category_id: categoryId,
      is_active: isActive 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>קטגוריה</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger>
            <SelectValue placeholder="בחר קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name_he}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>שם הפריט</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>הערות / מידות</Label>
        <Input 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="לדוגמה: מטר 1, 50x50, 2 ליטר"
        />
      </div>
      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        bucket="equipment-images"
        folder="equipment"
        label="תמונת הפריט"
      />
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <Label>פעיל</Label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
      </Button>
    </form>
  );
};

export default EquipmentManagement;
