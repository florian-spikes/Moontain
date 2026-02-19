
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useCatalog } from '../../hooks/useCatalog';
import { ArrowLeft, Save, Package, DollarSign, Ruler, FileText, Loader2, Repeat, Hash } from 'lucide-react';

const itemSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    description: z.string().optional(),
    unit_price: z.number().min(0, 'Le prix doit être positif'),
    unit: z.string().optional(),
    billing_mode: z.enum(['unit', 'subscription']),
    quantity: z.number().min(1).optional(),
    billing_frequency: z.enum(['monthly', 'yearly']).optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

export function NewCatalogItem() {
    const { createCatalogItem } = useCatalog();
    const navigate = useNavigate();

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ItemFormData>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            billing_mode: 'unit',
            quantity: 1,
            billing_frequency: 'monthly',
        },
    });

    const billingMode = watch('billing_mode');

    const onSubmit = async (data: ItemFormData) => {
        try {
            await createCatalogItem.mutateAsync({
                name: data.name,
                description: data.description || null,
                unit_price: data.unit_price,
                unit: data.unit || 'pièce',
                billing_mode: data.billing_mode,
                quantity: data.billing_mode === 'unit' ? (data.quantity ?? 1) : null,
                billing_frequency: data.billing_mode === 'subscription' ? (data.billing_frequency ?? 'monthly') : null,
            });
            navigate('/catalog');
        } catch (error) {
            console.error('Failed to create item:', error);
        }
    };

    return (
        <div className="frm animate-fade-in">
            {/* Breadcrumb */}
            <div className="frm-breadcrumb">
                <Link to="/catalog" className="frm-back"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="frm-title">Nouvelle Prestation</h1>
                    <p className="frm-subtitle">Ajoutez un produit ou service au catalogue</p>
                </div>
            </div>

            <div className="frm-card">
                <form onSubmit={handleSubmit(onSubmit)} className="frm-form">
                    <div className="frm-group">
                        <label className="frm-label">
                            <Package size={14} />
                            Nom de la prestation <span className="frm-req">*</span>
                        </label>
                        <input
                            {...register('name')}
                            className={`frm-input ${errors.name ? 'frm-input-error' : ''}`}
                            placeholder="Ex: Landing Page, Maintenance Mensuelle..."
                        />
                        {errors.name && <p className="frm-error">{errors.name.message}</p>}
                    </div>

                    <div className="frm-group">
                        <label className="frm-label">
                            <FileText size={14} />
                            Description
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="frm-input frm-textarea"
                            placeholder="Détails de la prestation..."
                        />
                    </div>

                    {/* Billing mode toggle */}
                    <div className="frm-group">
                        <label className="frm-label">
                            <Repeat size={14} />
                            Mode de facturation
                        </label>
                        <div className="frm-toggle-group">
                            <label className={`frm-toggle-btn ${billingMode === 'unit' ? 'frm-toggle-active' : ''}`}>
                                <input type="radio" value="unit" {...register('billing_mode')} className="sr-only" />
                                <Hash size={16} />
                                À l'unité
                            </label>
                            <label className={`frm-toggle-btn ${billingMode === 'subscription' ? 'frm-toggle-active' : ''}`}>
                                <input type="radio" value="subscription" {...register('billing_mode')} className="sr-only" />
                                <Repeat size={16} />
                                Abonnement
                            </label>
                        </div>
                    </div>

                    {/* Conditional: quantity (unit mode) */}
                    {billingMode === 'unit' && (
                        <div className="frm-group animate-fade-in">
                            <label className="frm-label">
                                <Hash size={14} />
                                Nombre
                            </label>
                            <input
                                type="number"
                                min={1}
                                {...register('quantity', { valueAsNumber: true })}
                                className="frm-input"
                                placeholder="1"
                            />
                        </div>
                    )}

                    {/* Conditional: frequency (subscription mode) */}
                    {billingMode === 'subscription' && (
                        <div className="frm-group animate-fade-in">
                            <label className="frm-label">
                                <Repeat size={14} />
                                Fréquence
                            </label>
                            <div className="frm-toggle-group">
                                <label className={`frm-toggle-btn ${watch('billing_frequency') === 'monthly' ? 'frm-toggle-active' : ''}`}>
                                    <input type="radio" value="monthly" {...register('billing_frequency')} className="sr-only" />
                                    Mensuel
                                </label>
                                <label className={`frm-toggle-btn ${watch('billing_frequency') === 'yearly' ? 'frm-toggle-active' : ''}`}>
                                    <input type="radio" value="yearly" {...register('billing_frequency')} className="sr-only" />
                                    Annuel
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="frm-grid-2">
                        <div className="frm-group">
                            <label className="frm-label">
                                <DollarSign size={14} />
                                Prix Unitaire (€) <span className="frm-req">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('unit_price', { valueAsNumber: true })}
                                className={`frm-input ${errors.unit_price ? 'frm-input-error' : ''}`}
                            />
                            {errors.unit_price && <p className="frm-error">{errors.unit_price.message}</p>}
                        </div>

                        <div className="frm-group">
                            <label className="frm-label">
                                <Ruler size={14} />
                                Unité
                            </label>
                            <input
                                {...register('unit')}
                                className="frm-input"
                                placeholder="Ex: pièce, heure, jour, mois"
                                defaultValue="pièce"
                            />
                        </div>
                    </div>

                    <div className="frm-actions">
                        <Link to="/catalog" className="frm-btn-cancel">Annuler</Link>
                        <button type="submit" className="frm-btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Enregistrement...</>
                            ) : (
                                <><Save size={18} /> Enregistrer</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{formStyles}</style>
        </div>
    );
}

