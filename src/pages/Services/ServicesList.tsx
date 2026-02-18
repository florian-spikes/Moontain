
import { useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Server, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export function ServicesList() {
    const { services, isLoading, error } = useServices();
    const [filter, setFilter] = useState<'all' | 'hosting' | 'domain' | 'license' | 'maintenance'>('all');

    if (isLoading) return <div className="p-8 text-center text-[--text-secondary]">Chargement des services...</div>;
    if (error) return <div className="p-8 text-center text-[--danger]">Erreur: {(error as Error).message}</div>;

    const filteredServices = services.filter(s => filter === 'all' || s.type === filter);

    const getStatusColor = (renewalDate: string | null) => {
        if (!renewalDate) return 'text-[--text-secondary]';
        const days = differenceInDays(parseISO(renewalDate), new Date());
        if (days < 0) return 'text-[--status-overdue]';
        if (days < 30) return 'text-[--warning]';
        return 'text-[--success]';
    };

    const getDaysRemaining = (renewalDate: string | null) => {
        if (!renewalDate) return null;
        const days = differenceInDays(parseISO(renewalDate), new Date());
        if (days < 0) return `Expiré depuis ${Math.abs(days)} jours`;
        if (days === 0) return "Expire aujourd'hui";
        return `Expire dans ${days} jours`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[--primary] to-[--secondary] bg-clip-text text-transparent">
                        Services
                    </h1>
                    <p className="text-[--text-secondary] text-sm mt-1">
                        Suivi des hébergements, domaines et licences
                    </p>
                </div>
            </div>

            <div className="flex gap-2 pb-2 overflow-x-auto">
                {(['all', 'hosting', 'domain', 'license', 'maintenance'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={clsx(
                            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
                            filter === type
                                ? 'bg-[--primary] text-white'
                                : 'bg-[--bg-surface] text-[--text-secondary] hover:bg-[--bg-surface-hover]'
                        )}
                    >
                        {type === 'all' ? 'Tous' : type}
                    </button>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => (
                    <div key={service.id} className="card hover:border-[--primary] transition-colors group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    "p-2 rounded-md bg-[--bg-app]",
                                    service.type === 'hosting' && "text-blue-400",
                                    service.type === 'domain' && "text-purple-400",
                                    service.type === 'license' && "text-green-400",
                                    service.type === 'maintenance' && "text-orange-400",
                                )}>
                                    <Server size={18} />
                                </span>
                                <div>
                                    <h3 className="font-semibold text-[--text-primary]">{service.name}</h3>
                                    <Link to={`/clients/${service.client_id}`} className="text-xs text-[--text-secondary] hover:text-[--primary]">
                                        {service.client?.name || 'Client inconnu'}
                                    </Link>
                                </div>
                            </div>
                            <div className={clsx("text-xs font-bold px-2 py-1 rounded bg-[--bg-app]", getStatusColor(service.renewal_date))}>
                                {getDaysRemaining(service.renewal_date)}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-[--text-secondary]">
                            <div className="flex justify-between">
                                <span>Fournisseur</span>
                                <span className="text-[--text-primary]">{service.provider || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Prix</span>
                                <span className="text-[--text-primary]">{service.price ? `${service.price}€` : '-'}</span>
                            </div>
                            {service.renewal_date && (
                                <div className="flex justify-between items-center pt-2 border-t border-[--border]">
                                    <span className="flex items-center gap-1 text-xs">
                                        <Calendar size={14} />
                                        Renouvellement
                                    </span>
                                    <span className="font-medium text-[--text-primary]">
                                        {format(parseISO(service.renewal_date), 'd MMM yyyy', { locale: fr })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex justify-end">
                            {/* Actions like Edit could go here, for now it's read-only list linking to client */}
                        </div>
                    </div>
                ))}
                {filteredServices.length === 0 && (
                    <div className="col-span-full py-8 text-center text-[--text-secondary]">
                        Aucun service trouvé.
                    </div>
                )}
            </div>
        </div>
    );
}
