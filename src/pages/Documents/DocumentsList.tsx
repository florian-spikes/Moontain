import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, CheckCircle, AlertCircle, Send, Receipt } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { DocumentDrawer } from '../../components/DocumentDrawer';
import { useNavigate } from 'react-router-dom';
import type { DocumentStatus, DocumentType } from '../../types';

const statusConfig: Record<DocumentStatus, { label: string; color: string; bg: string; icon: any }> = {
    draft: { label: 'Brouillon', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: FileText },
    sent: { label: 'Envoyé', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Send },
    accepted: { label: 'Accepté', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: CheckCircle },
    paid: { label: 'Payé', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle },
    overdue: { label: 'En retard', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertCircle },
    cancelled: { label: 'Annulé', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: AlertCircle },
};

export function DocumentsList() {
    const { documents, isLoading, error, createDocument } = useDocuments();
    const [activeTab, setActiveTab] = useState<DocumentType>('invoice');
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
    const navigate = useNavigate();

    if (isLoading) return (
        <div className="dl-loading animate-fade-in">
            <div className="dl-loading-spinner" />
            <p>Chargement des documents...</p>
            <style>{dlStyles}</style>
        </div>
    );
    if (error) return <div className="dl-loading" style={{ color: 'var(--danger)' }}>Erreur: {(error as Error).message}</div>;

    const filteredDocs = documents
        .filter(doc => doc.type === activeTab)
        .filter(doc =>
            doc.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.number?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Grouping for Kanban
    const invoiceColumns: DocumentStatus[] = ['draft', 'sent', 'overdue', 'paid'];
    const quoteColumns: DocumentStatus[] = ['draft', 'sent', 'accepted'];

    const columns = activeTab === 'invoice' ? invoiceColumns : quoteColumns;

    const docsByStatus = columns.reduce((acc, status) => {
        acc[status] = filteredDocs.filter(d => d.status === status);
        return acc;
    }, {} as Record<DocumentStatus, typeof documents>);

    // Also include 'cancelled' if there are any, generally at the end or hidden. For this Kanban we just append it if not empty
    const cancelledDocs = filteredDocs.filter(d => d.status === 'cancelled');
    if (cancelledDocs.length > 0) {
        columns.push('cancelled');
        docsByStatus['cancelled'] = cancelledDocs;
    }

    return (
        <div className="dl animate-fade-in">
            <DocumentDrawer
                isOpen={isNewDrawerOpen}
                onClose={() => setIsNewDrawerOpen(false)}
                onSave={async (data) => {
                    const newDoc = await createDocument.mutateAsync(data as any);
                    navigate(`/documents/${newDoc.id}`);
                }}
                isSaving={createDocument.isPending}
            />

            {/* Header */}
            <div className="dl-header">
                <div>
                    <h1 className="dl-title">Documents</h1>
                    <p className="dl-subtitle">Vue globale de facturation · {filteredDocs.length} {activeTab === 'quote' ? 'devis' : 'factures'}</p>
                </div>
                <button onClick={() => setIsNewDrawerOpen(true)} className="dl-cta" style={{ border: 'none', cursor: 'pointer' }}>
                    <Plus size={18} />
                    Nouveau Document
                </button>
            </div>

            {/* Tabs & Toolbar */}
            <div className="dl-toolbar">
                <div className="dl-search-wrap">
                    <Search className="dl-search-icon" size={18} />
                    <input
                        type="text"
                        placeholder={`Rechercher un client ou un numéro...`}
                        className="dl-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="dl-tabs">
                    <button
                        onClick={() => setActiveTab('invoice')}
                        className={clsx('dl-tab-btn', activeTab === 'invoice' && 'dl-tab-active')}
                    >
                        <Receipt size={16} /> Factures
                    </button>
                    <button
                        onClick={() => setActiveTab('quote')}
                        className={clsx('dl-tab-btn', activeTab === 'quote' && 'dl-tab-active')}
                    >
                        <FileText size={16} /> Devis
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="dl-kanban">
                {columns.map(status => {
                    const colDocs = docsByStatus[status] || [];
                    const conf = statusConfig[status];
                    const StatusIcon = conf.icon;
                    return (
                        <div key={status} className="dl-k-col">
                            <div className="dl-k-col-head">
                                <div className="dl-k-col-title" style={{ color: conf.color }}>
                                    <StatusIcon size={14} />
                                    <span>{conf.label}</span>
                                </div>
                                <div className="dl-k-col-count">{colDocs.length}</div>
                            </div>
                            <div className="dl-k-col-body">
                                {colDocs.map((doc, i) => (
                                    <Link
                                        to={`/documents/${doc.id}`}
                                        key={doc.id}
                                        className="dl-k-card animate-slide-up"
                                        style={{ animationDelay: `${i * 0.03}s` }}
                                    >
                                        <div className="dl-k-card-head">
                                            <span className="dl-k-num">{doc.number || 'Brouillon'}</span>
                                            <span className="dl-k-val">{doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                                        </div>
                                        <div className="dl-k-client">{doc.client?.name || '—'}</div>
                                        <div className="dl-k-date">
                                            {status === 'draft' ? (
                                                `Créé le ${doc.date ? format(parseISO(doc.date), 'dd/MM/yyyy') : '—'}`
                                            ) : doc.due_date && (status === 'sent' || status === 'overdue') ? (
                                                <span style={{ color: status === 'overdue' ? 'var(--danger)' : 'inherit' }}>
                                                    Échéance : {format(parseISO(doc.due_date), 'dd/MM/yyyy')}
                                                </span>
                                            ) : (
                                                `${doc.date ? format(parseISO(doc.date), 'dd/MM/yyyy') : '—'}`
                                            )}
                                        </div>
                                    </Link>
                                ))}
                                {colDocs.length === 0 && (
                                    <div className="dl-k-empty">Aucun</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{dlStyles}</style>
        </div>
    );
}

const dlStyles = `
    .dl { max-width: 1400px; margin: 0 auto; height: 100%; display: flex; flex-direction: column; }

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

    /* Toolbar & Tabs */
    .dl-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
    .dl-search-wrap {
        position: relative;
        flex: 1;
        min-width: 250px;
        max-width: 400px;
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
    
    .dl-tabs {
        display: flex;
        background: rgba(0,0,0,0.03);
        padding: 0.25rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
    }
    .dl-tab-btn {
        display: flex; align-items: center; gap: 0.5rem;
        padding: 0.5rem 1.25rem;
        border-radius: var(--radius-md);
        font-size: 0.8125rem;
        font-weight: 600;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    .dl-tab-btn:hover { color: var(--text-primary); }
    .dl-tab-active {
        background: var(--bg-card);
        color: var(--primary);
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    /* Kanban Board */
    .dl-kanban {
        display: flex;
        gap: 1.25rem;
        overflow-x: auto;
        padding-bottom: 2rem;
        flex: 1;
        align-items: flex-start;
        min-height: 500px;
        width: 100%;
        scroll-snap-type: x mandatory;
    }
    .dl-k-col {
        flex: 1;
        min-width: 260px;
        background: rgba(0,0,0,0.02);
        border-radius: var(--radius-xl);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        border: 1px dashed transparent;
        scroll-snap-align: start;
    }
    .dl-k-col-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 0 0.5rem;
    }
    .dl-k-col-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        font-size: 0.8125rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .dl-k-col-count {
        background: var(--bg-card);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
    }
    .dl-k-col-body {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        flex: 1;
    }
    .dl-k-empty {
        text-align: center;
        padding: 2rem 1rem;
        font-size: 0.8125rem;
        color: var(--text-muted);
        font-style: italic;
        background: rgba(0,0,0,0.02);
        border-radius: var(--radius-lg);
        border: 1px dashed var(--border);
    }

    /* Kanban Cards */
    .dl-k-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1rem;
        cursor: pointer;
        transition: all var(--transition-fast);
        text-decoration: none;
        color: inherit;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .dl-k-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(139,92,246,0.1);
        border-color: var(--primary);
    }
    .dl-k-card-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
    .dl-k-num {
        font-weight: 700;
        font-size: 0.875rem;
        color: var(--text-primary);
    }
    .dl-k-val {
        font-weight: 700;
        font-size: 0.875rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .dl-k-client {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        font-weight: 500;
    }
    .dl-k-date {
        font-size: 0.6875rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

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

    @media (max-width: 768px) {
        .dl-header { flex-direction: column; align-items: stretch; }
        .dl-cta { justify-content: center; text-align: center; }
        .dl-toolbar { flex-direction: column-reverse; align-items: stretch; }
        .dl-search-wrap { max-width: 100%; }
        .dl-tabs { justify-content: stretch; }
        .dl-tab-btn { flex: 1; justify-content: center; }
    }
`;
