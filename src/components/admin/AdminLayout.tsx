import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Loader2,
  LayoutDashboard,
  Truck,
  Package,
  FileText,
  LogOut,
  Home,
  Users,
  Sparkles,
  Menu,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Nav items with role requirements
const allNavItems = [
  { path: '/admin', label: 'דאשבורד', icon: LayoutDashboard, exact: true, roles: ['admin', 'client'] },
  { path: '/admin/leads', label: 'לידים', icon: Users, roles: ['admin', 'client'] },
  { path: '/admin/trucks', label: 'סוגי טראקים', icon: Truck, roles: ['admin', 'client'] },
  { path: '/admin/equipment', label: 'ציוד', icon: Package, roles: ['admin', 'client'] },
  { path: '/admin/content', label: 'תוכן האתר', icon: FileText, roles: ['admin'] },
  { path: '/admin/email-preview', label: 'תצוגת מיילים', icon: Mail, roles: ['admin'] },
  { path: '/admin/ai', label: 'יצירת תוכן AI', icon: Sparkles, roles: ['admin'] },
  { path: '/admin/users', label: 'ניהול משתמשים', icon: Users, roles: ['admin'] },
];

const AdminLayout = () => {
  const { user, isAdmin, isClient, userRole, loading, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => 
    item.roles.includes(userRole || '')
  );

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    } else if (!loading && user && !isAdmin && !isClient) {
      navigate('/admin/login');
    }
  }, [loading, user, isAdmin, isClient, navigate]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate('/admin/login');
  };

  const isActivePath = useMemo(() => {
    const current = location.pathname;
    return (path: string, exact?: boolean) =>
      exact ? current === path : current === path || current.startsWith(path + '/');
  }, [location.pathname]);

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="p-2 space-y-1">
      {navItems.map((item) => {
        const active = isActivePath(item.path, item.exact);

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const FooterActions = ({ compact }: { compact?: boolean }) => (
    <div className={cn('p-4 border-t bg-card', compact && 'p-3')}>
      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <Home className="h-4 w-4 ml-2" />
            חזרה לאתר
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 ml-2" />
          התנתק
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isClient)) {
    return null;
  }

  // Mobile layout: hamburger + slide-in menu
  if (isMobile) {
    return (
      <div className="min-h-svh flex flex-col bg-muted/30" dir="rtl">
        <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
          <div className="h-14 px-3 flex items-center justify-between gap-2">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="פתח תפריט">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-72" dir="rtl">
                <div className="p-4 border-b">
                  <h1 className="text-lg font-bold text-primary">ניהול המערכת</h1>
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                </div>

                <div className="flex flex-col min-h-[calc(100svh-64px)]">
                  <div className="flex-1 overflow-auto">
                    <Nav onNavigate={() => setMenuOpen(false)} />
                  </div>
                  <FooterActions compact />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1 text-center">
              <div className="text-sm font-semibold text-foreground">אדמין</div>
              <div className="text-xs text-muted-foreground">אליה קרוואנים</div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="התנתק"
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen flex bg-muted/30" dir="rtl">
      <aside className="w-64 bg-card border-l shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">ניהול המערכת</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        </div>

        <div className="flex-1 overflow-auto">
          <Nav />
        </div>

        <FooterActions />
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
