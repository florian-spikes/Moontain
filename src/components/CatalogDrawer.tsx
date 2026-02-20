import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Package, DollarSign, Ruler, FileText, Loader2, Repeat, Hash, ChevronDown, Calendar, Clock } from 'lucide-react';
import { differenceInMonths, differenceInDays, parseISO } from 'date-fns';
import type { CatalogItem } from '../types';

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
    service_type: z.enum(['hosting', 'domain', 'license', 'maintenance', 'other']).nullable().optional(),
}).refine(data => {
    if (data.billing_mode === 'subscription' && data.subscription_type === 'fixed') {
        return !!data.start_date && !!data.end_date;
    }
    return true;
}, {
    message: "Les dates de début et de fin sont requises pour un abonnement déterminé",
    path: ["end_date"]
});

type ItemFormData = z.infer<typeof itemSchema>;

interface CatalogDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    item?: CatalogItem;
    onSave: (data: Partial<CatalogItem>) => Promise<void>;
    isSaving: boolean;
}

export function CatalogDrawer({ isOpen, onClose, item, onSave, isSaving }: CatalogDrawerProps) {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<ItemFormData>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            name: item?.name || '',
            description: item?.description || '',
            unit_price: item?.unit_price || 0,
            billing_mode: item?.billing_mode || 'unit',
            quantity: item?.quantity || 1,
            unit: item?.unit || 'pièce',
            billing_frequency: item?.billing_frequency || 'monthly',
            subscription_type: item?.subscription_type || 'ongoing',
            start_date: item?.start_date || '',
            end_date: item?.end_date || '',
            service_type: item?.service_type || null,
        },
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                name: item?.name || '',
                description: item?.description || '',
                unit_price: item?.unit_price || 0,
                billing_mode: item?.billing_mode || 'unit',
                quantity: item?.quantity || 1,
                unit: item?.unit || 'pièce',
                billing_frequency: item?.billing_frequency || 'monthly',
                subscription_type: item?.subscription_type || 'ongoing',
                start_date: item?.start_date || '',
                end_date: item?.end_date || '',
                service_type: item?.service_type || null,
            });
        }
    }, [isOpen, item, reset]);

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
        await onSave({
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
            service_type: data.billing_mode === 'subscription' ? (data.service_type ?? 'other') : null,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="catd-overlay">
            <div className="catd-backdrop" onClick={onClose} />
            <div className="catd-panel animate-slide-in-right">
                <div className="catd-header-bar">
                    <h3>{item ? 'Modifier la prestation' : 'Nouvelle prestation'}</h3>
                    <button onClick={onClose} className="catd-close"><X size={20} /></button>
                </div>

                <form className="catd-body" onSubmit={handleSubmit(onSubmit)}>
                    <div className="catd-group">
                        <label className="catd-label">
                            <Package size={14} />
                            Nom de la prestation <span className="catd-req">*</span>
                        </label>
                        <input
                            {...register('name')}
                            className={`catd-input ${errors.name ? 'catd-input-error' : ''}`}
                            placeholder="Ex: Landing Page, Maintenance Mensuelle..."
                        />
                        {errors.name && <p className="catd-error">{errors.name.message}</p>}
                    </div>

                    <div className="catd-group">
                        <label className="catd-label">
                            <FileText size={14} />
                            Description
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="catd-input catd-textarea"
                            placeholder="Détails de la prestation..."
                        />
                    </div>

                    <div className="catd-row-split">
                        <div className="catd-group" style={{ flex: 1 }}>
                            <label className="catd-label">
                                <Repeat size={14} />
                                Type de prestation
                            </label>
                            <div className="catd-select-wrapper">
                                <select {...register('billing_mode')} className="catd-input catd-select">
                                    <option value="unit">Forfait (à l'unité)</option>
                                    <option value="subscription">Abonnement</option>
                                </select>
                                <ChevronDown size={16} className="catd-select-icon" />
                            </div>
                        </div>

                        <div className="catd-group" style={{ flex: 1 }}>
                            <label className="catd-label">
                                <DollarSign size={14} />
                                Prix Unitaire (€) <span className="catd-req">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('unit_price', { valueAsNumber: true })}
                                className={`catd-input ${errors.unit_price ? 'catd-input-error' : ''}`}
                            />
                            {errors.unit_price && <p className="catd-error">{errors.unit_price.message}</p>}
                        </div>
                    </div>

                    {/* Unit Mode Fields */}
                    {billingMode === 'unit' && (
                        <div className="catd-row-split animate-fade-in">
                            <div className="catd-group" style={{ flex: 1 }}>
                                <label className="catd-label">
                                    <Ruler size={14} />
                                    Unité
                                </label>
                                <div className="catd-select-wrapper">
                                    <select {...register('unit')} className="catd-input catd-select">
                                        <option value="pièce">Pièce</option>
                                        <option value="heure">Heure</option>
                                        <option value="jour">Jour</option>
                                        <option value="unité">Unité</option>
                                        <option value="forfait">Forfait</option>
                                    </select>
                                    <ChevronDown size={16} className="catd-select-icon" />
                                </div>
                            </div>
                            <div className="catd-group" style={{ flex: 1 }}>
                                <label className="catd-label">
                                    <Hash size={14} />
                                    Quantité par défaut
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    {...register('quantity', { valueAsNumber: true })}
                                    className="catd-input"
                                />
                            </div>
                        </div>
                    )}

                    {/* Subscription Mode Fields */}
                    {billingMode === 'subscription' && (
                        <>
                            <div className="catd-row-split animate-fade-in">
                                <div className="catd-group" style={{ flex: 1 }}>
                                    <label className="catd-label">
                                        <Repeat size={14} />
                                        Fréquence de facturation
                                    </label>
                                    <div className="catd-select-wrapper">
                                        <select {...register('billing_frequency')} className="catd-input catd-select">
                                            <option value="monthly">Mensuel</option>
                                            <option value="yearly">Annuel</option>
                                        </select>
                                        <ChevronDown size={16} className="catd-select-icon" />
                                    </div>
                                </div>
                                <div className="catd-group" style={{ flex: 1 }}>
                                    <label className="catd-label">
                                        <Clock size={14} />
                                        Type d'abonnement
                                    </label>
                                    <div className="catd-select-wrapper">
                                        <select {...register('subscription_type')} className="catd-input catd-select">
                                            <option value="ongoing">Indéterminé (Tacite reconduction)</option>
                                            <option value="fixed">Déterminé (Date à date)</option>
                                        </select>
                                        <ChevronDown size={16} className="catd-select-icon" />
                                    </div>
                                </div>
                            </div>

                            <div className="catd-row animate-fade-in" style={{ marginTop: '0.25rem' }}>
                                <div className="catd-group">
                                    <label className="catd-label">
                                        <Package size={14} />
                                        Nature du service (Génération automatique)
                                    </label>
                                    <div className="catd-select-wrapper">
                                        <select {...register('service_type')} className="catd-input catd-select">
                                            <option value="hosting">Hébergement</option>
                                            <option value="domain">Nom de domaine</option>
                                            <option value="license">Licence</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="other">Autre</option>
                                        </select>
                                        <ChevronDown size={16} className="catd-select-icon" />
                                    </div>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ce type de service sera automatiquement attribué au client lors de l'acceptation d'un devis lié à cette prestation.</p>
                                </div>
                            </div>

                            {/* Fixed Term Dates */}
                            {subType === 'fixed' && (
                                <div className="catd-section-fixed animate-fade-in">
                                    <div className="catd-row-split">
                                        <div className="catd-group" style={{ flex: 1 }}>
                                            <label className="catd-label">
                                                <Calendar size={14} />
                                                Date de début
                                            </label>
                                            <input
                                                type="date"
                                                {...register('start_date')}
                                                className={`catd-input ${errors.end_date ? 'catd-input-error' : ''}`}
                                            />
                                        </div>
                                        <div className="catd-group" style={{ flex: 1 }}>
                                            <label className="catd-label">
                                                <Calendar size={14} />
                                                Date de fin
                                            </label>
                                            <input
                                                type="date"
                                                {...register('end_date')}
                                                className={`catd-input ${errors.end_date ? 'catd-input-error' : ''}`}
                                            />
                                        </div>
                                    </div>
                                    {errors.end_date && <p className="catd-error">{errors.end_date.message}</p>}

                                    {/* Calculated Summary */}
                                    {(durationLabel || totalCostLabel) && (
                                        <div className="catd-summary">
                                            <div className="catd-summary-item">
                                                <span className="catd-summary-label">Durée totale</span>
                                                <span className="catd-summary-val">{durationLabel}</span>
                                            </div>
                                            <div className="catd-summary-sep" />
                                            <div className="catd-summary-item">
                                                <span className="catd-summary-label">Coût total estimé</span>
                                                <span className="catd-summary-val" style={{ color: 'var(--primary)' }}>{totalCostLabel}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </form>

                <div className="catd-footer-bar">
                    <button className="catd-cancel-btn" onClick={onClose} type="button">Annuler</button>
                    <button className="catd-save-btn" onClick={handleSubmit(onSubmit)} disabled={isSaving || isSubmitting} type="button">
                        {isSaving || isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Enregistrer
                    </button>
                </div>
            </div>

            <style>{catdDrawerStyles}</style>
        </div >
    );
}

const catdDrawerStyles = `
    .catd-overlay { position: fixed; inset: 0; z-index: 100; display: flex; justify-content: flex-end; }
    .catd-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); animation: fadeIn 0.2s; }
    .catd-panel {
        position: relative; width: 100%; max-width: 600px; height: 100%;
        background: var(--bg-card); border-left: 1px solid var(--border);
        box-shadow: -4px 0 24px rgba(0,0,0,0.1);
        display: flex; flex-direction: column;
    }
    .catd-header-bar {
        padding: 1.5rem; border-bottom: 1px solid var(--border);
        display: flex; justify-content: space-between; align-items: center;
    }
    .catd-header-bar h3 { font-size: 1.125rem; font-weight: 600; margin: 0; }
    .catd-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0.5rem; border-radius: 50%; transition: all 0.2s; display: flex; }
    .catd-close:hover { background: var(--bg-surface-hover); color: var(--text-primary); }

    .catd-body { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; }
    
    .catd-row-split { display: flex; gap: 1.25rem; flex-wrap: wrap; }
    .catd-group { display: flex; flex-direction: column; gap: 0.375rem; position: relative; }
    .catd-label {
        display: flex; align-items: center; gap: 0.375rem;
        font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary);
    }
    .catd-req { color: var(--danger); font-weight: 700; }
    
    .catd-input {
        width: 100%; padding: 0.75rem 1rem !important;
        background: var(--bg-app) !important; border: 1.5px solid var(--border) !important;
        border-radius: var(--radius-lg) !important; color: var(--text-primary) !important;
        font-size: 0.875rem !important; outline: none;
        transition: border var(--transition-smooth), box-shadow var(--transition-smooth) !important;
    }
    .catd-input:focus {
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
    }
    .catd-input::placeholder { color: var(--text-muted) !important; }
    .catd-input-error { border-color: var(--danger) !important; }
    .catd-textarea { resize: vertical; min-height: 80px; }
    
    .catd-select { padding-right: 2.5rem !important; cursor: pointer; appearance: none; -webkit-appearance: none; }
    .catd-select-wrapper { position: relative; }
    .catd-select-icon {
        position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
        color: var(--text-muted); pointer-events: none;
    }
    .catd-error { font-size: 0.75rem; color: var(--danger); margin-top: 0.25rem; }

    /* Fixed Term Calc Summary */
    .catd-section-fixed {
        background: var(--bg-surface-hover);
        border-radius: var(--radius-lg);
        padding: 1rem;
        border: 1px solid var(--border);
        display: flex; flex-direction: column; gap: 1rem;
    }
    .catd-summary {
        display: flex; align-items: center; justify-content: space-between;
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-lg); padding: 0.75rem 1.25rem;
    }
    .catd-summary-item { display: flex; flex-direction: column; gap: 0.125rem; }
    .catd-summary-label { font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .catd-summary-val { font-size: 1rem; font-weight: 700; }
    .catd-summary-sep { width: 1px; height: 24px; background: var(--border); }

    .catd-footer-bar { padding: 1.5rem; border-top: 1px solid var(--border); background: var(--bg-surface-hover); display: flex; justify-content: flex-end; gap: 0.75rem; }
    .catd-cancel-btn {
        padding: 0.75rem 1.25rem; background: transparent; border: 1px solid var(--border);
        border-radius: var(--radius-md); font-weight: 600; font-size: 0.875rem;
        cursor: pointer; transition: all 0.2s; color: var(--text-secondary);
    }
    .catd-cancel-btn:hover { background: var(--bg-card); color: var(--text-primary); border-color: var(--border-light); }
    
    .catd-save-btn {
        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white; border: none; border-radius: var(--radius-md);
        font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
    }
    .catd-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3); }
    .catd-save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;
