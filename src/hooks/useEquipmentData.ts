import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EquipmentCategory {
  id: string;
  name: string;
  nameHe: string;
  sortOrder: number;
}

export interface Equipment {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  image: string;
  sortOrder: number;
}

export const useEquipmentData = () => {
  const categoriesQuery = useQuery({
    queryKey: ['equipment-categories'],
    queryFn: async (): Promise<EquipmentCategory[]> => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      return (data || []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        nameHe: cat.name_he,
        sortOrder: cat.sort_order,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const equipmentQuery = useQuery({
    queryKey: ['equipment'],
    queryFn: async (): Promise<Equipment[]> => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      return (data || []).map((eq) => ({
        id: eq.id,
        name: eq.name,
        description: eq.description,
        categoryId: eq.category_id,
        image: eq.image_url || '',
        sortOrder: eq.sort_order,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    categories: categoriesQuery.data || [],
    equipment: equipmentQuery.data || [],
    isLoading: categoriesQuery.isLoading || equipmentQuery.isLoading,
    error: categoriesQuery.error || equipmentQuery.error,
  };
};
