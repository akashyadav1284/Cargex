"use client";
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

type AdminContextType = { adminData: any; fetchOpts: (opts?: RequestInit) => RequestInit; handleLogout: () => void; };
export const AdminContext = createContext<AdminContextType | null>(null);
export const useAdmin = () => useContext(AdminContext)!;

const NAV = [
  { href: '/dashboard',              icon: '⚡', label: 'Overview' },
  { href: '/dashboard/drivers/pending',icon:'📝', label: 'New Drivers' },
  { href: '/dashboard/drivers',      icon: '🚚', label: 'Drivers' },
  { href: '/dashboard/users',        icon: '👤', label: 'Users' },
  { href: '/dashboard/agencies',     icon: '🏢', label: 'Agencies' },
  { href: '/dashboard/bookings',     icon: '📦', label: 'Bookings' },
  { href: '/dashboard/pricing',      icon: '💰', label: 'Pricing' },
  { href: '/dashboard/analytics',    icon: '📊', label: 'Analytics' },
  { href: '/dashboard/live',         icon: '🟢', label: 'Live Monitor' },
  { href: '/dashboard/notifications',icon: '🔔', label: 'Notifications' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminData, setAdminData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem('adminData');
    if (!d) { router.replace('/login'); return; }
    setAdminData(JSON.parse(d));
  }, [router]);

  const fetchOpts = (opts: RequestInit = {}): RequestInit => ({
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  });

  const handleLogout = async () => {
    try { await fetch(`${API_URL}/api/auth/logout`, fetchOpts({ method: 'POST' })); } catch {}
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
    router.push('/login');
  };

  if (!adminData) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <AdminContext.Provider value={{ adminData, fetchOpts, handleLogout }}>
      <div className="min-h-screen bg-background text-foreground font-sans flex">
        {/* Mobile overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`fixed lg:static top-0 left-0 h-full z-30 w-64 bg-surface border-r border-border flex flex-col shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          {/* Logo */}
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-accent font-black text-xl">C</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-tight">Cargex Admin</h1>
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Control Center</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
            {NAV.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all
                  ${isActive(item.href) ? 'bg-accent/15 text-accent' : 'text-muted hover:text-foreground hover:bg-surfaceHighlight'}`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
                {isActive(item.href) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
              </Link>
            ))}
          </nav>

          {/* Admin info + logout */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="px-4 py-2.5 rounded-xl bg-surfaceHighlight">
              <p className="text-xs font-bold text-foreground truncate">{adminData.name || adminData.email}</p>
              <p className="text-[10px] text-accent uppercase tracking-wider font-bold mt-0.5">Administrator</p>
            </div>
            <button onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-danger hover:bg-danger/10 transition-all flex items-center gap-3">
              <span>🚪</span> Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* top bar */}
          <header className="h-16 bg-surface border-b border-border flex items-center px-6 gap-4 shrink-0 sticky top-0 z-10">
            <button onClick={() => setSidebarOpen(s => !s)} className="lg:hidden text-muted hover:text-foreground p-2 -ml-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <Link href="/dashboard/notifications" className="relative p-2 text-muted hover:text-foreground rounded-lg hover:bg-surfaceHighlight transition-colors">
                🔔
              </Link>
              <Link href="/dashboard/live" className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full text-xs font-bold text-accent border border-accent/20">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />Live
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
