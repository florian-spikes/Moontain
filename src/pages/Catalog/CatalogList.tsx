
import { useState } from 'react';
import { Plus, Search, Trash2, Package, Repeat, Calendar, Edit2 } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { format, parseISO } from 'date-fns';
import { CatalogDrawer } from '../../components/CatalogDrawer';
import type { CatalogItem } from '../../types';

export function CatalogList() {
    const { catalogItems, isLoading, error, deleteCatalogItem, createCatalogItem, updateCatalogItem } = useCatalog();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

    if (isLoading) return (
        <div className="ct-loading animate-fade-in">
            <div className="ct-loading-spinner" />
            <p>Chargement du catalogue...</p>
            <style>{ctStyles}</style>
        </div>
    );
    if (error) return <div className="ct-loading" style={{ color: 'var(--danger)' }}>Erreur: {(error as Error).message}</div>;

    const filteredItems = catalogItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (confirm('Supprimer cette prestation ?')) {
            deleteCatalogItem.mutate(id);
        }
    };

    const handleEdit = (item: CatalogItem) => {
        setSelectedItem(item);
        setIsDrawerOpen(true);
    };

    const handleOpenNew = () => {
        setSelectedItem(null);
        setIsDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setIsDrawerOpen(false);
        setTimeout(() => setSelectedItem(null), 300); // Wait for animation
    };

    return (
        <div className="ct animate-fade-in">
            <CatalogDrawer
                isOpen={isDrawerOpen}
                onClose={handleDrawerClose}
                item={selectedItem || undefined}
                onSave={async (data) => {
                    if (selectedItem) {
                        await updateCatalogItem.mutateAsync({ id: selectedItem.id, ...data } as any);
                    } else {
                        await createCatalogItem.mutateAsync(data as any);
                    }
                }}
                isSaving={createCatalogItem.isPending || updateCatalogItem.isPending}
            />

            {/* Header */}
            <div className="ct-header">
                <div>
                    <h1 className="ct-title">Catalogue</h1>
                    <p className="ct-subtitle">Gérez vos prestations et produits · {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}</p>
                </div>
                <button onClick={handleOpenNew} className="ct-cta" style={{ border: 'none', cursor: 'pointer' }}>
                    <Plus size={18} />
                    Nouvelle Prestation
                </button>
            </div>

            {/* Search */}
            <div className="ct-search-wrap">
                <Search className="ct-search-icon" size={18} />
                <input
                    type="text"
                    placeholder="Rechercher dans le catalogue..."
                    className="ct-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List Format (1 column) */}
            {filteredItems.length > 0 ? (
                <div className="ct-list">
                    {filteredItems.map((item, i) => (
                        <div key={item.id} className="ct-row animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
                            <div className="ct-row-left">
                                <div className="ct-row-icon">
                                    <Package size={20} />
                                </div>
                                <div className="ct-row-info">
                                    <h3 className="ct-row-name">{item.name}</h3>
                                    {item.description && <p className="ct-row-desc">{item.description}</p>}
                                    <span className={`ct-row-mode ${item.billing_mode === 'subscription' ? 'ct-mode-sub' : 'ct-mode-unit'}`}>
                                        {item.billing_mode === 'subscription' ? (
                                            <>
                                                {item.subscription_type === 'fixed' && item.start_date && item.end_date ? (
                                                    <><Calendar size={11} /> Du {format(parseISO(item.start_date), 'dd/MM/yy')} au {format(parseISO(item.end_date), 'dd/MM/yy')}</>
                                                ) : (
                                                    <><Repeat size={11} /> {item.billing_frequency === 'yearly' ? 'Annuel' : 'Mensuel'} (Tacite)</>
                                                )}
                                            </>
                                        ) : (
                                            <>Unité{item.quantity && item.quantity > 1 ? ` · Qté ${item.quantity}` : ''}</>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="ct-row-right">
                                <div className="ct-row-meta">
                                    <div className="ct-row-price">{item.unit_price}€</div>
                                    <div className="ct-row-unit">
                                        {item.billing_mode === 'subscription'
                                            ? (item.billing_frequency === 'yearly' ? '/ an' : '/ mois')
                                            : `/ ${item.unit || 'pièce'}`
                                        }
                                    </div>
                                </div>
                                <div className="ct-row-actions">
                                    <button onClick={() => handleEdit(item)} className="ct-btn-action ct-btn-edit" title="Modifier">
                                        <Edit2 size={15} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="ct-btn-action ct-btn-delete" title="Supprimer">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="ct-empty">
                    <div className="ct-empty-icon"><Package size={32} /></div>
                    <h3>Catalogue vide</h3>
                    <p>Ajoutez vos premières prestations</p>
                    <button onClick={handleOpenNew} className="ct-cta" style={{ marginTop: '1rem', border: 'none', cursor: 'pointer' }}>
                        <Plus size={18} /> Nouvelle Prestation
                    </button>
                </div>
            )}

            <style>{ctStyles}</style>
        </div>
    );
}

const ctStyles = `
    .ct { max-width: 1100px; margin: 0 auto; }

    .ct-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .ct-title { font-size: 1.75rem; font-weight: 700; }
    .ct-subtitle { color: var(--text-secondary); margin-top: 0.25rem; font-size: 0.875rem; }
    .ct-cta {
        display: inline-flex; align-items: center; gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white; font-weight: 600; font-size: 0.8125rem;
        border-radius: var(--radius-lg); text-decoration: none;
        transition: all var(--transition-smooth);
    }
    .ct-cta:hover { box-shadow: 0 4px 16px rgba(139,92,246,0.3); transform: translateY(-1px); }

    .ct-search-wrap {
        position: relative; margin-bottom: 1.5rem;
    }
    .ct-search-icon {
        position: absolute; left: 14px; top: 50%;
        transform: translateY(-50%); color: var(--text-muted); pointer-events: none;
    }
    .ct-search-input {
        width: 100%; padding-left: 2.75rem !important;
        background: var(--bg-card) !important;
    }

    .ct-list {
        display: flex; flex-direction: column; gap: 0.75rem;
    }

    .ct-row {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 1rem 1.25rem;
        transition: all var(--transition-smooth);
        display: flex; justify-content: space-between; align-items: center;
        gap: 1.5rem;
    }
    .ct-row:hover {
        border-color: var(--border-light);
        box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        transform: translateY(-1px);
    }
    
    .ct-row-left {
        display: flex; gap: 1rem; flex: 1; align-items: center;
    }
    .ct-row-icon {
        width: 44px; height: 44px; flex-shrink: 0;
        border-radius: var(--radius-lg);
        background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1));
        color: var(--primary);
        display: flex; align-items: center; justify-content: center;
    }
    .ct-row-info { display: flex; flex-direction: column; }
    .ct-row-name { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.25rem; }
    .ct-row-desc {
        font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;
        display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
    }
    .ct-row-mode {
        display: inline-flex; align-items: center; gap: 0.25rem;
        font-size: 0.625rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.04em; padding: 0.2rem 0.5rem;
        border-radius: 999px; margin-top: 0.5rem; width: fit-content;
    }
    .ct-mode-sub { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .ct-mode-unit { background: var(--bg-surface-hover); color: var(--text-muted); }

    .ct-row-right {
        display: flex; align-items: center; gap: 2rem;
    }
    .ct-row-meta { 
        display: flex; flex-direction: column; align-items: flex-end; 
        min-width: 90px;
    }
    .ct-row-price { font-size: 1.125rem; font-weight: 700; color: var(--primary); }
    .ct-row-unit { font-size: 0.75rem; color: var(--text-muted); }
    
    .ct-row-actions {
        display: flex; gap: 0.375rem;
    }
    .ct-btn-action {
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: var(--radius-md); border: 1px solid transparent; background: transparent;
        color: var(--text-muted); cursor: pointer; transition: all var(--transition-fast);
    }
    .ct-btn-edit:hover { background: rgba(139,92,246,0.1); color: var(--primary); border-color: rgba(139,92,246,0.2); }
    .ct-btn-delete:hover { background: rgba(239,68,68,0.1); color: var(--danger); border-color: rgba(239,68,68,0.2); }

    .ct-empty {
        text-align: center; padding: 4rem 2rem;
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl);
    }
    .ct-empty-icon {
        width: 64px; height: 64px; border-radius: 50%;
        background: var(--primary-light); color: var(--primary);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1rem;
    }
    .ct-empty h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
    .ct-empty p { color: var(--text-secondary); font-size: 0.875rem; }

    .ct-loading {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 1rem; padding: 4rem; color: var(--text-secondary);
    }
    .ct-loading-spinner {
        width: 32px; height: 32px; border: 3px solid var(--border);
        border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
        .ct-header { flex-direction: column; align-items: stretch; }
        .ct-title { font-size: 1.375rem; }
        .ct-cta { justify-content: center; text-align: center; }
        
        .ct-row { flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.25rem; }
        .ct-row-right { width: 100%; justify-content: space-between; padding-top: 1rem; border-top: 1px solid var(--border); }
        .ct-row-meta { align-items: flex-start; }
    }
`;
