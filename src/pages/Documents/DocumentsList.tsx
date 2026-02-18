
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';
import type { DocumentStatus } from '../../types';

const statusConfig: Record<DocumentStatus, { label: string; color: string; icon: any }> = {
    draft: { label: 'Brouillon', color: 'text-[--status-draft]', icon: FileText },
    sent: { label: 'Envoyé', color: 'text-[--status-sent]', icon: Send },
    paid: { label: 'Payé', color: 'text-[--status-paid]', icon: CheckCircle },
    overdue: { label: 'En retard', color: 'text-[--status-overdue]', icon: AlertCircle },
    cancelled: { label: 'Annulé', color: 'text-[--status-cancelled]', icon: AlertCircle },
};

export function DocumentsList() {
    const { documents, isLoading, error } = useDocuments();
    const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    if (isLoading) return <div className="p-8 text-center text-[--text-secondary]">Chargement des documents...</div>;
    if (error) return <div className="p-8 text-center text-[--danger]">Erreur: {(error as Error).message}</div>;

    const filteredDocs = documents
        .filter(doc => filterStatus === 'all' || doc.status === filterStatus)
        .filter(doc =>
            doc.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.number?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[--primary] to-[--secondary] bg-clip-text text-transparent">
                        Documents
                    </h1>
                    <p className="text-[--text-secondary] text-sm mt-1">
                        Devis et factures
                    </p>
                </div>
                <Link
                    to="/documents/new"
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    Nouveau Document
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between bg-[--bg-surface] p-4 rounded-lg border border-[--border]">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-secondary]" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par client ou numéro..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={clsx(
                            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                            filterStatus === 'all'
                                ? 'bg-[--primary] text-white'
                                : 'bg-[--bg-app] text-[--text-secondary] hover:bg-[--bg-surface-hover]'
                        )}
                    >
                        Tous
                    </button>
                    {(Object.keys(statusConfig) as DocumentStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={clsx(
                                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                                filterStatus === status
                                    ? 'bg-[--primary] text-white'
                                    : 'bg-[--bg-app] text-[--text-secondary] hover:bg-[--bg-surface-hover]'
                            )}
                        >
                            {statusConfig[status].label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-[--bg-surface] rounded-lg border border-[--border] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[--bg-surface-hover] text-left text-sm text-[--text-secondary]">
                            <th className="px-6 py-3 font-medium">Numéro</th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium">Client</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium text-right">Montant</th>
                            <th className="px-6 py-3 font-medium text-right">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[--border]">
                        {filteredDocs.map((doc) => {
                            const StatusIcon = statusConfig[doc.status].icon;
                            return (
                                <tr key={doc.id} className="group hover:bg-[--bg-surface-hover]/50 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 font-mono text-sm">
                                        <Link to={`/documents/${doc.id}`} className="hover:text-[--primary] hover:underline">
                                            {doc.number || 'Brouillon'}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm capitalize text-[--text-secondary]">
                                        {doc.type === 'quote' ? 'Devis' : 'Facture'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-[--text-primary]">
                                        {doc.client?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[--text-secondary]">
                                        {doc.date ? format(parseISO(doc.date), 'd MMM yyyy', { locale: fr }) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-[--text-primary]">
                                        {doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[--bg-app] border border-[--border]", statusConfig[doc.status].color)}>
                                            <StatusIcon size={12} />
                                            {statusConfig[doc.status].label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredDocs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-[--text-secondary]">
                                    Aucun document trouvé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
