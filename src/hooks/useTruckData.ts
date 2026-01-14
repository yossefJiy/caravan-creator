import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Import local images as fallbacks
import cafeTruck from '@/assets/foodtruck-cafe.png';
import pizzaTruck from '@/assets/foodtruck-pizza.png';
import meatTruck from '@/assets/foodtruck-meat.png';

export interface TruckSize {
  id: string;
  name: string;
  dimensions: string;
  baseFeatures: string[];
}

export interface TruckType {
  id: string;
  name: string;
  nameHe: string;
  image: string;
  sizes: TruckSize[];
}

const imageMap: Record<string, string> = {
  '/src/assets/foodtruck-cafe.png': cafeTruck,
  '/src/assets/foodtruck-pizza.png': pizzaTruck,
  '/src/assets/foodtruck-meat.png': meatTruck,
};

export const useTruckData = () => {
  return useQuery({
    queryKey: ['truck-data'],
    queryFn: async (): Promise<TruckType[]> => {
      // Fetch truck types
      const { data: types, error: typesError } = await supabase
        .from('truck_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (typesError) throw typesError;

      // Fetch truck sizes
      const { data: sizes, error: sizesError } = await supabase
        .from('truck_sizes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (sizesError) throw sizesError;

      // Fetch size features
      const { data: features, error: featuresError } = await supabase
        .from('size_features')
        .select('*')
        .order('sort_order');

      if (featuresError) throw featuresError;

      // Map features to sizes
      const featuresMap = new Map<string, string[]>();
      features?.forEach((feature) => {
        const existing = featuresMap.get(feature.truck_size_id) || [];
        existing.push(feature.feature_text);
        featuresMap.set(feature.truck_size_id, existing);
      });

      // Map sizes to types
      const sizesMap = new Map<string, TruckSize[]>();
      sizes?.forEach((size) => {
        const truckSize: TruckSize = {
          id: size.id,
          name: size.name,
          dimensions: size.dimensions,
          baseFeatures: featuresMap.get(size.id) || [],
        };
        const existing = sizesMap.get(size.truck_type_id) || [];
        existing.push(truckSize);
        sizesMap.set(size.truck_type_id, existing);
      });

      // Build final truck types array
      const truckTypes: TruckType[] = (types || []).map((type) => ({
        id: type.id,
        name: type.name,
        nameHe: type.name_he,
        image: imageMap[type.image_url || ''] || type.image_url || cafeTruck,
        sizes: sizesMap.get(type.id) || [],
      }));

      return truckTypes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
