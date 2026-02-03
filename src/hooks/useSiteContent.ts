import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SiteContent {
  content_key: string;
  content_value: string;
}

export const useSiteContent = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['site-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('content_key, content_value');
      
      if (error) throw error;
      
      // Convert array to key-value object for easy access
      const contentMap: Record<string, string> = {};
      data?.forEach((item: SiteContent) => {
        contentMap[item.content_key] = item.content_value;
      });
      
      return contentMap;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Helper function to get content with fallback
  const getContent = (key: string, fallback: string = ''): string => {
    return data?.[key] || fallback;
  };

  return {
    content: data || {},
    getContent,
    isLoading,
    error,
  };
};
