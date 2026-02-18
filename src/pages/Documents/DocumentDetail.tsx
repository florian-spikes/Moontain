
import { useParams, Link } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    ArrowLeft, FileText, Download, Send, CheckCircle,
    AlertCircle, Printer, Mail, Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import type { DocumentStatus } from '../../types';

const statusConfig: Record<DocumentStatus, { label: string; color: string; icon: any }> = {
    draft: { label: 'Brouillon', color: 'text-[--status-draft]', icon: FileText },
    sent: { label: 'Envoyé', color: 'text-[--status-sent]', icon: Send },
    paid: { label: 'Payé', color: 'text-[--status-paid]', icon: CheckCircle },
    overdue: { label: 'En retard', color: 'text-[--status-overdue]', icon: AlertCircle },
    cancelled: { label: 'Annulé', color: 'text-[--status-cancelled]', icon: AlertCircle },
};

export function DocumentDetail() {
    const { id } = useParams<{ id: string }>();
    const { getDocument, generatePdf, sendEmail, updateStatus } = useDocuments();
    const { data: doc, isLoading, error } = getDocument(id!);

    if (isLoading) return <div className="p-8 text-center text-[--text-secondary]">Chargement du document...</div>;
    if (error || !doc) return <div className="p-8 text-center text-[--danger]">Document introuvable</div>;

    const StatusIcon = statusConfig[doc.status].icon;
    const isGeneratingPdf = generatePdf.isPending;
    const isSendingEmail = sendEmail.isPending;

    const handleGeneratePdf = () => {
        generatePdf.mutate(doc.id);
    };

    const handleSendEmail = () => {
        if (confirm('Envoyer le document par email au client ?')) {
            sendEmail.mutate({ id: doc.id, type: doc.type });
        }
    };

    const handleMarkPaid = () => {
        if (confirm('Marquer ce document comme payé ?')) {
            updateStatus.mutate({ id: doc.id, status: 'paid' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/documents" className="text-[--text-secondary] hover:text-[--text-primary]">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {doc.number || 'Brouillon'}
                            <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-[--bg-app] border border-[--border]", statusConfig[doc.status].color)}>
                                <StatusIcon size={14} />
                                {statusConfig[doc.status].label}
                            </span>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Actions */}
                    {!doc.public_url && (
                        <button
                            onClick={handleGeneratePdf}
                            disabled={isGeneratingPdf}
                            className="btn btn-secondary"
                        >
                            {isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                            Générer PDF
                        </button>
                    )}

                    {doc.public_url && (
                        <a
                            href={doc.public_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                        >
                            <Download size={18} />
                            Télécharger
                        </a>
                    )}

                    {doc.public_url && doc.status === 'draft' && (
                        <button
                            onClick={handleSendEmail}
                            disabled={isSendingEmail}
                            className="btn btn-primary"
                        >
                            {isSendingEmail ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            Envoyer
                        </button>
                    )}

                    {doc.status === 'sent' && (
                        <button
                            onClick={handleMarkPaid}
                            className="btn btn-primary bg-[--success] hover:bg-green-600"
                        >
                            <CheckCircle size={18} />
                            Marquer Payé
                        </button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="card md:col-span-2">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-[--text-secondary] text-sm uppercase mb-1">Client</h3>
                            <p className="font-bold text-lg">{doc.client?.name}</p>
                            <p className="text-[--text-secondary] whitespace-pre-line">{doc.client?.address}</p>
                            <p className="text-[--text-secondary]">{doc.client?.email}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[--text-secondary] text-sm uppercase mb-1">
                                {doc.type === 'quote' ? 'Devis' : 'Facture'}
                            </h3>
                            <p className="font-mono text-lg">{format(parseISO(doc.date!), 'd MMM yyyy', { locale: fr })}</p>
                            {doc.due_date && (
                                <p className="text-sm text-[--text-secondary] mt-1">
                                    Échéance : {format(parseISO(doc.due_date), 'd MMM yyyy', { locale: fr })}
                                </p>
                            )}
                        </div>
                    </div>

                    <table className="w-full mt-8">
                        <thead>
                            <tr className="text-left text-sm text-[--text-secondary] border-b border-[--border]">
                                <th className="py-2 font-medium">Description</th>
                                <th className="py-2 font-medium text-right">Qté</th>
                                <th className="py-2 font-medium text-right">Prix Unit.</th>
                                <th className="py-2 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[--border]">
                            {doc.lines?.map((line) => (
                                <tr key={line.id}>
                                    <td className="py-4 whitespace-pre-line">{line.description}</td>
                                    <td className="py-4 text-right">{line.quantity}</td>
                                    <td className="py-4 text-right">{line.unit_price}€</td>
                                    <td className="py-4 text-right font-medium">{(line.quantity * line.unit_price).toFixed(2)}€</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-[--border]">
                                <td colSpan={3} className="py-4 text-right font-bold">Total HT</td>
                                <td className="py-4 text-right font-bold text-xl text-[--primary]">
                                    {doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="mt-8 text-xs text-[--text-muted] text-center">
                        TVA non applicable, art. 293 B du CGI
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Mail size={18} />
                            Historique des envois
                        </h3>
                        <div className="text-sm text-[--text-secondary]">
                            <p className="italic">Aucun email envoyé pour le moment.</p>
                            {/* Will hook up email_logs later */}
                        </div>
                        {doc.status === 'sent' && (
                            <button
                                onClick={() => {
                                    if (confirm('Renvoyer l\'email ?')) sendEmail.mutate({ id: doc.id, type: 'resend' });
                                }}
                                className="mt-4 text-sm text-[--primary] hover:underline w-full text-left"
                            >
                                Renvoyer l'email
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
