
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, CheckCircle, AlertCircle, Send, Receipt } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';
import type { DocumentStatus } from '../../types';

const statusConfig: Record<DocumentStatus, { label: string; color: string; bg: string; icon: any }> = {
    draft: { label: 'Brouillon', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: FileText },
    sent: { label: 'Envoyé', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Send },
    paid: { label: 'Payé', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle },
    overdue: { label: 'En retard', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertCircle },
    cancelled: { label: 'Annulé', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: AlertCircle },
};

export function DocumentsList() {
    const { documents, isLoading, error } = useDocuments();
    const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    if (isLoading) return (
        <div className="dl-loading animate-fade-in">
            <div className="dl-loading-spinner" />
            <p>Chargement des documents...</p>
            <style>{dlStyles}</style>
        </div>
    );
    if (error) return <div className="dl-loading" style={{ color: 'var(--danger)' }}>Erreur: {(error as Error).message}</div>;

    const filteredDocs = documents
        .filter(doc => filterStatus === 'all' || doc.status === filterStatus)
        .filter(doc =>
            doc.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.number?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Stats
    const stats = {
        total: documents.length,
        drafts: documents.filter(d => d.status === 'draft').length,
        sent: documents.filter(d => d.status === 'sent').length,
        paid: documents.filter(d => d.status === 'paid').length,
    };

    return (
        <div className="dl animate-fade-in">
            {/* Header */}
            <div className="dl-header">
                <div>
                    <h1 className="dl-title">Documents</h1>
                    <p className="dl-subtitle">Devis et factures · {filteredDocs.length} résultat{filteredDocs.length > 1 ? 's' : ''}</p>
                </div>
                <Link to="/documents/new" className="dl-cta">
                    <Plus size={18} />
                    Nouveau Document
                </Link>
            </div>

            {/* Mini stats */}
            <div className="dl-stats">
                <div className="dl-stat">
                    <span className="dl-stat-val">{stats.total}</span>
                    <span className="dl-stat-label">Total</span>
                </div>
                <div className="dl-stat">
                    <span className="dl-stat-val" style={{ color: statusConfig.draft.color }}>{stats.drafts}</span>
                    <span className="dl-stat-label">Brouillons</span>
                </div>
                <div className="dl-stat">
                    <span className="dl-stat-val" style={{ color: statusConfig.sent.color }}>{stats.sent}</span>
                    <span className="dl-stat-label">Envoyés</span>
                </div>
                <div className="dl-stat">
                    <span className="dl-stat-val" style={{ color: statusConfig.paid.color }}>{stats.paid}</span>
                    <span className="dl-stat-label">Payés</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="dl-toolbar">
                <div className="dl-search-wrap">
                    <Search className="dl-search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par client ou numéro..."
                        className="dl-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="dl-filters">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={clsx('dl-filter-btn', filterStatus === 'all' && 'dl-filter-active')}
                    >
                        Tous
                    </button>
                    {(Object.keys(statusConfig) as DocumentStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={clsx('dl-filter-btn', filterStatus === status && 'dl-filter-active')}
                        >
                            {statusConfig[status].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {filteredDocs.length > 0 ? (
                <div className="dl-list">
                    {filteredDocs.map((doc, i) => {
                        const StatusIcon = statusConfig[doc.status].icon;
                        const conf = statusConfig[doc.status];
                        return (
                            <Link
                                to={`/documents/${doc.id}`}
                                key={doc.id}
                                className="dl-row animate-slide-up"
                                style={{ animationDelay: `${i * 0.03}s`, textDecoration: 'none' }}
                            >
                                <div className="dl-row-left">
                                    <div className="dl-row-icon" style={{ background: conf.bg, color: conf.color }}>
                                        {doc.type === 'quote' ? <FileText size={18} /> : <Receipt size={18} />}
                                    </div>
                                    <div className="dl-row-info">
                                        <div className="dl-row-number">
                                            {doc.number || 'Brouillon'}
                                            <span className="dl-row-type">{doc.type === 'quote' ? 'Devis' : 'Facture'}</span>
                                        </div>
                                        <div className="dl-row-client">{doc.client?.name || '—'}</div>
                                    </div>
                                </div>
                                <div className="dl-row-right">
                                    <div className="dl-row-amount">
                                        {doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </div>
                                    <div className="dl-row-date">
                                        {doc.date ? format(parseISO(doc.date), 'd MMM yyyy', { locale: fr }) : '—'}
                                    </div>
                                    <span className="dl-row-badge" style={{ background: conf.bg, color: conf.color }}>
                                        <StatusIcon size={12} />
                                        {conf.label}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="dl-empty">
                    <div className="dl-empty-icon"><FileText size={32} /></div>
                    <h3>Aucun document trouvé</h3>
                    <p>Créez votre premier devis ou facture</p>
                </div>
            )}

            <style>{dlStyles}</style>
        </div>
    );
}

const dlStyles = `
    .dl { max-width: 1100px; margin: 0 auto; }

    .dl-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    .dl-title { font-size: 1.75rem; font-weight: 700; }
    .dl-subtitle { color: var(--text-secondary); margin-top: 0.25rem; font-size: 0.875rem; }
    .dl-cta {
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
    .dl-cta:hover {
        box-shadow: 0 4px 16px rgba(139,92,246,0.3);
        transform: translateY(-1px);
    }

    /* Stats */
    .dl-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .dl-stat {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .dl-stat-val { font-size: 1.5rem; font-weight: 700; }
    .dl-stat-label { font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

    /* Toolbar */
    .dl-toolbar {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }
    .dl-search-wrap {
        position: relative;
    }
    .dl-search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        pointer-events: none;
    }
    .dl-search-input {
        width: 100%;
        padding-left: 2.75rem !important;
        background: var(--bg-card) !important;
    }
    .dl-filters {
        display: flex;
        gap: 0.375rem;
        overflow-x: auto;
        padding-bottom: 2px;
    }
    .dl-filter-btn {
        padding: 0.375rem 0.875rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    .dl-filter-btn:hover { border-color: var(--primary); color: var(--primary); }
    .dl-filter-active {
        background: var(--primary) !important;
        color: white !important;
        border-color: var(--primary) !important;
    }

    /* List */
    .dl-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .dl-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1rem 1.25rem;
        transition: all var(--transition-smooth);
        cursor: pointer;
        flex-wrap: wrap;
        gap: 1rem;
        color: inherit;
    }
    .dl-row:hover {
        border-color: var(--primary);
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        transform: translateY(-1px);
    }
    .dl-row-left {
        display: flex;
        align-items: center;
        gap: 0.875rem;
    }
    .dl-row-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .dl-row-number {
        font-weight: 600;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .dl-row-type {
        font-size: 0.625rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
        background: var(--bg-surface-hover);
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-weight: 600;
    }
    .dl-row-client {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }
    .dl-row-right {
        display: flex;
        align-items: center;
        gap: 1.25rem;
    }
    .dl-row-amount {
        font-weight: 700;
        font-size: 0.9375rem;
    }
    .dl-row-date {
        font-size: 0.75rem;
        color: var(--text-muted);
        white-space: nowrap;
    }
    .dl-row-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 600;
        white-space: nowrap;
    }

    /* Empty */
    .dl-empty {
        text-align: center;
        padding: 4rem 2rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
    }
    .dl-empty-icon {
        width: 64px; height: 64px;
        border-radius: 50%;
        background: rgba(59,130,246,0.1);
        color: #3b82f6;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1rem;
    }
    .dl-empty h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
    .dl-empty p { color: var(--text-secondary); font-size: 0.875rem; }

    .dl-loading {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 1rem; padding: 4rem; color: var(--text-secondary);
    }
    .dl-loading-spinner {
        width: 32px; height: 32px;
        border: 3px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 700px) {
        .dl-stats { grid-template-columns: repeat(2, 1fr); }
        .dl-row { flex-direction: column; align-items: flex-start; }
        .dl-row-right { width: 100%; justify-content: space-between; flex-wrap: wrap; }
    }
`;
