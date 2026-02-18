
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ShoppingBag, Server, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '../lib/supabase';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/catalog', label: 'Catalogue', icon: ShoppingBag },
    { href: '/services', label: 'Services', icon: Server },
];

export function DashboardLayout() {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-[--bg-app] text-[--text-primary]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[--border] bg-[--bg-surface] flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-[--primary] to-[--secondary] bg-clip-text text-transparent">
                        MOONTAIN
                    </h1>
                    <p className="text-xs text-[--text-secondary]">Web Dev CRM</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={clsx(
                                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium',
                                    isActive
                                        ? 'bg-[--primary] text-white'
                                        : 'text-[--text-secondary] hover:bg-[--bg-surface-hover] hover:text-[--text-primary]'
                                )}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[--border]">
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[--text-secondary] hover:text-[--danger] w-full transition-colors"
                    >
                        <LogOut size={18} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b border-[--border] bg-[--bg-app]/80 backdrop-blur-sm sticky top-0 z-10 px-8 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {navItems.find(item => item.href === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[--bg-surface] border border-[--border] flex items-center justify-center text-xs font-bold text-[--primary]">
                            FQ
                        </div>
                    </div>
                </header>
                <div className="p-8 pb-20">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
