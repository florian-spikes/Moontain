
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';

export function CatalogList() {
    const { catalogItems, isLoading, error, deleteCatalogItem } = useCatalog();
    const [searchTerm, setSearchTerm] = useState('');

    if (isLoading) return <div className="p-8 text-center text-[--text-secondary]">Chargement du catalogue...</div>;
    if (error) return <div className="p-8 text-center text-[--danger]">Erreur: {(error as Error).message}</div>;

    const filteredItems = catalogItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (confirm('Supprimer cette prestation ?')) {
            deleteCatalogItem.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[--primary] to-[--secondary] bg-clip-text text-transparent">
                        Catalogue
                    </h1>
                    <p className="text-[--text-secondary] text-sm mt-1">
                        Gérez vos prestations et produits récurrents
                    </p>
                </div>
                <Link
                    to="/catalog/new"
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    Nouvelle Prestation
                </Link>
            </div>

            <div className="bg-[--bg-surface] p-4 rounded-lg border border-[--border]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-secondary]" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-[--bg-surface] rounded-lg border border-[--border] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[--bg-surface-hover] text-left text-sm text-[--text-secondary]">
                            <th className="px-6 py-3 font-medium">Nom / Description</th>
                            <th className="px-6 py-3 font-medium">Prix Unitaire</th>
                            <th className="px-6 py-3 font-medium">Unité</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[--border]">
                        {filteredItems.map((item) => (
                            <tr key={item.id} className="group hover:bg-[--bg-surface-hover]/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-[--text-primary]">{item.name}</div>
                                    {item.description && (
                                        <div className="text-xs text-[--text-muted] mt-1 line-clamp-1">{item.description}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-[--text-secondary]">
                                    {item.unit_price}€
                                </td>
                                <td className="px-6 py-4 text-sm text-[--text-secondary]">
                                    {item.unit || '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 hover:bg-[--bg-app] rounded-md text-[--text-secondary] hover:text-[--danger] opacity-0 group-hover:opacity-100 transition-all"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-[--text-secondary]">
                                    Aucune prestation trouvée.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
