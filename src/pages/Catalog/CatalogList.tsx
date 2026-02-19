
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Package, Repeat, Calendar } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { format, parseISO } from 'date-fns';

export function CatalogList() {
    const { catalogItems, isLoading, error, deleteCatalogItem } = useCatalog();
    const [searchTerm, setSearchTerm] = useState('');

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

    return (
        <div className="ct animate-fade-in">
            {/* Header */}
            <div className="ct-header">
                <div>
                    <h1 className="ct-title">Catalogue</h1>
                    <p className="ct-subtitle">Gérez vos prestations et produits · {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}</p>
                </div>
                <Link to="/catalog/new" className="ct-cta">
                    <Plus size={18} />
                    Nouvelle Prestation
                </Link>
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

            {/* Grid cards */}
            {filteredItems.length > 0 ? (
                <div className="ct-grid">
                    {filteredItems.map((item, i) => (
                        <div
                            key={item.id}
                            className="ct-card animate-slide-up"
                            style={{ animationDelay: `${i * 0.04}s` }}
                        >
                            <div className="ct-card-top">
                                <div className="ct-card-icon">
                                    <Package size={20} />
                                </div>
                                <div className="ct-card-info">
                                    <h3 className="ct-card-name">{item.name}</h3>
                                    {item.description && <p className="ct-card-desc">{item.description}</p>}
                                    <span className={`ct-card-mode ${item.billing_mode === 'subscription' ? 'ct-mode-sub' : 'ct-mode-unit'}`}>
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
                            <div className="ct-card-bottom">
                                <div className="ct-card-meta">
                                    <div className="ct-card-price">{item.unit_price}€</div>
                                    <div className="ct-card-unit">
                                        {item.billing_mode === 'subscription'
                                            ? (item.billing_frequency === 'yearly' ? '/ an' : '/ mois')
                                            : `/ ${item.unit || 'pièce'}`
                                        }
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="ct-card-delete"
                                    title="Supprimer"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="ct-empty">
                    <div className="ct-empty-icon"><Package size={32} /></div>
                    <h3>Catalogue vide</h3>
                    <p>Ajoutez vos premières prestations</p>
                    <Link to="/catalog/new" className="ct-cta" style={{ marginTop: '1rem' }}>
                        <Plus size={18} /> Nouvelle Prestation
                    </Link>
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

    .ct-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
    }

    .ct-card {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 1.25rem;
        transition: all var(--transition-smooth);
        display: flex; flex-direction: column; justify-content: space-between;
    }
    .ct-card:hover {
        border-color: var(--border-light);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    .ct-card-top {
        display: flex; gap: 0.875rem; margin-bottom: 1rem;
    }
    .ct-card-icon {
        width: 44px; height: 44px; flex-shrink: 0;
        border-radius: var(--radius-lg);
        background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1));
        color: var(--primary);
        display: flex; align-items: center; justify-content: center;
    }
    .ct-card-name { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.25rem; }
    .ct-card-desc {
        font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .ct-card-mode {
        display: inline-flex; align-items: center; gap: 0.25rem;
        font-size: 0.625rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.04em; padding: 0.2rem 0.5rem;
        border-radius: 999px; margin-top: 0.375rem; width: fit-content;
    }
    .ct-mode-sub { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .ct-mode-unit { background: var(--bg-surface-hover); color: var(--text-muted); }
    .ct-card-bottom {
        display: flex; justify-content: space-between; align-items: center;
        padding-top: 0.875rem; border-top: 1px solid var(--border);
    }
    .ct-card-meta { display: flex; align-items: baseline; gap: 0.25rem; }
    .ct-card-price { font-size: 1.125rem; font-weight: 700; color: var(--primary); }
    .ct-card-unit { font-size: 0.75rem; color: var(--text-muted); }
    .ct-card-delete {
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: var(--radius-md); border: none; background: transparent;
        color: var(--text-muted); cursor: pointer; transition: all var(--transition-fast);
    }
    .ct-card-delete:hover { background: rgba(239,68,68,0.1); color: var(--danger); }

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
`;
