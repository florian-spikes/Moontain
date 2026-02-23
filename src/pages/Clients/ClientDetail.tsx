
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import {
    ArrowLeft, FileText, Receipt, Edit2,
    DollarSign, Clock, CheckCircle, AlertCircle, Send,
    Hash, Briefcase, Mail, Globe
} from 'lucide-react';
import type { Client, Document, Service, DocumentStatus } from '../../types';
import { useState } from 'react';
import { ClientDrawer } from '../../components/ClientDrawer';
import { DocumentDrawer } from '../../components/DocumentDrawer';
import { useClients } from '../../hooks/useClients';
import { useDocuments } from '../../hooks/useDocuments';
import { useNavigate } from 'react-router-dom';

const statusConfig: Record<DocumentStatus, { label: string; color: string; bg: string; icon: any }> = {
    draft: { label: 'Brouillon', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: FileText },
    sent: { label: 'Envoyé', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Send },
    accepted: { label: 'Accepté', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: CheckCircle },
    paid: { label: 'Payé', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle },
    overdue: { label: 'En retard', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertCircle },
    cancelled: { label: 'Annulé', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: AlertCircle },
};

export function ClientDetail() {
    const { id } = useParams<{ id: string }>();
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isNewDocDrawerOpen, setIsNewDocDrawerOpen] = useState(false);
    const { updateClient } = useClients();
    const { createDocument } = useDocuments();
    const navigate = useNavigate();

    const { data: client, isLoading: clientLoading } = useQuery({
        queryKey: ['client', id],
        queryFn: async () => {
            const { data, error } = await supabase.from('clients').select('*').eq('id', id!).single();
            if (error) throw error;
            return data as Client;
        },
        enabled: !!id,
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['client-documents', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('client_id', id!)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Document[];
        },
        enabled: !!id,
    });

    const { data: services = [] } = useQuery({
        queryKey: ['client-services', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('client_id', id!)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Service[];
        },
        enabled: !!id,
    });

    if (clientLoading) return (
        <div className="cd-loading animate-fade-in">
            <div className="cd-spinner" />
            <p>Chargement du client...</p>
            <style>{cdStyles}</style>
        </div>
    );

    if (!client) return (
        <div className="cd-loading" style={{ color: 'var(--danger)' }}>
            <p>Client introuvable</p>
            <Link to="/clients" style={{ color: 'var(--primary)', marginTop: '1rem', display: 'block' }}>← Retour</Link>
            <style>{cdStyles}</style>
        </div>
    );

    // KPI calculations
    const totalPaid = documents.filter(d => d.status === 'paid').reduce((s, d) => s + (d.total_amount || 0), 0);
    const totalPending = documents.filter(d => ['sent', 'overdue'].includes(d.status)).reduce((s, d) => s + (d.total_amount || 0), 0);
    const docCount = documents.length;
    const activeServices = services.filter(s => !s.end_date || new Date(s.end_date) > new Date()).length;

    return (
        <div className="cd animate-fade-in">
            {/* Header */}
            <div className="cd-header">
                <div className="cd-header-left">
                    <Link to="/clients" className="cd-back"><ArrowLeft size={18} /></Link>
                    <div className="cd-avatar">{client.emoji || '🏢'}</div>
                    <div>
                        <h1 className="cd-name">{client.name}</h1>
                        <div className="cd-meta">
                            {client.email && <span><Mail size={12} /> {client.email}</span>}
                            {client.website && (
                                <span style={{ marginLeft: '1rem' }}>
                                    <Globe size={12} />
                                    <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {client.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </span>
                            )}
                            {client.address && <span style={{ marginLeft: '1rem' }}>{client.address}</span>}
                        </div>
                    </div>
                </div>
                <div className="cd-header-actions">
                    <button onClick={() => setIsEditDrawerOpen(true)} className="cd-btn cd-btn-secondary">
                        <Edit2 size={15} /> Modifier
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="cd-kpis">
                <div className="cd-kpi">
                    <div className="cd-kpi-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}><DollarSign size={18} /></div>
                    <div>
                        <div className="cd-kpi-label">Total facturé (payé)</div>
                        <div className="cd-kpi-val">{totalPaid.toLocaleString('fr-FR')}€</div>
                    </div>
                </div>
                <div className="cd-kpi">
                    <div className="cd-kpi-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Clock size={18} /></div>
                    <div>
                        <div className="cd-kpi-label">En attente</div>
                        <div className="cd-kpi-val">{totalPending.toLocaleString('fr-FR')}€</div>
                    </div>
                </div>
                <div className="cd-kpi">
                    <div className="cd-kpi-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><Hash size={18} /></div>
                    <div>
                        <div className="cd-kpi-label">Documents</div>
                        <div className="cd-kpi-val">{docCount}</div>
                    </div>
                </div>
                <div className="cd-kpi">
                    <div className="cd-kpi-icon" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}><Briefcase size={18} /></div>
                    <div>
                        <div className="cd-kpi-label">Services actifs</div>
                        <div className="cd-kpi-val">{activeServices}</div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {client.notes && (
                <div className="cd-card cd-notes">
                    <h3 className="cd-section-title">Notes</h3>
                    <p>{client.notes}</p>
                </div>
            )}

            {/* Documents Table */}
            <div className="cd-card">
                <div className="cd-section-header">
                    <h3 className="cd-section-title">Historique des documents</h3>
                    <button onClick={() => setIsNewDocDrawerOpen(true)} className="cd-btn cd-btn-primary-sm" style={{ border: 'none', cursor: 'pointer' }}>
                        + Nouveau
                    </button>
                </div>

                {documents.length === 0 ? (
                    <div className="cd-empty">
                        <FileText size={28} />
                        <p>Aucun document pour ce client</p>
                    </div>
                ) : (
                    <div className="cd-table-wrap">
                        <table className="cd-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Numéro</th>
                                    <th>Date</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map(doc => {
                                    const conf = statusConfig[doc.status];
                                    const StatusIcon = conf.icon;
                                    return (
                                        <tr key={doc.id}>
                                            <td>
                                                <Link to={`/documents/${doc.id}`} className="cd-doc-link">
                                                    {doc.type === 'invoice' ? <Receipt size={14} /> : <FileText size={14} />}
                                                    {doc.type === 'invoice' ? 'Facture' : 'Devis'}
                                                </Link>
                                            </td>
                                            <td className="cd-doc-num">
                                                <Link to={`/documents/${doc.id}`} className="cd-doc-link">
                                                    {doc.number || '—'}
                                                </Link>
                                            </td>
                                            <td>{doc.date ? format(parseISO(doc.date), 'dd/MM/yyyy') : '—'}</td>
                                            <td className="cd-doc-amount">{(doc.total_amount || 0).toLocaleString('fr-FR')}€</td>
                                            <td>
                                                <span className="cd-status-badge" style={{ background: conf.bg, color: conf.color }}>
                                                    <StatusIcon size={11} /> {conf.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ClientDrawer
                isOpen={isEditDrawerOpen}
                onClose={() => setIsEditDrawerOpen(false)}
                client={client}
                onSave={async (data) => {
                    await updateClient.mutateAsync({ id: client.id, ...data });
                }}
                isSaving={updateClient.isPending || (updateClient as any).isLoading}
            />

            <DocumentDrawer
                isOpen={isNewDocDrawerOpen}
                onClose={() => setIsNewDocDrawerOpen(false)}
                initialClientId={client.id}
                onSave={async (data) => {
                    const newDoc = await createDocument.mutateAsync(data as any);
                    navigate(`/documents/${newDoc.id}`);
                }}
                isSaving={createDocument.isPending}
            />

            <style>{cdStyles}</style>
        </div>
    );
}

const cdStyles = `
    .cd { max-width: 1100px; margin: 0 auto; padding-bottom: 2rem; }
    .cd-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; color: var(--text-muted); gap: 1rem; }
    .cd-spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Header */
    .cd-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .cd-header-left { display: flex; align-items: center; gap: 0.875rem; }
    .cd-back {
        width: 36px; height: 36px; border-radius: var(--radius-lg);
        background: var(--bg-card); border: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center;
        color: var(--text-secondary); transition: all var(--transition-smooth); text-decoration: none;
    }
    .cd-back:hover { color: var(--text-primary); border-color: var(--primary); }
    .cd-avatar { font-size: 1.75rem; }
    .cd-name { font-size: 1.5rem; font-weight: 700; }
    .cd-meta { display: flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.125rem; }
    .cd-header-actions { display: flex; gap: 0.5rem; }

    /* Buttons */
    .cd-btn {
        display: inline-flex; align-items: center; gap: 0.375rem;
        padding: 0.5rem 1rem; border-radius: var(--radius-lg);
        font-weight: 600; font-size: 0.8125rem; text-decoration: none;
        transition: all var(--transition-smooth); border: none; cursor: pointer;
    }
    .cd-btn-secondary { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary); }
    .cd-btn-secondary:hover { border-color: var(--primary); color: var(--primary); }
    .cd-btn-primary-sm {
        padding: 0.375rem 0.875rem; border-radius: var(--radius-lg);
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white; font-weight: 600; font-size: 0.75rem; text-decoration: none;
        transition: all var(--transition-smooth);
    }
    .cd-btn-primary-sm:hover { box-shadow: 0 4px 12px rgba(139,92,246,0.3); transform: translateY(-1px); }

    /* KPIs */
    .cd-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .cd-kpi {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 1rem 1.25rem;
        display: flex; align-items: center; gap: 0.875rem;
        transition: all var(--transition-smooth);
    }
    .cd-kpi:hover { border-color: var(--border-light); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .cd-kpi-icon { width: 40px; height: 40px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cd-kpi-label { font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .cd-kpi-val { font-size: 1.25rem; font-weight: 700; margin-top: 0.125rem; }

    /* Cards */
    .cd-card {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 1.5rem; margin-bottom: 1rem;
    }
    .cd-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .cd-section-title { font-size: 0.9375rem; font-weight: 700; }
    .cd-notes { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; }
    .cd-notes p { margin-top: 0.5rem; }
    .cd-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: var(--text-muted); gap: 0.5rem; }

    /* Table */
    .cd-table-wrap { overflow-x: auto; }
    .cd-table { width: 100%; border-collapse: collapse; }
    .cd-table th {
        text-align: left; padding: 0.625rem 0.75rem;
        font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.06em; color: var(--text-muted);
        border-bottom: 1px solid var(--border);
    }
    .cd-table td {
        padding: 0.75rem; font-size: 0.8125rem;
        border-bottom: 1px solid var(--border);
    }
    .cd-table tr:last-child td { border-bottom: none; }
    .cd-table tr:hover td { background: var(--bg-surface-hover); }
    .cd-doc-link {
        display: inline-flex; align-items: center; gap: 0.375rem;
        text-decoration: none; color: var(--text-primary);
        font-weight: 500; transition: color var(--transition-smooth);
    }
    .cd-doc-link:hover { color: var(--primary); }
    .cd-doc-num { font-family: monospace; font-size: 0.8125rem; }
    .cd-doc-amount { font-weight: 700; color: var(--primary); }
    .cd-status-badge {
        display: inline-flex; align-items: center; gap: 0.25rem;
        padding: 0.2rem 0.625rem; border-radius: 999px;
        font-size: 0.6875rem; font-weight: 600;
    }

    @media (max-width: 768px) {
        .cd-kpis { grid-template-columns: repeat(2, 1fr); }
        .cd-header { flex-direction: column; align-items: flex-start; }
        .cd-header-left { flex-wrap: wrap; }
        .cd-name { font-size: 1.25rem; }
        .cd-meta { flex-wrap: wrap; gap: 0.5rem; }
        .cd-meta span { margin-left: 0 !important; }
        .cd-kpi:hover { transform: none; }
        .cd-card { padding: 1rem; }
        .cd-table th:nth-child(3), .cd-table td:nth-child(3) { display: none; }
    }
    @media (max-width: 480px) {
        .cd-kpis { grid-template-columns: 1fr; }
    }
`;
