import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserPermissions {
  id: string;
  user_id: string;
  can_delete_leads: boolean;
  can_manage_pricing: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserPermissions = (userId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all user permissions (for admin)
  const allPermissionsQuery = useQuery({
    queryKey: ['all-user-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*');
      if (error) throw error;
      return data as UserPermissions[];
    },
    staleTime: 30 * 1000,
  });

  // Fetch specific user permissions
  const userPermissionsQuery = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as UserPermissions | null;
    },
    enabled: !!userId,
  });

  // Update or create user permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      permissions 
    }: { 
      userId: string; 
      permissions: Partial<Pick<UserPermissions, 'can_delete_leads' | 'can_manage_pricing'>> 
    }) => {
      // First check if permissions exist for this user
      const { data: existing } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_permissions')
          .update(permissions)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_permissions')
          .insert({
            user_id: userId,
            ...permissions,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast({ title: 'ההרשאות עודכנו בהצלחה' });
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה בעדכון הרשאות', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Get permissions map by user_id
  const permissionsMap = allPermissionsQuery.data?.reduce((acc, perm) => {
    acc[perm.user_id] = perm;
    return acc;
  }, {} as Record<string, UserPermissions>) || {};

  return {
    allPermissions: allPermissionsQuery.data || [],
    permissionsMap,
    userPermissions: userPermissionsQuery.data,
    isLoading: allPermissionsQuery.isLoading,
    updatePermissions: updatePermissionsMutation.mutate,
    isUpdating: updatePermissionsMutation.isPending,
  };
};
