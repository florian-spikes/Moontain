
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, FileText, ShoppingBag, Server,
    LogOut, Mountain, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';

const navSections = [
    {
        label: 'Principal',
        items: [
            { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Gestion',
        items: [
            { href: '/clients', label: 'Clients', icon: Users },
            { href: '/documents', label: 'Devis & Factures', icon: FileText },
            { href: '/catalog', label: 'Catalogue', icon: ShoppingBag },
            { href: '/services', label: 'Services', icon: Server },
        ],
    },
];

export function DashboardLayout() {
    const location = useLocation();
    const { user } = useAuth();

    const initials = user?.email
        ? user.email.split('@')[0].slice(0, 2).toUpperCase()
        : '??';

    // Find current page title for breadcrumb
    const currentItem = navSections
        .flatMap(s => s.items)
        .find(item => item.href === location.pathname || (item.href !== '/' && location.pathname.startsWith(item.href)));

    return (
        <div className="layout">
            {/* ── Sidebar ──────────────────── */}
            <aside className="sidebar">
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <Mountain size={20} />
                    </div>
                    <div>
                        <div className="sidebar-brand-name">MOONTAIN</div>
                        <div className="sidebar-brand-sub">CRM Freelance</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    {navSections.map(section => (
                        <div key={section.label} className="sidebar-section">
                            <div className="sidebar-section-label">{section.label}</div>
                            {section.items.map(item => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href
                                    || (item.href !== '/' && location.pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={clsx('sidebar-link', isActive && 'sidebar-link-active')}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                        {isActive && <div className="sidebar-active-bar" />}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User + logout */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.email?.split('@')[0] ?? 'Utilisateur'}</div>
                            <div className="sidebar-user-email">{user?.email ?? ''}</div>
                        </div>
                    </div>
                    <button onClick={() => supabase.auth.signOut()} className="sidebar-logout" title="Déconnexion">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* ── Main ─────────────────────── */}
            <main className="main-content">
                <header className="main-header glass">
                    <div className="breadcrumb">
                        <span className="breadcrumb-root">Moontain</span>
                        {currentItem && (
                            <>
                                <ChevronRight size={14} className="breadcrumb-sep" />
                                <span className="breadcrumb-current">{currentItem.label}</span>
                            </>
                        )}
                    </div>
                    <div className="header-avatar">{initials}</div>
                </header>
                <div className="main-body">
                    <Outlet />
                </div>
            </main>

            <style>{`
                .layout {
                    display: flex;
                    height: 100vh;
                    height: 100dvh;
                    background: var(--bg-app);
                    color: var(--text-primary);
                }

                /* ── Sidebar ──────────── */
                .sidebar {
                    width: 260px;
                    min-width: 260px;
                    background: var(--bg-surface);
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                }

                .sidebar-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1.5rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                }
                .sidebar-brand-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                    box-shadow: 0 2px 8px rgba(139,92,246,0.25);
                }
                .sidebar-brand-name {
                    font-size: 0.9375rem;
                    font-weight: 800;
                    letter-spacing: 0.03em;
                    background: linear-gradient(to right, var(--primary), var(--secondary));
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .sidebar-brand-sub {
                    font-size: 0.6875rem;
                    color: var(--text-muted);
                    margin-top: 1px;
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 1rem 0.75rem;
                    overflow-y: auto;
                }
                .sidebar-section {
                    margin-bottom: 1.5rem;
                }
                .sidebar-section-label {
                    font-size: 0.6875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--text-muted);
                    padding: 0 0.75rem;
                    margin-bottom: 0.5rem;
                }

                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5625rem 0.75rem;
                    border-radius: var(--radius-md);
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                    transition: all var(--transition-smooth);
                    position: relative;
                    text-decoration: none;
                    margin-bottom: 2px;
                }
                .sidebar-link:hover {
                    background: var(--bg-surface-hover);
                    color: var(--text-primary);
                }
                .sidebar-link-active {
                    background: var(--primary-light);
                    color: var(--primary);
                    font-weight: 600;
                }
                .sidebar-active-bar {
                    position: absolute;
                    left: 0;
                    top: 6px;
                    bottom: 6px;
                    width: 3px;
                    border-radius: 0 4px 4px 0;
                    background: var(--primary);
                }

                /* ── Footer ──────────── */
                .sidebar-footer {
                    padding: 1rem 1rem;
                    border-top: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5rem;
                }
                .sidebar-user {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    overflow: hidden;
                }
                .sidebar-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.6875rem;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .sidebar-user-info {
                    overflow: hidden;
                }
                .sidebar-user-name {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .sidebar-user-email {
                    font-size: 0.6875rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .sidebar-logout {
                    padding: 0.5rem;
                    border-radius: var(--radius-md);
                    color: var(--text-muted);
                    transition: all var(--transition-fast);
                    flex-shrink: 0;
                }
                .sidebar-logout:hover {
                    background: rgba(239,68,68,0.1);
                    color: var(--danger);
                }

                /* ── Main ────────────── */
                .main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .main-header {
                    height: 56px;
                    padding: 0 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--border);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    flex-shrink: 0;
                }
                .breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8125rem;
                }
                .breadcrumb-root {
                    color: var(--text-muted);
                }
                .breadcrumb-sep {
                    color: var(--text-muted);
                }
                .breadcrumb-current {
                    color: var(--text-primary);
                    font-weight: 600;
                }
                .header-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-light);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.6875rem;
                    font-weight: 700;
                    color: var(--primary);
                }

                .main-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 2rem;
                }
            `}</style>
        </div>
    );
}
