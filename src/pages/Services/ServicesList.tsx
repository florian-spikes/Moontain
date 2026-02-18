
import { useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Server, Calendar, Cloud, Globe, Key, Wrench } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    hosting: { label: 'Hébergement', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Cloud },
    domain: { label: 'Domaine', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: Globe },
    license: { label: 'Licence', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: Key },
    maintenance: { label: 'Maintenance', color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: Wrench },
};

export function ServicesList() {
    const { services, isLoading, error } = useServices();
    const [filter, setFilter] = useState<'all' | 'hosting' | 'domain' | 'license' | 'maintenance'>('all');

    if (isLoading) return (
        <div className="sv-loading animate-fade-in">
            <div className="sv-loading-spinner" />
            <p>Chargement des services...</p>
            <style>{svStyles}</style>
        </div>
    );
    if (error) return <div className="sv-loading" style={{ color: 'var(--danger)' }}>Erreur: {(error as Error).message}</div>;

    const filteredServices = services.filter(s => filter === 'all' || s.type === filter);

    const getStatusInfo = (renewalDate: string | null) => {
        if (!renewalDate) return { label: null, color: 'var(--text-muted)', urgency: 'none' };
        const days = differenceInDays(parseISO(renewalDate), new Date());
        if (days < 0) return { label: `Expiré depuis ${Math.abs(days)}j`, color: '#ef4444', urgency: 'expired' };
        if (days < 30) return { label: `${days}j restants`, color: '#f97316', urgency: 'warning' };
        return { label: `${days}j restants`, color: '#22c55e', urgency: 'ok' };
    };

    // Stats
    const stats = {
        total: services.length,
        expiring: services.filter(s => {
            if (!s.renewal_date) return false;
            const days = differenceInDays(parseISO(s.renewal_date), new Date());
            return days >= 0 && days < 30;
        }).length,
        expired: services.filter(s => {
            if (!s.renewal_date) return false;
            return differenceInDays(parseISO(s.renewal_date), new Date()) < 0;
        }).length,
    };

    return (
        <div className="sv animate-fade-in">
            {/* Header */}
            <div className="sv-header">
                <div>
                    <h1 className="sv-title">Services</h1>
                    <p className="sv-subtitle">Suivi des hébergements, domaines et licences</p>
                </div>
            </div>

            {/* Stats row */}
            <div className="sv-stats">
                <div className="sv-stat">
                    <span className="sv-stat-val">{stats.total}</span>
                    <span className="sv-stat-label">Services actifs</span>
                </div>
                {stats.expiring > 0 && (
                    <div className="sv-stat sv-stat-warning">
                        <span className="sv-stat-val" style={{ color: '#f97316' }}>{stats.expiring}</span>
                        <span className="sv-stat-label">Expire bientôt</span>
                    </div>
                )}
                {stats.expired > 0 && (
                    <div className="sv-stat sv-stat-danger">
                        <span className="sv-stat-val" style={{ color: '#ef4444' }}>{stats.expired}</span>
                        <span className="sv-stat-label">Expirés</span>
                    </div>
                )}
            </div>

            {/* Filter pills */}
            <div className="sv-filters">
                {[
                    { key: 'all', label: 'Tous' },
                    ...Object.entries(typeConfig).map(([key, val]) => ({ key, label: val.label }))
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key as any)}
                        className={clsx('sv-filter-btn', filter === key && 'sv-filter-active')}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {filteredServices.length > 0 ? (
                <div className="sv-grid">
                    {filteredServices.map((service, i) => {
                        const conf = typeConfig[service.type] || typeConfig.hosting;
                        const TypeIcon = conf.icon;
                        const status = getStatusInfo(service.renewal_date);
                        return (
                            <div
                                key={service.id}
                                className="sv-card animate-slide-up"
                                style={{ animationDelay: `${i * 0.04}s` }}
                            >
                                <div className="sv-card-top">
                                    <div className="sv-card-icon" style={{ background: conf.bg, color: conf.color }}>
                                        <TypeIcon size={20} />
                                    </div>
                                    <div className="sv-card-info">
                                        <h3 className="sv-card-name">{service.name}</h3>
                                        <Link
                                            to={`/clients/${service.client_id}`}
                                            className="sv-card-client"
                                        >
                                            {service.client?.name || 'Client inconnu'}
                                        </Link>
                                    </div>
                                    {status.label && (
                                        <span
                                            className={clsx('sv-card-badge', `sv-badge-${status.urgency}`)}
                                            style={{ color: status.color }}
                                        >
                                            {status.label}
                                        </span>
                                    )}
                                </div>

                                <div className="sv-card-details">
                                    <div className="sv-card-row">
                                        <span>Fournisseur</span>
                                        <span>{service.provider || '—'}</span>
                                    </div>
                                    <div className="sv-card-row">
                                        <span>Prix</span>
                                        <span className="sv-card-price">{service.price ? `${service.price}€` : '—'}</span>
                                    </div>
                                    {service.renewal_date && (
                                        <div className="sv-card-row sv-card-row-border">
                                            <span className="sv-card-cal"><Calendar size={13} /> Renouvellement</span>
                                            <span className="sv-card-date">
                                                {format(parseISO(service.renewal_date), 'd MMM yyyy', { locale: fr })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="sv-empty">
                    <div className="sv-empty-icon"><Server size={32} /></div>
                    <h3>Aucun service trouvé</h3>
                    <p>Aucun service ne correspond aux filtres sélectionnés</p>
                </div>
            )}

            <style>{svStyles}</style>
        </div>
    );
}

const svStyles = `
    .sv { max-width: 1100px; margin: 0 auto; }

    .sv-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .sv-title { font-size: 1.75rem; font-weight: 700; }
    .sv-subtitle { color: var(--text-secondary); margin-top: 0.25rem; font-size: 0.875rem; }

    /* Stats */
    .sv-stats {
        display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .sv-stat {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-lg); padding: 1rem 1.5rem;
        display: flex; flex-direction: column; gap: 0.25rem; flex: 1; min-width: 140px;
    }
    .sv-stat-warning { border-left: 3px solid #f97316; }
    .sv-stat-danger { border-left: 3px solid #ef4444; }
    .sv-stat-val { font-size: 1.5rem; font-weight: 700; }
    .sv-stat-label { font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

    /* Filters */
    .sv-filters {
        display: flex; gap: 0.375rem; margin-bottom: 1.5rem;
        overflow-x: auto; padding-bottom: 2px;
    }
    .sv-filter-btn {
        padding: 0.375rem 0.875rem; border-radius: 999px;
        font-size: 0.75rem; font-weight: 500; white-space: nowrap;
        border: 1px solid var(--border); background: transparent;
        color: var(--text-secondary); cursor: pointer;
        transition: all var(--transition-fast);
    }
    .sv-filter-btn:hover { border-color: var(--primary); color: var(--primary); }
    .sv-filter-active {
        background: var(--primary) !important; color: white !important;
        border-color: var(--primary) !important;
    }

    /* Grid */
    .sv-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1rem;
    }

    .sv-card {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 1.25rem;
        transition: all var(--transition-smooth);
    }
    .sv-card:hover {
        border-color: var(--border-light);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    .sv-card-top {
        display: flex; align-items: flex-start; gap: 0.75rem;
        margin-bottom: 1rem; flex-wrap: wrap;
    }
    .sv-card-icon {
        width: 44px; height: 44px; flex-shrink: 0;
        border-radius: var(--radius-lg);
        display: flex; align-items: center; justify-content: center;
    }
    .sv-card-info { flex: 1; min-width: 0; }
    .sv-card-name {
        font-size: 0.9375rem; font-weight: 600;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sv-card-client {
        font-size: 0.75rem; color: var(--text-muted);
        text-decoration: none; transition: color var(--transition-fast);
    }
    .sv-card-client:hover { color: var(--primary); }
    .sv-card-badge {
        font-size: 0.6875rem; font-weight: 700;
        padding: 0.25rem 0.625rem; border-radius: 999px;
        white-space: nowrap;
    }
    .sv-badge-expired { background: rgba(239,68,68,0.1); }
    .sv-badge-warning { background: rgba(249,115,22,0.1); }
    .sv-badge-ok { background: rgba(34,197,94,0.1); }

    .sv-card-details { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8125rem; }
    .sv-card-row {
        display: flex; justify-content: space-between; align-items: center;
        color: var(--text-secondary);
    }
    .sv-card-row span:last-child { color: var(--text-primary); font-weight: 500; }
    .sv-card-price { font-weight: 600 !important; }
    .sv-card-row-border {
        padding-top: 0.625rem; margin-top: 0.25rem; border-top: 1px solid var(--border);
    }
    .sv-card-cal {
        display: flex; align-items: center; gap: 0.375rem;
        font-size: 0.75rem; color: var(--text-muted) !important;
    }
    .sv-card-date { font-weight: 600 !important; font-size: 0.8125rem; }

    .sv-empty {
        text-align: center; padding: 4rem 2rem;
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl);
    }
    .sv-empty-icon {
        width: 64px; height: 64px; border-radius: 50%;
        background: rgba(59,130,246,0.1); color: #3b82f6;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1rem;
    }
    .sv-empty h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
    .sv-empty p { color: var(--text-secondary); font-size: 0.875rem; }

    .sv-loading {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 1rem; padding: 4rem; color: var(--text-secondary);
    }
    .sv-loading-spinner {
        width: 32px; height: 32px; border: 3px solid var(--border);
        border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 700px) {
        .sv-grid { grid-template-columns: 1fr; }
        .sv-stats { flex-direction: column; }
    }
`;
