import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Check, GripVertical, Copy } from 'lucide-react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SizeFeature {
  id: string;
  truck_size_id: string;
  feature_text: string;
  sort_order: number;
}

interface TruckSize {
  id: string;
  name: string;
  truck_type_id: string;
}

interface TruckType {
  id: string;
  name_he: string;
}

interface FeaturesManagerProps {
  sizeId: string;
  sizeName: string;
  features: SizeFeature[];
  allSizes: TruckSize[];
  allTypes: TruckType[];
}

const SortableFeature = ({ 
  feature, 
  onDelete, 
  onUpdate,
  isUpdating 
}: { 
  feature: SizeFeature; 
  onDelete: () => void;
  onUpdate: (text: string) => void;
  isUpdating: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(feature.feature_text);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editText.trim() && editText !== feature.feature_text) {
      onUpdate(editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-background rounded-md border"
    >
      <button {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setEditText(feature.feature_text);
                setIsEditing(false);
              }
            }}
          />
          <Button size="sm" variant="ghost" onClick={handleSave} disabled={isUpdating}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditText(feature.feature_text); setIsEditing(false); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span 
            className="flex-1 text-sm cursor-pointer hover:text-primary" 
            onClick={() => setIsEditing(true)}
          >
            {feature.feature_text}
          </span>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );
};

export const FeaturesManager = ({ sizeId, sizeName, features, allSizes, allTypes }: FeaturesManagerProps) => {
  const [newFeature, setNewFeature] = useState('');
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sizeFeatures = features
    .filter(f => f.truck_size_id === sizeId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const addFeatureMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from('size_features')
        .insert({
          truck_size_id: sizeId,
          feature_text: text,
          sort_order: sizeFeatures.length + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-size-features'] });
      setNewFeature('');
      toast({ title: 'תכונה נוספה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { error } = await supabase
        .from('size_features')
        .update({ feature_text: text })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-size-features'] });
      toast({ title: 'תכונה עודכנה' });
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('size_features')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-size-features'] });
      toast({ title: 'תכונה נמחקה' });
    },
  });

  const reorderFeaturesMutation = useMutation({
    mutationFn: async (orderedFeatures: { id: string; sort_order: number }[]) => {
      for (const feature of orderedFeatures) {
        const { error } = await supabase
          .from('size_features')
          .update({ sort_order: feature.sort_order })
          .eq('id', feature.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-size-features'] });
    },
  });

  const applyToSizesMutation = useMutation({
    mutationFn: async (targetSizeIds: string[]) => {
      // Get current features for this size
      const currentFeatures = sizeFeatures.map(f => f.feature_text);
      
      for (const targetSizeId of targetSizeIds) {
        if (targetSizeId === sizeId) continue;
        
        // Delete existing features for target size
        await supabase
          .from('size_features')
          .delete()
          .eq('truck_size_id', targetSizeId);
        
        // Insert new features
        for (let i = 0; i < currentFeatures.length; i++) {
          const { error } = await supabase
            .from('size_features')
            .insert({
              truck_size_id: targetSizeId,
              feature_text: currentFeatures[i],
              sort_order: i + 1,
            });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-size-features'] });
      setIsApplyDialogOpen(false);
      setSelectedSizes(new Set());
      toast({ title: 'התכונות הוחלו בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sizeFeatures.findIndex((f) => f.id === active.id);
    const newIndex = sizeFeatures.findIndex((f) => f.id === over.id);

    const newOrder = arrayMove(sizeFeatures, oldIndex, newIndex);
    const updates = newOrder.map((feature, index) => ({ id: feature.id, sort_order: index + 1 }));
    reorderFeaturesMutation.mutate(updates);
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      addFeatureMutation.mutate(newFeature.trim());
    }
  };

  const toggleSize = (sizeId: string) => {
    const newSelected = new Set(selectedSizes);
    if (newSelected.has(sizeId)) {
      newSelected.delete(sizeId);
    } else {
      newSelected.add(sizeId);
    }
    setSelectedSizes(newSelected);
  };

  const selectAllInType = (typeId: string) => {
    const typeSizes = allSizes.filter(s => s.truck_type_id === typeId && s.id !== sizeId);
    const newSelected = new Set(selectedSizes);
    typeSizes.forEach(s => newSelected.add(s.id));
    setSelectedSizes(newSelected);
  };

  const selectAll = () => {
    const allIds = allSizes.filter(s => s.id !== sizeId).map(s => s.id);
    setSelectedSizes(new Set(allIds));
  };

  // Group sizes by type for the dialog
  const sizesByType = allTypes.map(type => ({
    type,
    sizes: allSizes.filter(s => s.truck_type_id === type.id && s.id !== sizeId),
  })).filter(group => group.sizes.length > 0);

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium">תכונות - "{sizeName}"</h5>
        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={sizeFeatures.length === 0}>
              <Copy className="h-3 w-3 ml-1" />
              החל על גדלים אחרים
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>החל תכונות על גדלים אחרים</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                בחר את הגדלים שעליהם תרצה להחיל את התכונות מ-"{sizeName}".
                <br />
                <strong className="text-destructive">שים לב:</strong> פעולה זו תחליף את התכונות הקיימות.
              </p>
              
              <Button size="sm" variant="outline" onClick={selectAll} className="w-full">
                בחר הכל
              </Button>
              
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {sizesByType.map(({ type, sizes }) => (
                    <div key={type.id}>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-semibold">{type.name_he}</Label>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => selectAllInType(type.id)}
                          className="text-xs h-6"
                        >
                          בחר הכל
                        </Button>
                      </div>
                      <div className="space-y-2 pr-4">
                        {sizes.map(size => (
                          <div key={size.id} className="flex items-center gap-2">
                            <Checkbox
                              id={size.id}
                              checked={selectedSizes.has(size.id)}
                              onCheckedChange={() => toggleSize(size.id)}
                            />
                            <Label htmlFor={size.id} className="text-sm cursor-pointer">
                              {size.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <Button
                className="w-full"
                disabled={selectedSizes.size === 0 || applyToSizesMutation.isPending}
                onClick={() => applyToSizesMutation.mutate(Array.from(selectedSizes))}
              >
                {applyToSizesMutation.isPending ? 'מחיל...' : `החל על ${selectedSizes.size} גדלים`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sizeFeatures.map(f => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sizeFeatures.map((feature) => (
              <SortableFeature
                key={feature.id}
                feature={feature}
                onDelete={() => deleteFeatureMutation.mutate(feature.id)}
                onUpdate={(text) => updateFeatureMutation.mutate({ id: feature.id, text })}
                isUpdating={updateFeatureMutation.isPending}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sizeFeatures.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">אין תכונות עדיין</p>
      )}

      <div className="flex gap-2">
        <Input
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          placeholder="הוסף תכונה חדשה..."
          className="flex-1 h-9"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddFeature();
          }}
        />
        <Button
          size="sm"
          onClick={handleAddFeature}
          disabled={!newFeature.trim() || addFeatureMutation.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
