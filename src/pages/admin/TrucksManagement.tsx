import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

interface TruckType {
  id: string;
  name: string;
  name_he: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

interface TruckSize {
  id: string;
  truck_type_id: string;
  name: string;
  dimensions: string;
  chassis_type: string | null;
  sort_order: number;
  is_active: boolean;
}

interface SizeFeature {
  id: string;
  truck_size_id: string;
  feature_text: string;
  sort_order: number;
}

const TrucksManagement = () => {
  const [editingType, setEditingType] = useState<TruckType | null>(null);
  const [editingSize, setEditingSize] = useState<TruckSize | null>(null);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isSizeDialogOpen, setIsSizeDialogOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch truck types
  const { data: truckTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['admin-truck-types'],
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
  const { data: truckSizes, isLoading: loadingSizes } = useQuery({
    queryKey: ['admin-truck-sizes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_sizes')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as TruckSize[];
    },
  });

  // Fetch size features
  const { data: sizeFeatures } = useQuery({
    queryKey: ['admin-size-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('size_features')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as SizeFeature[];
    },
  });

  // Reorder mutation for types
  const reorderTypesMutation = useMutation({
    mutationFn: async (types: { id: string; sort_order: number }[]) => {
      for (const type of types) {
        const { error } = await supabase
          .from('truck_types')
          .update({ sort_order: type.sort_order })
          .eq('id', type.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-truck-types'] });
      toast({ title: 'הסדר עודכן' });
    },
  });

  // Reorder mutation for sizes
  const reorderSizesMutation = useMutation({
    mutationFn: async (sizes: { id: string; sort_order: number }[]) => {
      for (const size of sizes) {
        const { error } = await supabase
          .from('truck_sizes')
          .update({ sort_order: size.sort_order })
          .eq('id', size.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-truck-sizes'] });
      toast({ title: 'הסדר עודכן' });
    },
  });

  // Mutations for truck types
  const saveTypeMutation = useMutation({
    mutationFn: async (type: Partial<TruckType> & { id?: string }) => {
      if (type.id) {
        const { error } = await supabase
          .from('truck_types')
          .update({ name: type.name, name_he: type.name_he, image_url: type.image_url, is_active: type.is_active })
          .eq('id', type.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('truck_types')
          .insert({ name: type.name!, name_he: type.name_he!, image_url: type.image_url, sort_order: (truckTypes?.length || 0) + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-truck-types'] });
      setIsTypeDialogOpen(false);
      setEditingType(null);
      toast({ title: 'נשמר בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('truck_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-truck-types'] });
      toast({ title: 'נמחק בהצלחה' });
    },
  });

  // Mutations for truck sizes
  const saveSizeMutation = useMutation({
    mutationFn: async (size: Partial<TruckSize> & { id?: string }) => {
      if (size.id) {
        const { error } = await supabase
          .from('truck_sizes')
          .update({ name: size.name, dimensions: size.dimensions, chassis_type: size.chassis_type, is_active: size.is_active })
          .eq('id', size.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('truck_sizes')
          .insert({ 
            truck_type_id: selectedTypeId!, 
            name: size.name!, 
            dimensions: size.dimensions!, 
            chassis_type: size.chassis_type,
            sort_order: (truckSizes?.filter(s => s.truck_type_id === selectedTypeId).length || 0) + 1 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-truck-sizes'] });
      setIsSizeDialogOpen(false);
      setEditingSize(null);
      toast({ title: 'נשמר בהצלחה' });
    },
  });

  const deleteSizeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('truck_sizes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-truck-sizes'] });
      toast({ title: 'נמחק בהצלחה' });
    },
  });

  const toggleExpanded = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const handleTypeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !truckTypes) return;

    const oldIndex = truckTypes.findIndex((t) => t.id === active.id);
    const newIndex = truckTypes.findIndex((t) => t.id === over.id);

    const newOrder = arrayMove(truckTypes, oldIndex, newIndex);
    const updates = newOrder.map((type, index) => ({ id: type.id, sort_order: index + 1 }));
    reorderTypesMutation.mutate(updates);
  };

  const handleSizeDragEnd = (typeId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !truckSizes) return;

    const typeSizes = truckSizes.filter((s) => s.truck_type_id === typeId);
    const oldIndex = typeSizes.findIndex((s) => s.id === active.id);
    const newIndex = typeSizes.findIndex((s) => s.id === over.id);

    const newOrder = arrayMove(typeSizes, oldIndex, newIndex);
    const updates = newOrder.map((size, index) => ({ id: size.id, sort_order: index + 1 }));
    reorderSizesMutation.mutate(updates);
  };

  if (loadingTypes || loadingSizes) {
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ניהול סוגי טראקים</h1>
          <p className="text-muted-foreground">גרור לשינוי סדר • הוסף, ערוך ומחק</p>
        </div>
        <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingType(null)}>
              <Plus className="h-4 w-4 ml-2" />
              סוג חדש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? 'עריכת סוג' : 'סוג חדש'}</DialogTitle>
            </DialogHeader>
            <TypeForm
              type={editingType}
              onSave={(data) => saveTypeMutation.mutate(data)}
              isLoading={saveTypeMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTypeDragEnd}>
        <SortableContext items={truckTypes?.map((t) => t.id) || []} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {truckTypes?.map((type) => (
              <SortableItem key={type.id} id={type.id}>
                <Card>
                  <Collapsible open={expandedTypes.has(type.id)} onOpenChange={() => toggleExpanded(type.id)}>
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                      <div className="flex items-center gap-4">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedTypes.has(type.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        {type.image_url && (
                          <img src={type.image_url} alt={type.name_he} className="w-16 h-12 object-cover rounded" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{type.name_he}</CardTitle>
                          <p className="text-sm text-muted-foreground">{type.name}</p>
                        </div>
                        {!type.is_active && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">לא פעיל</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingType(type);
                            setIsTypeDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('האם למחוק את הסוג הזה?')) {
                              deleteTypeMutation.mutate(type.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">גדלים</h4>
                          <Dialog open={isSizeDialogOpen && selectedTypeId === type.id} onOpenChange={setIsSizeDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedTypeId(type.id); setEditingSize(null); }}>
                                <Plus className="h-4 w-4 ml-1" />
                                גודל חדש
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{editingSize ? 'עריכת גודל' : 'גודל חדש'}</DialogTitle>
                              </DialogHeader>
                              <SizeForm
                                size={editingSize}
                                onSave={(data) => saveSizeMutation.mutate(data)}
                                isLoading={saveSizeMutation.isPending}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSizeDragEnd(type.id)}>
                          <SortableContext items={truckSizes?.filter(s => s.truck_type_id === type.id).map((s) => s.id) || []} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                              {truckSizes?.filter(s => s.truck_type_id === type.id).map((size) => (
                                <SortableItem key={size.id} id={size.id} className="p-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{size.name}</p>
                                      <p className="text-sm text-muted-foreground">{size.dimensions} {size.chassis_type && `• ${size.chassis_type}`}</p>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {sizeFeatures?.filter(f => f.truck_size_id === size.id).map(f => f.feature_text).join(' • ')}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedTypeId(type.id);
                                          setEditingSize(size);
                                          setIsSizeDialogOpen(true);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          if (confirm('האם למחוק את הגודל הזה?')) {
                                            deleteSizeMutation.mutate(size.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}
                              {truckSizes?.filter(s => s.truck_type_id === type.id).length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">אין גדלים עדיין</p>
                              )}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </SortableItem>
            ))}
            
            {truckTypes?.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  אין סוגי טראקים עדיין. לחץ על "סוג חדש" להוספה.
                </CardContent>
              </Card>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

// Type Form Component
const TypeForm = ({ 
  type, 
  onSave, 
  isLoading 
}: { 
  type: TruckType | null; 
  onSave: (data: Partial<TruckType>) => void;
  isLoading: boolean;
}) => {
  const [name, setName] = useState(type?.name || '');
  const [nameHe, setNameHe] = useState(type?.name_he || '');
  const [imageUrl, setImageUrl] = useState(type?.image_url || '');
  const [isActive, setIsActive] = useState(type?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: type?.id,
      name,
      name_he: nameHe,
      image_url: imageUrl || null,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>שם באנגלית</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>שם בעברית</Label>
        <Input value={nameHe} onChange={(e) => setNameHe(e.target.value)} required />
      </div>
      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        bucket="equipment-images"
        folder="trucks"
        label="תמונת סוג הטראק"
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

// Size Form Component
const SizeForm = ({ 
  size, 
  onSave, 
  isLoading 
}: { 
  size: TruckSize | null; 
  onSave: (data: Partial<TruckSize>) => void;
  isLoading: boolean;
}) => {
  const [name, setName] = useState(size?.name || '');
  const [dimensions, setDimensions] = useState(size?.dimensions || '');
  const [chassisType, setChassisType] = useState(size?.chassis_type || '');
  const [isActive, setIsActive] = useState(size?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: size?.id,
      name,
      dimensions,
      chassis_type: chassisType || null,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>שם הגודל</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Vesuvia 28" />
      </div>
      <div className="space-y-2">
        <Label>מידות</Label>
        <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} required placeholder="2.8 x 2 מטר" />
      </div>
      <div className="space-y-2">
        <Label>סוג שילדה</Label>
        <Input value={chassisType} onChange={(e) => setChassisType(e.target.value)} placeholder="שולי נמוך 900" />
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

export default TrucksManagement;
