import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, FileText, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [truckTypes, sizes, equipment, categories] = await Promise.all([
        supabase.from('truck_types').select('id', { count: 'exact' }),
        supabase.from('truck_sizes').select('id', { count: 'exact' }),
        supabase.from('equipment').select('id', { count: 'exact' }),
        supabase.from('equipment_categories').select('id', { count: 'exact' }),
      ]);

      return {
        truckTypes: truckTypes.count || 0,
        sizes: sizes.count || 0,
        equipment: equipment.count || 0,
        categories: categories.count || 0,
      };
    },
  });

  const statCards = [
    { title: 'סוגי טראקים', value: stats?.truckTypes, icon: Truck, color: 'text-blue-500' },
    { title: 'גדלים', value: stats?.sizes, icon: Layers, color: 'text-green-500' },
    { title: 'פריטי ציוד', value: stats?.equipment, icon: Package, color: 'text-orange-500' },
    { title: 'קטגוריות', value: stats?.categories, icon: FileText, color: 'text-purple-500' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">דאשבורד</h1>
        <p className="text-muted-foreground">סקירה כללית של המערכת</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ברוך הבא לממשק הניהול</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>מכאן תוכל לנהל את כל התוכן של הקונפיגורטור:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>סוגי טראקים</strong> - הוספה ועריכה של סוגי פודטראקים וגדלים</li>
            <li><strong>ציוד</strong> - ניהול קטגוריות ופריטי ציוד</li>
            <li><strong>תוכן האתר</strong> - עריכת טקסטים וכותרות</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
