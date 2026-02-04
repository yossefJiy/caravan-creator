import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Pricing {
  id: string;
  item_type: 'truck_type' | 'truck_size' | 'equipment';
  item_id: string;
  price: number;
  currency: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePricing = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all pricing
  const pricingQuery = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing')
        .select('*')
        .order('item_type', { ascending: true });
      if (error) throw error;
      return data as Pricing[];
    },
  });

  // Create or update pricing
  const upsertPricingMutation = useMutation({
    mutationFn: async (pricing: Omit<Pricing, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      const { id, ...pricingData } = pricing;
      
      if (id) {
        // Update existing
        const { error } = await supabase
          .from('pricing')
          .update(pricingData)
          .eq('id', id);
        if (error) throw error;
      } else {
        // Try upsert by item_type and item_id
        const { error } = await supabase
          .from('pricing')
          .upsert(pricingData, { 
            onConflict: 'item_type,item_id',
            ignoreDuplicates: false 
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast({ title: 'המחיר נשמר בהצלחה' });
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה בשמירת מחיר', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Delete pricing
  const deletePricingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast({ title: 'המחיר נמחק' });
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה במחיקת מחיר', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Get pricing map by item_type and item_id
  const pricingMap = pricingQuery.data?.reduce((acc, pricing) => {
    const key = `${pricing.item_type}:${pricing.item_id}`;
    acc[key] = pricing;
    return acc;
  }, {} as Record<string, Pricing>) || {};

  const getPricing = (itemType: string, itemId: string) => {
    return pricingMap[`${itemType}:${itemId}`] || null;
  };

  return {
    pricing: pricingQuery.data || [],
    pricingMap,
    getPricing,
    isLoading: pricingQuery.isLoading,
    upsertPricing: upsertPricingMutation.mutate,
    deletePricing: deletePricingMutation.mutate,
    isUpdating: upsertPricingMutation.isPending,
    isDeleting: deletePricingMutation.isPending,
  };
};
