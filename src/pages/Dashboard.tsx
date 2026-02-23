
import { useAuth } from '../components/AuthProvider';
import {
    TrendingUp, Users, FileText, ShoppingBag,
    Euro, Clock, Calendar, ArrowRight, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useClients } from '../hooks/useClients';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentDrawer } from '../components/DocumentDrawer';
import { ClientDrawer } from '../components/ClientDrawer';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { NewClient, NewDocument } from '../types';

// Remove unused mock data
const mockActivity = [
    { label: 'Jan', value: 65 },
    { label: 'Fév', value: 82 },
    { label: 'Mar', value: 45 },
    { label: 'Avr', value: 90 },
    { label: 'Mai', value: 72 },
    { label: 'Jun', value: 58 },
    { label: 'Jul', value: 95 },
    { label: 'Aoû', value: 68 },
];

const statusStyles: Record<string, { label: string; bg: string; color: string }> = {
    draft: { label: 'Brouillon', bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
    sent: { label: 'Envoyé', bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
    paid: { label: 'Payé', bg: 'rgba(16,185,129,0.1)', color: '#34d399' },
    overdue: { label: 'En retard', bg: 'rgba(239,68,68,0.1)', color: '#f87171' },
};

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

// ── Component ──────────────────────────────
export function Dashboard() {
    const { user } = useAuth();
    const firstName = user?.email?.split('@')[0] ?? 'Utilisateur';
    const { stats, isLoading } = useDashboard();

    const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false);
    const [docDrawerType, setDocDrawerType] = useState<'invoice' | 'quote'>('invoice');

    const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);

    const { createClient } = useClients();
    const { createDocument } = useDocuments();

    const handleSaveClient = async (data: Partial<NewClient>) => {
        await createClient.mutateAsync({
            name: data.name!,
            email: data.email || null,
            website: data.website || null,
            address: data.address || null,
            notes: data.notes || null,
            emoji: data.emoji || '🏢',
            manager_civility: data.manager_civility || null,
            manager_first_name: data.manager_first_name || null,
            manager_last_name: data.manager_last_name || null,
        });
        setIsClientDrawerOpen(false);
    };

    const handleSaveDoc = async (data: any) => {
        await createDocument.mutateAsync({
            client_id: data.client_id,
            type: data.type,
            date: data.date,
            due_date: data.due_date,
            lines: data.lines,
        } as NewDocument);
        setIsDocDrawerOpen(false);
    };

    if (isLoading || !stats) {
        return <div className="dash"><div className="dash-header"><h1 className="dash-title">Chargement...</h1></div></div>;
    }

    return (
        <div className="dash">
            {/* Header */}
            <div className="dash-header animate-fade-in">
                <div>
                    <h1 className="dash-title">Bonjour, {firstName} 👋</h1>
                    <p className="dash-subtitle">Voici un résumé de votre activité ce mois-ci.</p>
                </div>
                <button
                    onClick={() => { setDocDrawerType('invoice'); setIsDocDrawerOpen(true); }}
                    className="dash-cta"
                    style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                    <Plus size={18} /> Nouvelle facture
                </button>
            </div>

            {/* KPI Grid */}
            <div className="dash-kpis animate-slide-up">
                <KpiCard
                    label="Chiffre d'affaires"
                    value={fmt(stats.revenue.current)}
                    sub={<><TrendingUp size={14} /> {stats.revenue.growth >= 0 ? '+' : ''}{stats.revenue.growth.toFixed(1)}% vs mois dernier</>}
                    subColor={stats.revenue.growth >= 0 ? "#34d399" : "#f87171"}
                    icon={<Euro size={20} />}
                    iconBg="linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))"
                    iconColor="var(--primary)"
                />
                <KpiCard
                    label="Factures en attente"
                    value={String(stats.pendingInvoices.count)}
                    sub={<>{fmt(stats.pendingInvoices.amount)} à recevoir</>}
                    subColor="var(--text-secondary)"
                    icon={<Clock size={20} />}
                    iconBg="rgba(245,158,11,0.12)"
                    iconColor="#f59e0b"
                />
                <KpiCard
                    label="Clients actifs"
                    value={String(stats.activeClients)}
                    sub={<Link to="/clients" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem' }}>Voir tous <ArrowRight size={14} /></Link>}
                    icon={<Users size={20} />}
                    iconBg="rgba(139,92,246,0.12)"
                    iconColor="var(--primary)"
                />
                <KpiCard
                    label="Services actifs"
                    value={String(stats.activeServices)}
                    sub={<Link to="/services" style={{ color: 'var(--secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem' }}>Gérer <ArrowRight size={14} /></Link>}
                    icon={<Calendar size={20} />}
                    iconBg="rgba(59,130,246,0.12)"
                    iconColor="var(--secondary)"
                />
            </div>

            {/* Two-column grid */}
            <div className="dash-grid" style={{ animationDelay: '0.15s' }}>
                {/* Activity Chart */}
                <div className="dash-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h3 className="dash-card-title">Activité mensuelle</h3>
                    <div className="dash-chart">
                        {mockActivity.map(bar => (
                            <div key={bar.label} className="dash-bar-col">
                                <div className="dash-bar-track">
                                    <div
                                        className="dash-bar-fill"
                                        style={{ height: `${bar.value}%` }}
                                    />
                                </div>
                                <span className="dash-bar-label">{bar.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Documents */}
                <div className="dash-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 className="dash-card-title" style={{ marginBottom: 0 }}>Documents récents</h3>
                        <Link to="/documents" style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none' }}>Tout voir</Link>
                    </div>
                    <div className="dash-doc-list">
                        {stats.recentDocs.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucun document récent</div>
                        ) : (
                            stats.recentDocs.map(doc => (
                                <Link to={`/documents/${doc.id}`} key={doc.id} className="dash-doc-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="dash-doc-dot" style={{ background: doc.type === 'invoice' ? 'var(--secondary)' : 'var(--primary)' }} />
                                        <div>
                                            <div className="dash-doc-number">{doc.number || 'Brouillon'}</div>
                                            <div className="dash-doc-client">{(doc as any).client?.name || 'Client sans nom'} · {doc.date ? format(parseISO(doc.date), 'dd MMM', { locale: fr }) : '-'}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="dash-doc-amount">{fmt(doc.total_amount)}</div>
                                        <span className="dash-doc-status" style={{
                                            background: statusStyles[doc.status]?.bg,
                                            color: statusStyles[doc.status]?.color,
                                        }}>
                                            {statusStyles[doc.status]?.label}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="dash-actions animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <ActionCard
                    icon={<FileText size={22} />}
                    label="Nouveau Devis"
                    description="Créer un devis pour un client"
                    onClick={() => { setDocDrawerType('quote'); setIsDocDrawerOpen(true); }}
                    color="var(--secondary)"
                />
                <ActionCard
                    icon={<Users size={22} />}
                    label="Nouveau Client"
                    description="Ajouter un client à votre base"
                    onClick={() => setIsClientDrawerOpen(true)}
                    color="var(--primary)"
                />
                <ActionCard
                    icon={<ShoppingBag size={22} />}
                    label="Catalogue"
                    description="Gérer vos prestations"
                    href="/catalog"
                    color="var(--accent)"
                />
            </div>

            <DocumentDrawer
                isOpen={isDocDrawerOpen}
                onClose={() => setIsDocDrawerOpen(false)}
                defaultType={docDrawerType}
                onSave={handleSaveDoc}
                isSaving={createDocument.isPending}
            />

            <ClientDrawer
                isOpen={isClientDrawerOpen}
                onClose={() => setIsClientDrawerOpen(false)}
                onSave={handleSaveClient}
                isSaving={createClient.isPending}
            />

            <style>{dashStyles}</style>
        </div>
    );
}

// ── Sub-components ─────────────────────────
function KpiCard({ label, value, sub, subColor, icon, iconBg, iconColor }: {
    label: string; value: string; sub: React.ReactNode; subColor?: string;
    icon: React.ReactNode; iconBg: string; iconColor: string;
}) {
    return (
        <div className="kpi-card">
            <div className="kpi-top">
                <div>
                    <div className="kpi-label">{label}</div>
                    <div className="kpi-value">{value}</div>
                </div>
                <div className="kpi-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
            </div>
            <div className="kpi-sub" style={{ color: subColor }}>{sub}</div>
        </div>
    );
}

function ActionCard({ icon, label, description, href, onClick, color }: {
    icon: React.ReactNode; label: string; description: string; href?: string; onClick?: () => void; color: string;
}) {
    if (onClick) {
        return (
            <button onClick={onClick} className="action-card" style={{ textDecoration: 'none', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', display: 'block', background: 'var(--bg-card)', width: '100%', textAlign: 'center' }}>
                <div className="action-icon" style={{ background: `${color}15`, color }}>{icon}</div>
                <div className="action-label">{label}</div>
                <div className="action-desc">{description}</div>
            </button>
        );
    }
    return (
        <Link to={href || '#'} className="action-card" style={{ textDecoration: 'none' }}>
            <div className="action-icon" style={{ background: `${color}15`, color }}>{icon}</div>
            <div className="action-label">{label}</div>
            <div className="action-desc">{description}</div>
        </Link>
    );
}

// ── Styles ──────────────────────────────────
const dashStyles = `
    .dash {
        max-width: 1100px;
        margin: 0 auto;
    }

    .dash-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    .dash-title {
        font-size: 1.75rem;
        font-weight: 700;
    }
    .dash-subtitle {
        color: var(--text-secondary);
        margin-top: 0.25rem;
        font-size: 0.9375rem;
    }
    .dash-cta {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        font-weight: 600;
        font-size: 0.8125rem;
        border-radius: var(--radius-lg);
        text-decoration: none;
        transition: all var(--transition-smooth);
    }
    .dash-cta:hover {
        box-shadow: 0 4px 16px rgba(139,92,246,0.3);
        transform: translateY(-1px);
    }

    /* ── KPIs ─────────── */
    .dash-kpis {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .kpi-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 1.25rem;
        transition: border-color var(--transition-smooth), box-shadow var(--transition-smooth);
    }
    .kpi-card:hover {
        border-color: var(--border-light);
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }
    .kpi-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
    }
    .kpi-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        margin-bottom: 0.375rem;
    }
    .kpi-value {
        font-size: 1.5rem;
        font-weight: 700;
    }
    .kpi-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .kpi-sub {
        font-size: 0.8125rem;
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    /* ── Grid ─────────── */
    .dash-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .dash-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
    }
    .dash-card-title {
        font-size: 0.9375rem;
        font-weight: 600;
        margin-bottom: 1.25rem;
    }

    /* Chart */
    .dash-chart {
        display: flex;
        align-items: flex-end;
        gap: 0.75rem;
        height: 160px;
    }
    .dash-bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        height: 100%;
    }
    .dash-bar-track {
        flex: 1;
        width: 100%;
        max-width: 32px;
        background: var(--bg-surface-hover);
        border-radius: 6px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
    }
    .dash-bar-fill {
        width: 100%;
        border-radius: 6px;
        background: linear-gradient(to top, var(--primary), var(--secondary));
        transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        min-height: 4px;
    }
    .dash-bar-label {
        font-size: 0.6875rem;
        color: var(--text-muted);
    }

    /* Documents */
    .dash-doc-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .dash-doc-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0.75rem;
        border-radius: var(--radius-md);
        transition: background var(--transition-fast);
    }
    .dash-doc-row:hover {
        background: var(--bg-surface-hover);
    }
    .dash-doc-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .dash-doc-number {
        font-size: 0.8125rem;
        font-weight: 600;
    }
    .dash-doc-client {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 1px;
    }
    .dash-doc-amount {
        font-size: 0.8125rem;
        font-weight: 600;
    }
    .dash-doc-status {
        display: inline-block;
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 2px 8px;
        border-radius: 999px;
        margin-top: 2px;
    }

    /* Actions */
    .dash-actions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }
    .action-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 1.25rem;
        text-align: center;
        transition: all var(--transition-smooth);
        display: block;
        color: var(--text-primary);
    }
    .action-card:hover {
        border-color: var(--border-light);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .action-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.75rem;
    }
    .action-label {
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    .action-desc {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    /* ── Responsive ───── */
    @media (max-width: 900px) {
        .dash-kpis { grid-template-columns: repeat(2, 1fr); }
        .dash-grid { grid-template-columns: 1fr; }
        .dash-actions { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
        .dash-kpis { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
        .dash-doc-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        .dash-doc-row > div:last-child { align-self: flex-start; text-align: left; }
    }
`;