const formStyles = `
    .frm { max-width: 680px; margin: 0 auto; }
    .frm-breadcrumb { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .frm-back {
        width: 36px; height: 36px; border-radius: var(--radius-lg);
        background: var(--bg-card); border: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center;
        color: var(--text-secondary); transition: all var(--transition-smooth); text-decoration: none;
    }
    .frm-back:hover { color: var(--text-primary); border-color: var(--primary); background: var(--primary-light); }
    .frm-title { font-size: 1.5rem; font-weight: 700; }
    .frm-subtitle { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.125rem; }
    .frm-card {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 2rem;
    }
    .frm-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .frm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .frm-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .frm-label {
        display: flex; align-items: center; gap: 0.375rem;
        font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary);
    }
    .frm-req { color: var(--danger); font-weight: 700; }
    .frm-input {
        width: 100%; padding: 0.75rem 1rem !important;
        background: var(--bg-app) !important; border: 1.5px solid var(--border) !important;
        border-radius: var(--radius-lg) !important; color: var(--text-primary) !important;
        font-size: 0.875rem !important;
        transition: border var(--transition-smooth), box-shadow var(--transition-smooth) !important;
    }
    .frm-input:focus {
        outline: none !important; border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
    }
    .frm-input::placeholder { color: var(--text-muted) !important; }
    .frm-input-error { border-color: var(--danger) !important; }
    .frm-textarea { resize: vertical; min-height: 80px; }
    .frm-error { font-size: 0.75rem; color: var(--danger); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

    /* Toggle group (for billing mode & frequency) */
    .frm-toggle-group {
        display: flex; gap: 0.5rem;
    }
    .frm-toggle-btn {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        padding: 0.75rem 1rem; border-radius: var(--radius-lg);
        border: 1.5px solid var(--border); background: transparent;
        color: var(--text-secondary); font-weight: 500; font-size: 0.875rem;
        cursor: pointer; transition: all var(--transition-smooth);
    }
    .frm-toggle-btn:hover { border-color: var(--primary); color: var(--primary); }
    .frm-toggle-active {
        border-color: var(--primary) !important;
        background: var(--primary-light) !important;
        color: var(--primary) !important;
        font-weight: 600;
    }

    .frm-actions {
        display: flex; justify-content: flex-end; gap: 0.75rem;
        padding-top: 1.25rem; border-top: 1px solid var(--border);
    }
    .frm-btn-cancel {
        padding: 0.625rem 1.25rem; border-radius: var(--radius-lg);
        color: var(--text-secondary); font-weight: 600; font-size: 0.8125rem;
        text-decoration: none; border: 1px solid var(--border); background: transparent;
        cursor: pointer; transition: all var(--transition-smooth);
    }
    .frm-btn-cancel:hover { background: var(--bg-surface-hover); color: var(--text-primary); }
    .frm-btn-submit {
        display: inline-flex; align-items: center; gap: 0.5rem;
        padding: 0.625rem 1.5rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white; font-weight: 600; font-size: 0.8125rem; border: none;
        border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition-smooth);
    }
    .frm-btn-submit:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(139,92,246,0.3); transform: translateY(-1px); }
    .frm-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .animate-spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
`;
