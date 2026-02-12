import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Settings, UserCircle, MinusCircle, BookOpen, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/permissions';

export function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const permissions = usePermissions();

  const navItems = [
    { path: '/dashboard', label: user?.role === 'staff' ? 'Teacher' : 'Dashboard', icon: LayoutDashboard, permissions: [Permission.VIEW_DASHBOARD] },
    { path: '/inventory', label: 'Courses', icon: Package, permissions: [Permission.MANAGE_INVENTORY] },
    { path: '/pos', label: 'Fees', icon: ShoppingCart, permissions: [Permission.MANAGE_POS] },
    { path: '/customers', label: 'Students', icon: UserCircle, permissions: [Permission.VIEW_STUDENT_PROFILES] },
    { path: '/gradebook', label: 'Grades', icon: BookOpen, permissions: [Permission.ENTER_GRADES] },
    { path: '/timetable', label: 'Schedule', icon: Calendar, permissions: [Permission.MANAGE_TIMETABLE] },
    { path: '/expenses', label: 'Expenses', icon: MinusCircle, permissions: [Permission.VIEW_REPORTS] },
    { path: '/settings', label: 'Settings', icon: Settings, permissions: [Permission.MANAGE_SETTINGS, Permission.VIEW_PRINTER_SETTINGS] },
  ].filter(item => item.permissions.some(p => permissions.hasPermission(p)));

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 no-print safe-bottom">
      <div className={`grid ${navItems.length >= 7 ? 'grid-cols-7' : navItems.length === 6 ? 'grid-cols-6' : navItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} ${navItems.length >= 5 ? 'h-16' : 'h-20'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 transition-all duration-200 touch-target touch-active',
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 active:bg-gray-100'
              )}
            >
              <Icon className={cn(
                navItems.length >= 5 ? 'w-5 h-5' : 'w-6 h-6',
                isActive && 'stroke-[2.5]'
              )} />
              <span className={cn(
                'font-medium',
                navItems.length >= 5 ? 'text-[10px]' : 'text-xs'
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
