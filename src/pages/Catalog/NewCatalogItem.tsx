
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useCatalog } from '../../hooks/useCatalog';
import { ArrowLeft, Save, Package, DollarSign, Ruler, FileText, Loader2, Repeat, Hash, ChevronDown, Calendar, Clock } from 'lucide-react';
import { differenceInMonths, differenceInDays, parseISO } from 'date-fns';

const itemSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    description: z.string().optional(),
    unit_price: z.number().min(0, 'Le prix doit être positif'),
    billing_mode: z.enum(['unit', 'subscription']),
    quantity: z.number().min(1).optional(),
    unit: z.string().optional(),
    billing_frequency: z.enum(['monthly', 'yearly']).optional(),
    subscription_type: z.enum(['ongoing', 'fixed']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
}).refine(data => {
    if (data.billing_mode === 'subscription' && data.subscription_type === 'fixed') {
        return !!data.start_date && !!data.end_date;
    }
    return true;
}, {
    message: "Les dates de début et de fin sont requises pour un abonnement déterminé",
    path: ["end_date"] // Attach error to end_date
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
            unit: 'pièce',
            billing_frequency: 'monthly',
            subscription_type: 'ongoing',
        },
    });

    const billingMode = watch('billing_mode');
    const subType = watch('subscription_type');
    const startDate = watch('start_date');
    const endDate = watch('end_date');
    const unitPrice = watch('unit_price') || 0;
    const frequency = watch('billing_frequency');

    // Calculations
    let durationLabel = '';
    let totalCostLabel = '';

    if (billingMode === 'subscription' && subType === 'fixed' && startDate && endDate) {
        try {
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            const months = differenceInMonths(end, start) + (differenceInDays(end, start) % 30 > 15 ? 1 : 0); // Approx round up

            if (months > 0) {
                durationLabel = `${months} mois`;
                if (months >= 12 && months % 12 === 0) durationLabel = `${months / 12} an(s)`;

                let total = 0;
                if (frequency === 'monthly') {
                    total = months * unitPrice;
                } else if (frequency === 'yearly') {
                    total = (months / 12) * unitPrice;
                }

                totalCostLabel = total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
            }
        } catch (e) {
            // Ignore date parse errors
        }
    }

    const onSubmit = async (data: ItemFormData) => {
        try {
            await createCatalogItem.mutateAsync({
                name: data.name,
                description: data.description || null,
                unit_price: data.unit_price,
                unit: data.billing_mode === 'unit' ? (data.unit ?? null) : null,
                billing_mode: data.billing_mode,
                quantity: data.billing_mode === 'unit' ? (data.quantity ?? 1) : null,
                billing_frequency: data.billing_mode === 'subscription' ? (data.billing_frequency ?? 'monthly') : null,
                subscription_type: data.billing_mode === 'subscription' ? (data.subscription_type ?? 'ongoing') : null,
                start_date: (data.billing_mode === 'subscription' && data.subscription_type === 'fixed') ? (data.start_date || null) : null,
                end_date: (data.billing_mode === 'subscription' && data.subscription_type === 'fixed') ? (data.end_date || null) : null,
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

                    <div className="frm-row-split">
                        <div className="frm-group" style={{ flex: 1 }}>
                            <label className="frm-label">
                                <Repeat size={14} />
                                Type de prestation
                            </label>
                            <div className="frm-select-wrapper">
                                <select {...register('billing_mode')} className="frm-input frm-select">
                                    <option value="unit">Forfait (à l'unité)</option>
                                    <option value="subscription">Abonnement</option>
                                </select>
                                <ChevronDown size={16} className="frm-select-icon" />
                            </div>
                        </div>

                        <div className="frm-group" style={{ flex: 1 }}>
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
                    </div>

                    {/* Unit Mode Fields */}
                    {billingMode === 'unit' && (
                        <div className="frm-row-split animate-fade-in">
                            <div className="frm-group" style={{ flex: 1 }}>
                                <label className="frm-label">
                                    <Ruler size={14} />
                                    Unité
                                </label>
                                <div className="frm-select-wrapper">
                                    <select {...register('unit')} className="frm-input frm-select">
                                        <option value="pièce">Pièce</option>
                                        <option value="heure">Heure</option>
                                        <option value="jour">Jour</option>
                                        <option value="unité">Unité</option>
                                        <option value="forfait">Forfait</option>
                                    </select>
                                    <ChevronDown size={16} className="frm-select-icon" />
                                </div>
                            </div>
                            <div className="frm-group" style={{ flex: 1 }}>
                                <label className="frm-label">
                                    <Hash size={14} />
                                    Quantité par défaut
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    {...register('quantity', { valueAsNumber: true })}
                                    className="frm-input"
                                />
                            </div>
                        </div>
                    )}

                    {/* Subscription Mode Fields */}
                    {billingMode === 'subscription' && (
                        <>
                            <div className="frm-row-split animate-fade-in">
                                <div className="frm-group" style={{ flex: 1 }}>
                                    <label className="frm-label">
                                        <Repeat size={14} />
                                        Fréquence de facturation
                                    </label>
                                    <div className="frm-select-wrapper">
                                        <select {...register('billing_frequency')} className="frm-input frm-select">
                                            <option value="monthly">Mensuel</option>
                                            <option value="yearly">Annuel</option>
                                        </select>
                                        <ChevronDown size={16} className="frm-select-icon" />
                                    </div>
                                </div>
                                <div className="frm-group" style={{ flex: 1 }}>
                                    <label className="frm-label">
                                        <Clock size={14} />
                                        Type d'abonnement
                                    </label>
                                    <div className="frm-select-wrapper">
                                        <select {...register('subscription_type')} className="frm-input frm-select">
                                            <option value="ongoing">Indéterminé (Tacite reconduction)</option>
                                            <option value="fixed">Déterminé (Date à date)</option>
                                        </select>
                                        <ChevronDown size={16} className="frm-select-icon" />
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Term Dates */}
                            {subType === 'fixed' && (
                                <div className="frm-section-fixed animate-fade-in">
                                    <div className="frm-row-split">
                                        <div className="frm-group" style={{ flex: 1 }}>
                                            <label className="frm-label">
                                                <Calendar size={14} />
                                                Date de début
                                            </label>
                                            <input
                                                type="date"
                                                {...register('start_date')}
                                                className={`frm-input ${errors.end_date ? 'frm-input-error' : ''}`}
                                            />
                                        </div>
                                        <div className="frm-group" style={{ flex: 1 }}>
                                            <label className="frm-label">
                                                <Calendar size={14} />
                                                Date de fin
                                            </label>
                                            <input
                                                type="date"
                                                {...register('end_date')}
                                                className={`frm-input ${errors.end_date ? 'frm-input-error' : ''}`}
                                            />
                                        </div>
                                    </div>
                                    {errors.end_date && <p className="frm-error">{errors.end_date.message}</p>}

                                    {/* Calculated Summary */}
                                    {(durationLabel || totalCostLabel) && (
                                        <div className="frm-summary">
                                            <div className="frm-summary-item">
                                                <span className="frm-summary-label">Durée totale</span>
                                                <span className="frm-summary-val">{durationLabel}</span>
                                            </div>
                                            <div className="frm-summary-sep" />
                                            <div className="frm-summary-item">
                                                <span className="frm-summary-label">Coût total estimé</span>
                                                <span className="frm-summary-val" style={{ color: 'var(--primary)' }}>{totalCostLabel}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

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
    .frm { max-width: 680px; margin: 0 auto; padding-bottom: 2rem; }
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
    .frm-row-split { display: flex; gap: 1.25rem; flex-wrap: wrap; }
    .frm-group { display: flex; flex-direction: column; gap: 0.375rem; position: relative; }
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
        appearance: none; -webkit-appearance: none;
    }
    .frm-input:focus {
        outline: none !important; border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
    }
    .frm-input::placeholder { color: var(--text-muted) !important; }
    .frm-input-error { border-color: var(--danger) !important; }
    .frm-textarea { resize: vertical; min-height: 80px; }
    .frm-select { padding-right: 2.5rem !important; cursor: pointer; }
    .frm-select-wrapper { position: relative; }
    .frm-select-icon {
        position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
        color: var(--text-muted); pointer-events: none;
    }
    .frm-error { font-size: 0.75rem; color: var(--danger); margin-top: 0.25rem; }

    /* Fixed Term Calc Summary */
    .frm-section-fixed {
        background: var(--bg-surface-hover);
        border-radius: var(--radius-lg);
        padding: 1rem;
        border: 1px solid var(--border);
        display: flex; flex-direction: column; gap: 1rem;
    }
    .frm-summary {
        display: flex; align-items: center; justify-content: space-between;
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-lg); padding: 0.75rem 1.25rem;
    }
    .frm-summary-item { display: flex; flex-direction: column; gap: 0.125rem; }
    .frm-summary-label { font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .frm-summary-val { font-size: 1rem; font-weight: 700; }
    .frm-summary-sep { width: 1px; height: 24px; background: var(--border); }

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
