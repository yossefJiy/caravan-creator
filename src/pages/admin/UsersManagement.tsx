import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, UserPlus, Shield, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'client';
  created_at: string;
}

const UsersManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user roles
  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserRole[];
    },
  });

  // Create client user mutation
  const createClientMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-client-user', {
        body: { email, password },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create user');
      }
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      setIsDialogOpen(false);
      setEmail('');
      setPassword('');
      toast({ 
        title: 'משתמש נוצר בהצלחה', 
        description: `${data.email} יכול כעת להתחבר למערכת` 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'שגיאה ביצירת משתמש', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    createClientMutation.mutate({ email, password });
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'אדמין', icon: Shield, variant: 'default' as const };
      case 'client':
        return { label: 'לקוח', icon: User, variant: 'secondary' as const };
      default:
        return { label: role, icon: User, variant: 'outline' as const };
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
          <p className="text-muted-foreground">הוספת משתמשי לקוח עם גישה מוגבלת</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 ml-2" />
              משתמש לקוח חדש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>יצירת משתמש לקוח</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="סיסמה חזקה"
                  required
                  minLength={6}
                />
              </div>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium mb-1">הרשאות משתמש לקוח:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>✓ צפייה ועדכון לידים</li>
                  <li>✓ ניהול סוגי טראקים וגדלים</li>
                  <li>✓ ניהול ציוד</li>
                  <li>✗ ניהול תוכן האתר</li>
                  <li>✗ יצירת תוכן AI</li>
                  <li>✗ ניהול משתמשים</li>
                </ul>
              </div>
              <Button type="submit" className="w-full" disabled={createClientMutation.isPending}>
                {createClientMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    יוצר משתמש...
                  </>
                ) : (
                  'צור משתמש'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {userRoles?.map((userRole) => {
          const roleInfo = getRoleInfo(userRole.role);
          const RoleIcon = roleInfo.icon;
          
          return (
            <Card key={userRole.id}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <RoleIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{userRole.user_id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        נוצר: {new Date(userRole.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={roleInfo.variant}>
                    {roleInfo.label}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          );
        })}

        {(!userRoles || userRoles.length === 0) && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">אין משתמשים במערכת</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
