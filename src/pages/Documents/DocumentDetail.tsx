
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import { useGeneratePdf } from '../../hooks/useGeneratePdf';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    ArrowLeft, FileText, Download, Send, CheckCircle,
    AlertCircle, Printer, Mail, Loader2,
    Edit2, RefreshCw, Plus, Trash2, Save, X
} from 'lucide-react';
import type { DocumentStatus } from '../../types';

const statusConfig: Record<DocumentStatus, { label: string; color: string; bg: string; icon: any }> = {
    draft: { label: 'Brouillon', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: FileText },
    sent: { label: 'Envoyé', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Send },
    paid: { label: 'Payé', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle },
    overdue: { label: 'En retard', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertCircle },
    cancelled: { label: 'Annulé', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: AlertCircle },
};

export function DocumentDetail() {
    const { id } = useParams<{ id: string }>();
    const { getDocument, sendEmail, updateStatus, updateDocument, getEmailLogs } = useDocuments();
    const generatePdf = useGeneratePdf();
    const { data: doc, isLoading, error } = getDocument(id!);
    const { data: emailLogs = [] } = getEmailLogs(id!);
    const [isEditing, setIsEditing] = useState(false);
    const [editLines, setEditLines] = useState<{ description: string; quantity: number; unit_price: number }[]>([]);

    if (isLoading) return (
        <div className="dd-loading animate-fade-in">
            <div className="dd-loading-spinner" />
            <p>Chargement du document...</p>
            <style>{ddStyles}</style>
        </div>
    );
    if (error || !doc) return <div className="dd-loading" style={{ color: 'var(--danger)' }}>Document introuvable</div>;

    const conf = statusConfig[doc.status];
    const StatusIcon = conf.icon;
    const isGeneratingPdf = generatePdf.isPending;
    const isSendingEmail = sendEmail.isPending;

    const startEditing = () => {
        setEditLines((doc.lines || []).map(l => ({ description: l.description, quantity: l.quantity, unit_price: l.unit_price })));
        setIsEditing(true);
    };
    const cancelEditing = () => setIsEditing(false);
    const saveEditing = async () => {
        await updateDocument.mutateAsync({ id: doc.id, lines: editLines });
        setIsEditing(false);
    };
    const editTotal = editLines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

    return (
        <div className="dd animate-fade-in">
            {/* Header */}
            <div className="dd-header">
                <div className="dd-header-left">
                    <Link to="/documents" className="dd-back"><ArrowLeft size={18} /></Link>
                    <div>
                        <div className="dd-header-title">
                            <div className="dd-doc-icon" style={{ background: conf.bg, color: conf.color }}>
                                {doc.type === 'quote' ? <FileText size={20} /> : <FileText size={20} />}
                            </div>
                            <div>
                                <h1 className="dd-title">{doc.number || 'Brouillon'}</h1>
                                <span className="dd-badge" style={{ background: conf.bg, color: conf.color }}>
                                    <StatusIcon size={12} /> {conf.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="dd-actions">
                    {/* 1. Modifier */}
                    {doc.status === 'draft' && !isEditing && (
                        <button onClick={startEditing} className="dd-btn dd-btn-secondary">
                            <Edit2 size={16} /> Modifier
                        </button>
                    )}

                    {/* 2. Télécharger / Générer */}
                    {!doc.public_url ? (
                        <button onClick={() => generatePdf.mutate(doc)} disabled={isGeneratingPdf} className="dd-btn dd-btn-secondary">
                            {isGeneratingPdf ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                            Générer PDF
                        </button>
                    ) : (
                        <a href={doc.public_url} target="_blank" rel="noopener noreferrer" className="dd-btn dd-btn-secondary">
                            <Download size={16} /> Télécharger
                        </a>
                    )}

                    {/* 3. Régénérer (Cycle icon) */}
                    {doc.public_url && (
                        <button onClick={() => generatePdf.mutate(doc)} disabled={isGeneratingPdf} className="dd-btn dd-btn-secondary" title="Régénérer le PDF">
                            <RefreshCw size={16} className={isGeneratingPdf ? 'animate-spin' : ''} />
                        </button>
                    )}

                    {/* 4. Envoyer */}
                    {doc.public_url && doc.status === 'draft' && (
                        <button
                            onClick={() => { if (confirm('Envoyer le document par email au client ?')) sendEmail.mutate({ id: doc.id, type: doc.type }); }}
                            disabled={isSendingEmail}
                            className="dd-btn dd-btn-primary"
                        >
                            {isSendingEmail ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            Envoyer
                        </button>
                    )}

                    {/* Status Actions */}
                    {doc.status === 'sent' && (
                        <button
                            onClick={() => { if (confirm('Marquer ce document comme payé ?')) updateStatus.mutate({ id: doc.id, status: 'paid' }); }}
                            className="dd-btn dd-btn-success"
                        >
                            <CheckCircle size={16} /> Marquer Payé
                        </button>
                    )}
                </div>
            </div>

            <div className="dd-layout">
                {/* Main card */}
                <div className="dd-main">
                    <div className="dd-info-row">
                        <div>
                            <div className="dd-info-label">Client</div>
                            <div className="dd-info-val-lg">{doc.client?.name}</div>
                            <div className="dd-info-sub">{doc.client?.address}</div>
                            <div className="dd-info-sub">{doc.client?.email}</div>
                        </div>
                        <div className="dd-info-right">
                            <div className="dd-info-label">{doc.type === 'quote' ? 'Devis' : 'Facture'}</div>
                            <div className="dd-info-val-lg">{format(parseISO(doc.date!), 'd MMM yyyy', { locale: fr })}</div>
                            {doc.due_date && (
                                <div className="dd-info-sub">Échéance : {format(parseISO(doc.due_date), 'd MMM yyyy', { locale: fr })}</div>
                            )}
                        </div>
                    </div>

                    {/* Lines table */}
                    {isEditing ? (
                        <div className="dd-edit-section">
                            <div className="dd-edit-header">
                                <span>Modifier les prestations</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="dd-btn dd-btn-secondary dd-btn-sm" onClick={cancelEditing}><X size={14} /> Annuler</button>
                                    <button className="dd-btn dd-btn-primary dd-btn-sm" onClick={saveEditing} disabled={updateDocument.isPending}>
                                        {updateDocument.isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Sauvegarder
                                    </button>
                                </div>
                            </div>
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th className="dd-th">Description</th>
                                        <th className="dd-th dd-th-right" style={{ width: 80 }}>Qté</th>
                                        <th className="dd-th dd-th-right" style={{ width: 100 }}>Prix Unit.</th>
                                        <th className="dd-th dd-th-right" style={{ width: 100 }}>Total</th>
                                        <th className="dd-th" style={{ width: 40 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editLines.map((line, i) => (
                                        <tr key={i} className="dd-tr">
                                            <td className="dd-td">
                                                <input className="dd-edit-input" value={line.description}
                                                    onChange={e => { const n = [...editLines]; n[i] = { ...n[i], description: e.target.value }; setEditLines(n); }} />
                                            </td>
                                            <td className="dd-td dd-td-right">
                                                <input className="dd-edit-input dd-edit-num" type="number" min={1} value={line.quantity}
                                                    onChange={e => { const n = [...editLines]; n[i] = { ...n[i], quantity: Number(e.target.value) }; setEditLines(n); }} />
                                            </td>
                                            <td className="dd-td dd-td-right">
                                                <input className="dd-edit-input dd-edit-num" type="number" min={0} step={0.01} value={line.unit_price}
                                                    onChange={e => { const n = [...editLines]; n[i] = { ...n[i], unit_price: Number(e.target.value) }; setEditLines(n); }} />
                                            </td>
                                            <td className="dd-td dd-td-right dd-td-bold">{(line.quantity * line.unit_price).toFixed(2)}€</td>
                                            <td className="dd-td">
                                                <button className="dd-btn-icon-sm" onClick={() => setEditLines(editLines.filter((_, j) => j !== i))}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button className="dd-add-line" onClick={() => setEditLines([...editLines, { description: '', quantity: 1, unit_price: 0 }])}>
                                <Plus size={14} /> Ajouter une ligne
                            </button>
                            <div className="dd-total-bar">
                                <span>Total HT</span>
                                <span className="dd-total-val">{editTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="dd-table-wrap">
                                <table className="dd-table">
                                    <thead>
                                        <tr>
                                            <th className="dd-th">Description</th>
                                            <th className="dd-th dd-th-right">Qté</th>
                                            <th className="dd-th dd-th-right">Prix Unit.</th>
                                            <th className="dd-th dd-th-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {doc.lines?.map((line) => (
                                            <tr key={line.id} className="dd-tr">
                                                <td className="dd-td">{line.description}</td>
                                                <td className="dd-td dd-td-right">{line.quantity}</td>
                                                <td className="dd-td dd-td-right">{line.unit_price}€</td>
                                                <td className="dd-td dd-td-right dd-td-bold">{(line.quantity * line.unit_price).toFixed(2)}€</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="dd-total-bar">
                                <span>Total HT</span>
                                <span className="dd-total-val">{doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                        </>
                    )}
                    <div className="dd-tva">TVA non applicable, art. 293 B du CGI</div>
                </div>

                {/* Sidebar */}
                <div className="dd-sidebar">
                    <div className="dd-sidebar-card">
                        <div className="dd-sidebar-title"><Mail size={16} /> Historique des envois</div>
                        {emailLogs.length === 0 ? (
                            <p className="dd-sidebar-empty">Aucun email envoyé pour le moment.</p>
                        ) : (
                            <div className="dd-email-logs">
                                {emailLogs.map(log => (
                                    <div key={log.id} className="dd-email-log">
                                        <div className="dd-email-log-top">
                                            <span className={`dd-log-status ${log.status === 'sent' ? 'dd-log-ok' : 'dd-log-err'}`}>
                                                {log.status === 'sent' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                            </span>
                                            <span className="dd-log-type">
                                                {log.type === 'reminder' ? 'Relance' : log.type === 'resend' ? 'Renvoi' : 'Envoi'}
                                            </span>
                                            <span className="dd-log-date">
                                                {format(parseISO(log.created_at), 'dd/MM HH:mm')}
                                            </span>
                                        </div>
                                        <div className="dd-log-recipient">{log.recipient}</div>
                                        {log.error && <div className="dd-log-error">{log.error}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {(doc.status === 'sent' || doc.status === 'overdue') && (
                            <button
                                onClick={() => { if (confirm("Renvoyer l'email ?")) sendEmail.mutate({ id: doc.id, type: 'resend' }); }}
                                className="dd-sidebar-link"
                            >
                                Renvoyer l'email
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style>{ddStyles}</style>
        </div>
    );
}

const ddStyles = `
    .dd { max-width: 1100px; margin: 0 auto; padding-bottom: 2rem; }

    .dd-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .dd-header-left { display: flex; align-items: center; gap: 1rem; }
    .dd-back {
        width: 36px; height: 36px; border-radius: var(--radius-lg);
        background: var(--bg-card); border: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center;
        color: var(--text-secondary); transition: all var(--transition-smooth); text-decoration: none;
    }
    .dd-back:hover { color: var(--text-primary); border-color: var(--primary); background: var(--primary-light); }
    .dd-header-title { display: flex; align-items: center; gap: 0.75rem; }
    .dd-doc-icon { width: 44px; height: 44px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; }
    .dd-title { font-size: 1.375rem; font-weight: 700; }
    .dd-badge {
        display: inline-flex; align-items: center; gap: 0.375rem;
        padding: 0.175rem 0.625rem; border-radius: 999px;
        font-size: 0.6875rem; font-weight: 600;
    }
    .dd-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .dd-btn {
        display: inline-flex; align-items: center; gap: 0.5rem;
        padding: 0.5rem 1rem; border-radius: var(--radius-lg);
        font-weight: 600; font-size: 0.8125rem; cursor: pointer;
        transition: all var(--transition-smooth); text-decoration: none; border: none;
    }
    .dd-btn-secondary { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary); }
    .dd-btn-secondary:hover { border-color: var(--primary); color: var(--primary); }
    .dd-btn-primary { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; }
    .dd-btn-primary:hover { box-shadow: 0 4px 16px rgba(139,92,246,0.3); }
    .dd-btn-success { background: #22c55e; color: white; }
    .dd-btn-success:hover { background: #16a34a; box-shadow: 0 4px 16px rgba(34,197,94,0.3); }

    .dd-layout { display: grid; grid-template-columns: 1fr 280px; gap: 1.5rem; }
    .dd-main {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 1.5rem;
    }
    .dd-info-row { display: flex; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
    .dd-info-right { text-align: right; }
    .dd-info-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.375rem; }
    .dd-info-val-lg { font-size: 1.125rem; font-weight: 700; }
    .dd-info-sub { font-size: 0.8125rem; color: var(--text-secondary); white-space: pre-line; margin-top: 0.25rem; }

    .dd-table-wrap { overflow-x: auto; margin-top: 0.5rem; }
    .dd-table { width: 100%; border-collapse: collapse; }
    .dd-th {
        padding: 0.75rem; font-size: 0.75rem; font-weight: 600;
        color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;
        border-bottom: 1px solid var(--border); text-align: left;
    }
    .dd-th-right { text-align: right; }
    .dd-tr { transition: background var(--transition-fast); }
    .dd-tr:hover { background: var(--bg-surface-hover); }
    .dd-td { padding: 0.875rem 0.75rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); white-space: pre-line; }
    .dd-td-right { text-align: right; }
    .dd-td-bold { font-weight: 600; }

    .dd-total-bar {
        display: flex; justify-content: flex-end; align-items: center; gap: 1rem;
        padding-top: 1.25rem; margin-top: 0.5rem; border-top: 2px solid var(--border);
        font-weight: 600;
    }
    .dd-total-val {
        font-size: 1.5rem; font-weight: 700;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .dd-tva { text-align: right; font-size: 0.6875rem; color: var(--text-muted); margin-top: 0.25rem; }

    .dd-sidebar-card {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 1.25rem;
    }
    .dd-sidebar-title {
        display: flex; align-items: center; gap: 0.5rem;
        font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem;
    }
    .dd-sidebar-empty { font-size: 0.8125rem; color: var(--text-muted); font-style: italic; }
    .dd-sidebar-link {
        display: inline-block; margin-top: 0.75rem; font-size: 0.8125rem;
        color: var(--primary); cursor: pointer; background: none; border: none; padding: 0;
    }
    .dd-sidebar-link:hover { text-decoration: underline; }

    /* Email logs */
    .dd-email-logs { display: flex; flex-direction: column; gap: 0.5rem; }
    .dd-email-log {
        background: var(--bg-surface-hover); border-radius: var(--radius-lg);
        padding: 0.625rem 0.75rem; font-size: 0.75rem;
    }
    .dd-email-log-top { display: flex; align-items: center; gap: 0.5rem; }
    .dd-log-status { display: flex; align-items: center; }
    .dd-log-ok { color: #22c55e; }
    .dd-log-err { color: #ef4444; }
    .dd-log-type { font-weight: 600; }
    .dd-log-date { color: var(--text-muted); margin-left: auto; font-size: 0.6875rem; }
    .dd-log-recipient { color: var(--text-muted); font-size: 0.6875rem; margin-top: 0.125rem; }
    .dd-log-error { color: #ef4444; font-size: 0.625rem; margin-top: 0.25rem; background: rgba(239,68,68,0.06); padding: 0.25rem 0.375rem; border-radius: 4px; }

    .dd-loading {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 1rem; padding: 4rem; color: var(--text-secondary);
    }
    .dd-loading-spinner {
        width: 32px; height: 32px; border: 3px solid var(--border);
        border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    .animate-spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 800px) {
        .dd-layout { grid-template-columns: 1fr; }
    }

    /* 3-dots menu */
    .dd-menu-wrap { position: relative; }
    .dd-btn-icon {
        width: 36px; height: 36px; border-radius: var(--radius-lg);
        background: var(--bg-card); border: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center;
        color: var(--text-secondary); cursor: pointer; transition: all var(--transition-smooth);
    }
    .dd-btn-icon:hover { border-color: var(--primary); color: var(--primary); }
    .dd-dropdown {
        position: absolute; right: 0; top: calc(100% + 4px); z-index: 50;
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-lg); box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        min-width: 200px; overflow: hidden;
    }
    .dd-dropdown-item {
        display: flex; align-items: center; gap: 0.5rem; width: 100%;
        padding: 0.625rem 1rem; font-size: 0.8125rem; cursor: pointer;
        background: none; border: none; color: var(--text-primary);
        transition: background var(--transition-fast);
    }
    .dd-dropdown-item:hover { background: var(--bg-surface-hover); }

    /* Edit mode */
    .dd-edit-section { margin-top: 0.5rem; }
    .dd-edit-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 0.75rem; font-weight: 600; font-size: 0.875rem;
    }
    .dd-btn-sm { padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: var(--radius-md); }
    .dd-edit-input {
        width: 100%; padding: 0.4rem 0.5rem; border: 1px solid var(--border);
        border-radius: var(--radius-md); background: var(--bg-main);
        font-size: 0.8125rem; color: var(--text-primary);
        transition: border-color var(--transition-fast);
    }
    .dd-edit-input:focus { outline: none; border-color: var(--primary); }
    .dd-edit-num { width: 80px; text-align: right; }
    .dd-btn-icon-sm {
        width: 28px; height: 28px; border-radius: var(--radius-md);
        display: flex; align-items: center; justify-content: center;
        background: none; border: none; color: var(--text-muted); cursor: pointer;
        transition: all var(--transition-fast);
    }
    .dd-btn-icon-sm:hover { color: #ef4444; background: rgba(239,68,68,0.08); }
    .dd-add-line {
        display: flex; align-items: center; gap: 0.375rem;
        padding: 0.5rem; margin-top: 0.5rem; width: 100%;
        background: none; border: 1px dashed var(--border); border-radius: var(--radius-md);
        color: var(--text-secondary); font-size: 0.8125rem; cursor: pointer;
        transition: all var(--transition-fast); justify-content: center;
    }
    .dd-add-line:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
`;
