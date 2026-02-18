
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../components/AuthProvider';
import {
    TrendingUp, TrendingDown, Clock, FileText, Calendar,
    Euro, AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import type { DocumentStatus } from '../types';

const statusConfig: Record<DocumentStatus, { label: string; color: string }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
    sent: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Payé', color: 'bg-green-100 text-green-800' },
    overdue: { label: 'En retard', color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
};

export function Dashboard() {
    const { user } = useAuth();
    const { stats: rawStats, isLoading, error } = useDashboard();

    // Default stats to avoid undefined errors
    const stats = rawStats || {
        revenue: { current: 0, last: 0, growth: 0 },
        pendingInvoices: { count: 0, amount: 0 },
        expiringServices: 0,
        recentDocs: []
    };

    if (isLoading) return <div className="p-8 text-center text-[--text-secondary]">Chargement du tableau de bord...</div>;
    if (error) return <div className="p-8 text-center text-[--danger]">{(error as Error).message}</div>;

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[--primary] to-[--secondary] bg-clip-text text-transparent">
                    Bonjour, {user?.email?.split('@')[0]}
                </h1>
                <p className="text-[--text-secondary] mt-1">
                    Voici un aperçu de votre activité ce mois-ci.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue */}
                <div className="card hover:border-[--primary]/50 transition-colors">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-[--text-secondary]">Chiffre d'affaires (Mois)</p>
                            <h3 className="text-2xl font-bold mt-1">
                                {stats.revenue.current.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </h3>
                        </div>
                        <div className={clsx(
                            "p-2 rounded-full",
                            stats.revenue.growth >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                            <Euro size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        {stats.revenue.growth >= 0 ? (
                            <TrendingUp size={16} className="text-green-600 mr-1" />
                        ) : (
                            <TrendingDown size={16} className="text-red-600 mr-1" />
                        )}
                        <span className={stats.revenue.growth >= 0 ? "text-green-600" : "text-red-600"}>
                            {Math.abs(stats.revenue.growth).toFixed(1)}%
                        </span>
                        <span className="text-[--text-muted] ml-1">vs mois dernier</span>
                    </div>
                </div>

                {/* Pending Invoices */}
                <div className="card hover:border-[--primary]/50 transition-colors">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-[--text-secondary]">Factures en attente</p>
                            <h3 className="text-2xl font-bold mt-1">
                                {stats.pendingInvoices.count}
                            </h3>
                        </div>
                        <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-[--text-secondary]">
                        <span className="font-medium text-[--text-primary]">
                            {stats.pendingInvoices.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                        <span className="text-[--text-muted] ml-1">à recevoir</span>
                    </div>
                </div>

                {/* Expiring Services */}
                <div className="card hover:border-[--primary]/50 transition-colors">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-[--text-secondary]">Services expirant (30j)</p>
                            <h3 className="text-2xl font-bold mt-1">
                                {stats.expiringServices}
                            </h3>
                        </div>
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <Calendar size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm">
                        <Link to="/services" className="text-[--primary] hover:underline flex items-center gap-1">
                            Voir les services <ArrowLeft size={14} className="rotate-180" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[--bg-surface] p-6 rounded-xl border border-[--border]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <FileText size={20} className="text-[--primary]" />
                            Documents récents
                        </h3>
                        <Link to="/documents" className="text-sm text-[--primary] hover:underline">
                            Tout voir
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {stats.recentDocs.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[--bg-surface-hover] transition-colors border border-transparent hover:border-[--border]">
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "w-2 h-2 rounded-full",
                                        doc.type === 'invoice' ? "bg-blue-500" : "bg-purple-500"
                                    )} />
                                    <div>
                                        <Link to={`/documents/${doc.id}`} className="font-medium hover:text-[--primary] transition-colors">
                                            {doc.number || 'Brouillon'}
                                        </Link>
                                        <p className="text-xs text-[--text-secondary]">
                                            {doc.client?.name} • {format(parseISO(doc.date), 'd MMM', { locale: fr })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-sm">
                                        {doc.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                    <span className={clsx(
                                        "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide",
                                        statusConfig[doc.status as DocumentStatus]?.color
                                    )}>
                                        {statusConfig[doc.status as DocumentStatus]?.label}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {stats.recentDocs.length === 0 && (
                            <p className="text-[--text-secondary] text-sm text-center py-4">
                                Aucune activité récente.
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Placeholders */}
                <div className="bg-[--bg-surface] p-6 rounded-xl border border-[--border]">
                    <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                        <AlertCircle size={20} className="text-orange-500" />
                        Actions rapides
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/documents/new" className="flex flex-col items-center justify-center p-4 rounded-lg border border-[--border] hover:border-[--primary] hover:bg-[--bg-surface-hover] transition-all group">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <FileText size={20} />
                            </div>
                            <span className="text-sm font-medium">Nouveau Devis</span>
                        </Link>

                        <Link to="/clients/new" className="flex flex-col items-center justify-center p-4 rounded-lg border border-[--border] hover:border-[--primary] hover:bg-[--bg-surface-hover] transition-all group">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <LayoutGrid size={20} />
                            </div>
                            <span className="text-sm font-medium">Nouveau Client</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Missing icon import
import { LayoutGrid, ArrowLeft } from 'lucide-react';
