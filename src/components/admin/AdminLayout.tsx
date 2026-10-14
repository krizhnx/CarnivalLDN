import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Receipt,
  RefreshCw,
  ScanLine,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/supabaseStore';
import SiteThemeToggle from '../dashboard/SiteThemeToggle';
import { Avatar, IconButton } from './ui';

export type AdminTab = 'overview' | 'events' | 'orders' | 'guestlists' | 'affiliates';

export const ADMIN_TABS: { id: AdminTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'orders', label: 'Orders', icon: Receipt },
  { id: 'guestlists', label: 'Guestlists', icon: ClipboardList },
  { id: 'affiliates', label: 'Affiliates', icon: Link2 },
];

interface AdminLayoutProps {
  tab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  counts?: Partial<Record<AdminTab, number>>;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
}

const Sidebar = ({
  tab,
  onTabChange,
  counts,
  onNavigate,
}: Pick<AdminLayoutProps, 'tab' | 'onTabChange' | 'counts'> & { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const { user, logout } = useAppStore();

  const itemClass = (active: boolean) =>
    cn(
      'group flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors',
      active ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-zinc-200/80' : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <img src="/carnival-logo.svg" alt="Carnival LDN" className="h-7 w-auto" />
        <span className="rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Admin</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Manage</p>
          {ADMIN_TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onTabChange(id);
                  onNavigate?.();
                }}
                className={itemClass(active)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-violet-600' : 'text-zinc-400 group-hover:text-zinc-600')} />
                <span className="flex-1 text-left">{label}</span>
                {counts?.[id] !== undefined && (
                  <span className="text-xs tabular-nums text-zinc-400">{counts[id]}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-0.5">
          <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Tools</p>
          <Link to="/scanner" className={itemClass(false)} onClick={onNavigate}>
            <ScanLine className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600" />
            <span className="flex-1 text-left">Door scanner</span>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className={itemClass(false)}>
            <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600" />
            <span className="flex-1 text-left">View live site</span>
          </a>
        </div>
      </nav>

      <div className="space-y-3 border-t border-zinc-200/80 p-3">
        <SiteThemeToggle />
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <Avatar name={user?.name || 'Admin'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-zinc-900">{user?.name || 'Admin'}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <IconButton
            icon={LogOut}
            label="Sign out"
            size="sm"
            onClick={() => {
              logout();
              navigate('/admin');
            }}
          />
        </div>
      </div>
    </div>
  );
};

const AdminLayout = ({ tab, onTabChange, title, description, actions, counts, refreshing, onRefresh, children }: AdminLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Carnival LDN · Admin';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f6f7] font-sans text-zinc-900 antialiased">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-zinc-200/80 bg-[#f6f6f7] lg:block">
        <Sidebar tab={tab} onTabChange={onTabChange} counts={counts} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-zinc-950/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              className="absolute inset-y-0 left-0 w-72 bg-[#f6f6f7] shadow-xl"
            >
              <IconButton icon={X} label="Close menu" size="sm" className="absolute right-3 top-4" onClick={() => setMobileOpen(false)} />
              <Sidebar tab={tab} onTabChange={onTabChange} counts={counts} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#f6f6f7]/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
            <IconButton icon={Menu} label="Open menu" className="lg:hidden" onClick={() => setMobileOpen(true)} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[17px] font-semibold tracking-tight text-zinc-900">{title}</h1>
              {description && <p className="truncate text-[13px] text-zinc-500">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              {onRefresh && (
                <IconButton
                  icon={RefreshCw}
                  label="Refresh data"
                  variant="secondary"
                  onClick={onRefresh}
                  disabled={refreshing}
                  className={cn(refreshing && '[&>svg]:animate-spin')}
                />
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
