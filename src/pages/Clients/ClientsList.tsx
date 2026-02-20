import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Briefcase, FileText, Clock } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { clsx } from 'clsx';
import { ClientDrawer } from '../../components/ClientDrawer';

export function ClientsList() {
    const { clients, isLoading, error, createClient } = useClients();
    const [showArchived, setShowArchived] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);

    if (isLoading) return (
        <div className="cls-loading animate-fade-in">
            <div className="cls-loading-spinner" />
            <p>Chargement des clients...</p>
            <style>{clStyles}</style>
        </div>
    );
    if (error) return <div className="cls-loading" style={{ color: 'var(--danger)' }}>Erreur: {(error as Error).message}</div>;

    const filteredClients = clients
        .filter(client => showArchived ? client.is_archived : !client.is_archived)
        .filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );



    return (
        <div className="cls animate-fade-in">
            <ClientDrawer
                isOpen={isNewDrawerOpen}
                onClose={() => setIsNewDrawerOpen(false)}
                onSave={async (data) => {
                    await createClient.mutateAsync(data as any);
                }}
                isSaving={createClient.isPending}
            />

            {/* Header */}
            <div className="cls-header">
                <div>
                    <h1 className="cls-title">Clients</h1>
                    <p className="cls-subtitle">Gérez votre base de données clients · {filteredClients.length} résultat{filteredClients.length > 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setIsNewDrawerOpen(true)} className="cls-cta" style={{ border: 'none', cursor: 'pointer' }}>
                    <Plus size={18} />
                    Nouveau Client
                </button>
            </div>

            {/* Toolbar */}
            <div className="cls-toolbar">
                <div className="cls-search-wrap">
                    <Search className="cls-search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="cls-search-input"
                    />
                </div>
                <label className="cls-toggle">
                    <div className={clsx('cls-toggle-track', showArchived && 'cls-toggle-active')}>
                        <div className="cls-toggle-thumb" />
                    </div>
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="sr-only"
                    />
                    Archives
                </label>
            </div>

            {/* Client Cards Grid */}
            {filteredClients.length > 0 ? (
                <div className="cls-grid">
                    {filteredClients.map((client, i) => {
                        const servicesCount = (client as any).services?.filter((s: any) => !s.end_date || new Date(s.end_date) > new Date()).length || 0;
                        const documents = (client as any).documents || [];
                        const totalPaid = documents.filter((d: any) => d.status === 'paid').reduce((s: any, d: any) => s + (d.total_amount || 0), 0);
                        const totalPending = documents.filter((d: any) => ['sent', 'overdue'].includes(d.status)).reduce((s: any, d: any) => s + (d.total_amount || 0), 0);

                        return (
                            <div
                                key={client.id}
                                className="cls-card animate-slide-up"
                                style={{ animationDelay: `${i * 0.04}s` }}
                            >
                                <Link to={`/clients/${client.id}`} className="cls-card-link">
                                    <div className="cls-card-top">
                                        <div className="cls-card-emoji">{client.emoji || '🏢'}</div>
                                        <div className="cls-card-info">
                                            <h3 className="cls-card-name">{client.name}</h3>
                                            <p className="cls-card-email">{client.email || 'Pas d\'email'}</p>
                                        </div>
                                    </div>
                                    {client.notes && (
                                        <p className="cls-card-notes">{client.notes}</p>
                                    )}
                                    {client.address && (
                                        <p className="cls-card-address">{client.address}</p>
                                    )}

                                    <div className="cls-card-kpis">
                                        <div className="cls-card-kpi">
                                            <Briefcase size={12} className="cls-kpi-icon" />
                                            <span className="cls-kpi-val">{servicesCount}</span>
                                            <span className="cls-kpi-lbl">Actifs</span>
                                        </div>
                                        <div className="cls-card-kpi-sep" />
                                        <div className="cls-card-kpi">
                                            <FileText size={12} className="cls-kpi-icon" style={{ color: '#22c55e' }} />
                                            <span className="cls-kpi-val" style={{ color: '#22c55e' }}>{totalPaid.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</span>
                                        </div>
                                        <div className="cls-card-kpi-sep" />
                                        <div className="cls-card-kpi">
                                            <Clock size={12} className="cls-kpi-icon" style={{ color: '#f59e0b' }} />
                                            <span className="cls-kpi-val" style={{ color: '#f59e0b' }}>{totalPending.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="cls-empty">
                    <div className="cls-empty-icon"><Users size={32} /></div>
                    <h3>Aucun client trouvé</h3>
                    <p>{searchTerm ? 'Essayez une autre recherche' : 'Commencez par ajouter votre premier client'}</p>
                    {!searchTerm && (
                        <button onClick={() => setIsNewDrawerOpen(true)} className="cls-cta" style={{ marginTop: '1rem', border: 'none', cursor: 'pointer' }}>
                            <Plus size={18} /> Nouveau Client
                        </button>
                    )}
                </div>
            )}

            <style>{clStyles}</style>
        </div>
    );
}

const clStyles = `
    .cls { max-width: 1100px; margin: 0 auto; }

    .cls-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    .cls-title {
        font-size: 1.75rem;
        font-weight: 700;
    }
    .cls-subtitle {
        color: var(--text-secondary);
        margin-top: 0.25rem;
        font-size: 0.875rem;
    }
    .cls-cta {
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
    .cls-cta:hover {
        box-shadow: 0 4px 16px rgba(139,92,246,0.3);
        transform: translateY(-1px);
    }

    /* Toolbar */
    .cls-toolbar {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
    .cls-search-wrap {
        flex: 1;
        min-width: 200px;
        position: relative;
    }
    .cls-search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        pointer-events: none;
    }
    .cls-search-input {
        width: 100%;
        padding-left: 2.75rem !important;
        background: var(--bg-card) !important;
    }
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0,0,0,0);
        border: 0;
    }
    .cls-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--text-secondary);
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
    }
    .cls-toggle-track {
        width: 36px;
        height: 20px;
        border-radius: 999px;
        background: var(--bg-surface-hover);
        position: relative;
        transition: background var(--transition-smooth);
    }
    .cls-toggle-active {
        background: var(--primary);
    }
    .cls-toggle-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: transform var(--transition-smooth);
    }
    .cls-toggle-active .cls-toggle-thumb {
        transform: translateX(16px);
    }

    /* Grid */
    .cls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    /* Card */
    .cls-card-link {
        text-decoration: none; color: inherit;
        display: flex; flex-direction: column; flex: 1;
        cursor: pointer;
    }
    .cls-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 1.25rem;
        transition: all var(--transition-smooth);
    }
    .cls-card:hover {
        border-color: var(--border-light);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    .cls-card-top {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        margin-bottom: 0.75rem;
    }
    .cls-card-emoji {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-lg);
        background: var(--bg-app);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;
    }
    .cls-card-info {
        overflow: hidden;
    }
    .cls-card-name {
        font-size: 0.9375rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .cls-card-email {
        font-size: 0.75rem;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .cls-card-notes {
        font-size: 0.75rem;
        color: var(--text-secondary);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }
    .cls-card-address {
        font-size: 0.6875rem;
        color: var(--text-muted);
        margin-bottom: 0.75rem;
    }
    .cls-card-kpis {
        display: flex;
        align-items: center;
        margin-top: auto;
        padding-top: 0.75rem;
        border-top: 1px dashed var(--border);
        gap: 0.75rem;
    }
    .cls-card-kpi {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .cls-card-kpi-sep {
        width: 1px;
        height: 12px;
        background: var(--border);
    }
    .cls-kpi-icon { color: var(--text-muted); }
    .cls-kpi-val { font-size: 0.75rem; font-weight: 700; color: var(--text-primary); }
    .cls-kpi-lbl { font-size: 0.6875rem; color: var(--text-muted); }

    /* Empty */
    .cls-empty {
        text-align: center;
        padding: 4rem 2rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
    }
    .cls-empty-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--primary-light);
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
    }
    .cls-empty h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    .cls-empty p {
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    /* Loading */
    .cls-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 4rem;
        color: var(--text-secondary);
    }
    .cls-loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
        .cls-grid { grid-template-columns: 1fr; }
        .cls-header { flex-direction: column; align-items: stretch; }
        .cls-title { font-size: 1.375rem; }
        .cls-cta { justify-content: center; text-align: center; }
        .cls-card:hover { transform: none; }
        .cls-card-bottom { flex-wrap: wrap; gap: 0.5rem; }
    }
`;
