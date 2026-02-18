
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Archive, ArchiveRestore } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { clsx } from 'clsx';

export function ClientsList() {
    const { clients, isLoading, error, updateClient } = useClients();
    const [showArchived, setShowArchived] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    if (isLoading) return <div className="p-8 text-center text-[--text-secondary]">Chargement des clients...</div>;
    if (error) return <div className="p-8 text-center text-[--danger]">Erreur: {(error as Error).message}</div>;

    const filteredClients = clients
        .filter(client => showArchived ? client.is_archived : !client.is_archived)
        .filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleArchiveToggle = async (id: string, currentStatus: boolean) => {
        if (confirm(currentStatus ? 'Restaurer ce client ?' : 'Archiver ce client ?')) {
            updateClient.mutate({ id, is_archived: !currentStatus });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[--primary] to-[--secondary] bg-clip-text text-transparent">
                        Clients
                    </h1>
                    <p className="text-[--text-secondary] text-sm mt-1">
                        Gérez votre base de données clients
                    </p>
                </div>
                <Link
                    to="/clients/new"
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    Nouveau Client
                </Link>
            </div>

            <div className="flex gap-4 items-center bg-[--bg-surface] p-4 rounded-lg border border-[--border]">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-secondary]" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un client..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-[--text-secondary] cursor-pointer select-none flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                            className="w-4 h-4 rounded border-[--border] bg-[--bg-app] text-[--primary] focus:ring-[--primary]"
                        />
                        Voir les archives
                    </label>
                </div>
            </div>

            <div className="bg-[--bg-surface] rounded-lg border border-[--border] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[--bg-surface-hover] text-left text-sm text-[--text-secondary]">
                            <th className="px-6 py-3 font-medium">Nom</th>
                            <th className="px-6 py-3 font-medium">Contact</th>
                            <th className="px-6 py-3 font-medium">Adresse</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[--border]">
                        {filteredClients.map((client) => (
                            <tr key={client.id} className="group hover:bg-[--bg-surface-hover]/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-[--text-primary]">{client.name}</div>
                                    {client.notes && (
                                        <div className="text-xs text-[--text-muted] mt-1 line-clamp-1">{client.notes}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-[--text-secondary]">
                                    {client.email || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-[--text-secondary]">
                                    {client.address || '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            to={`/clients/${client.id}`}
                                            className="p-2 hover:bg-[--bg-app] rounded-md text-[--text-secondary] hover:text-[--primary]"
                                            title="Modifier"
                                        >
                                            <Edit2 size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleArchiveToggle(client.id, client.is_archived)}
                                            className={clsx(
                                                "p-2 hover:bg-[--bg-app] rounded-md transition-colors",
                                                client.is_archived
                                                    ? "text-[--warning] hover:text-[--warning]"
                                                    : "text-[--text-secondary] hover:text-[--danger]"
                                            )}
                                            title={client.is_archived ? "Restaurer" : "Archiver"}
                                        >
                                            {client.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredClients.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-[--text-secondary]">
                                    Aucun client trouvé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
