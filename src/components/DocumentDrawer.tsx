import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2, Save, FileText, Receipt, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useClients } from '../hooks/useClients';
import { useCatalog } from '../hooks/useCatalog';
import type { DocumentType } from '../types';

type FormData = {
    client_id: string;
    type: DocumentType;
    date: string;
    due_date: string;
    lines: {
        catalog_item_id?: string;
        description: string;
        quantity: number;
        unit_price: number;
    }[];
};

interface DocumentDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialClientId?: string;
    onSave: (data: FormData) => Promise<void>;
    isSaving: boolean;
}

export function DocumentDrawer({ isOpen, onClose, initialClientId, onSave, isSaving }: DocumentDrawerProps) {
    const { clients } = useClients();
    const { catalogItems } = useCatalog();

    const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            client_id: initialClientId || '',
            type: 'invoice',
            date: format(new Date(), 'yyyy-MM-dd'),
            due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
            lines: [{ description: '', quantity: 1, unit_price: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

    const watchType = watch('type');
    const watchLines = watch('lines');

    const totalAmount = watchLines.reduce((sum, line) => sum + ((line.quantity || 0) * (line.unit_price || 0)), 0);

    useEffect(() => {
        if (isOpen) {
            setValue('client_id', initialClientId || '');
            setValue('type', 'invoice');
            setValue('date', format(new Date(), 'yyyy-MM-dd'));
            setValue('due_date', format(addDays(new Date(), 30), 'yyyy-MM-dd'));
            setValue('lines', [{ description: '', quantity: 1, unit_price: 0 }]);
        }
    }, [isOpen, initialClientId, setValue]);

    useEffect(() => {
        if (watchType === 'quote') {
            setValue('due_date', format(addDays(new Date(), 30), 'yyyy-MM-dd'));
        } else {
            setValue('due_date', format(addDays(new Date(), 30), 'yyyy-MM-dd'));
        }
    }, [watchType, setValue]);

    const handleCatalogSelect = (index: number, itemId: string) => {
        const item = catalogItems.find(i => i.id === itemId);
        if (item) {
            setValue(`lines.${index}.description`, item.name + (item.description ? `\n${item.description}` : ''));
            setValue(`lines.${index}.unit_price`, item.unit_price);
            setValue(`lines.${index}.catalog_item_id`, itemId);
        }
    };

    const onSubmit = async (data: FormData) => {
        await onSave(data);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="docd-overlay">
            <div className="docd-backdrop" onClick={onClose} />
            <div className="docd-panel animate-slide-in-right">
                <div className="docd-header-bar">
                    <h3>Nouveau document</h3>
                    <button onClick={onClose} className="docd-close"><X size={20} /></button>
                </div>

                <form className="docd-body" onSubmit={handleSubmit(onSubmit)}>
                    <div className="docd-section-title">Informations</div>
                    <div className="docd-grid-2">
                        <div className="docd-group">
                            <label className="docd-label">Type de document</label>
                            <div className="docd-type-btns">
                                <label className={`docd-type-btn ${watchType === 'invoice' ? 'docd-type-active' : ''}`}>
                                    <input type="radio" value="invoice" {...register('type')} className="sr-only" />
                                    <Receipt size={18} />
                                    Facture
                                </label>
                                <label className={`docd-type-btn ${watchType === 'quote' ? 'docd-type-active' : ''}`}>
                                    <input type="radio" value="quote" {...register('type')} className="sr-only" />
                                    <FileText size={18} />
                                    Devis
                                </label>
                            </div>
                        </div>

                        <div className="docd-group">
                            <label className="docd-label">Client <span className="docd-req">*</span></label>
                            <select
                                {...register('client_id', { required: 'Client requis' })}
                                className={`docd-input docd-select ${errors.client_id ? 'docd-input-error' : ''}`}
                            >
                                <option value="">Sélectionner un client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.emoji || '🏢'} {client.name}</option>
                                ))}
                            </select>
                            {errors.client_id && <p className="docd-error">{errors.client_id.message}</p>}
                        </div>

                        <div className="docd-group">
                            <label className="docd-label">Date d'émission</label>
                            <input type="date" {...register('date')} className="docd-input" />
                        </div>

                        <div className="docd-group">
                            <label className="docd-label">{watchType === 'quote' ? "Validité jusqu'au" : "Échéance"}</label>
                            <input type="date" {...register('due_date')} className="docd-input" />
                        </div>
                    </div>

                    <div className="docd-lines-header" style={{ marginTop: '1.5rem' }}>
                        <span className="docd-section-title" style={{ margin: 0 }}>Lignes</span>
                        <button
                            type="button"
                            onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
                            className="docd-add-line"
                        >
                            <Plus size={16} /> Ajouter
                        </button>
                    </div>

                    <div className="docd-lines">
                        {fields.map((field, index) => (
                            <div key={field.id} className="docd-line">
                                <div className="docd-line-desc">
                                    <div className="docd-line-desc-header">
                                        <label className="docd-label-sm">Description</label>
                                        <select
                                            className="docd-catalog-select"
                                            onChange={(e) => handleCatalogSelect(index, e.target.value)}
                                            value={watchLines[index]?.catalog_item_id || ''}
                                        >
                                            <option value="">Catalogue...</option>
                                            {catalogItems.map(item => (
                                                <option key={item.id} value={item.id}>{item.name} — {item.unit_price}€</option>
                                            ))}
                                        </select>
                                    </div>
                                    <textarea
                                        {...register(`lines.${index}.description` as const, { required: true })}
                                        rows={2}
                                        className="docd-input docd-textarea"
                                        placeholder="Description de la prestation"
                                    />
                                </div>
                                <div className="docd-line-nums">
                                    <div className="docd-group-sm">
                                        <label className="docd-label-sm">Qté</label>
                                        <input
                                            type="number" step="0.01"
                                            {...register(`lines.${index}.quantity` as const, { valueAsNumber: true })}
                                            className="docd-input docd-input-sm"
                                        />
                                    </div>
                                    <div className="docd-group-sm">
                                        <label className="docd-label-sm">Prix Unit. (€)</label>
                                        <input
                                            type="number" step="0.01"
                                            {...register(`lines.${index}.unit_price` as const, { valueAsNumber: true })}
                                            className="docd-input docd-input-sm"
                                        />
                                    </div>
                                    <div className="docd-group-sm">
                                        <label className="docd-label-sm">Total</label>
                                        <div className="docd-line-total">
                                            {((watchLines[index]?.quantity || 0) * (watchLines[index]?.unit_price || 0)).toFixed(2)}€
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => remove(index)} className="docd-line-remove">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Grand total */}
                    <div className="docd-grand-total">
                        <span>Total HT</span>
                        <span className="docd-grand-total-val">
                            {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                    <div className="docd-tva">TVA non applicable, art. 293 B du CGI</div>
                </form>

                <div className="docd-footer-bar">
                    <button className="docd-cancel-btn" onClick={onClose} type="button">Annuler</button>
                    <button className="docd-save-btn" onClick={handleSubmit(onSubmit)} disabled={isSaving} type="button">
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Créer le document
                    </button>
                </div>
            </div>

            <style>{docDrawerStyles}</style>
        </div>
    );
}

const docDrawerStyles = `
    .docd-overlay { position: fixed; inset: 0; z-index: 100; display: flex; justify-content: flex-end; }
    .docd-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); animation: fadeIn 0.2s; }
    .docd-panel {
        position: relative; width: 100%; max-width: 720px; height: 100%;
        background: var(--bg-card); border-left: 1px solid var(--border);
        box-shadow: -4px 0 24px rgba(0,0,0,0.1);
        display: flex; flex-direction: column;
    }
    .docd-header-bar {
        padding: 1.5rem; border-bottom: 1px solid var(--border);
        display: flex; justify-content: space-between; align-items: center; background: var(--bg-card);
    }
    .docd-header-bar h3 { font-size: 1.125rem; font-weight: 600; margin: 0; }
    .docd-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0.5rem; border-radius: 50%; transition: all 0.2s; display: flex; }
    .docd-close:hover { background: var(--bg-surface-hover); color: var(--text-primary); }

    .docd-body { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; }

    .docd-section-title {
        font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.5rem;
    }
    .docd-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .docd-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .docd-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); }
    .docd-req { color: var(--danger); }
    
    .docd-input, .docd-select {
        width: 100%; padding: 0.75rem 1rem !important;
        background: var(--bg-app) !important; border: 1.5px solid var(--border) !important;
        border-radius: var(--radius-lg) !important; color: var(--text-primary) !important;
        font-size: 0.875rem !important; outline: none;
        transition: border var(--transition-smooth), box-shadow var(--transition-smooth) !important;
    }
    .docd-select { appearance: none; -webkit-appearance: none; cursor: pointer; }
    .docd-input:focus, .docd-select:focus {
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
    }
    .docd-input-error { border-color: var(--danger) !important; }
    .docd-error { font-size: 0.75rem; color: var(--danger); }
    .docd-textarea { resize: vertical; min-height: 60px; }
    .docd-input-sm { text-align: center; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

    /* Type buttons */
    .docd-type-btns { display: flex; gap: 0.5rem; }
    .docd-type-btn {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        padding: 0.75rem; border-radius: var(--radius-lg); border: 1.5px solid var(--border);
        background: transparent; color: var(--text-secondary); font-weight: 500; font-size: 0.875rem;
        cursor: pointer; transition: all var(--transition-smooth);
    }
    .docd-type-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
    .docd-type-active {
        border-color: var(--primary) !important; background: var(--primary-light) !important;
        color: var(--primary) !important; font-weight: 600;
    }

    /* Lines */
    .docd-lines-header { display: flex; justify-content: space-between; align-items: center; }
    .docd-add-line {
        display: flex; align-items: center; gap: 0.375rem;
        padding: 0.375rem 0.75rem; border-radius: var(--radius-md);
        font-size: 0.75rem; font-weight: 600; color: var(--primary);
        background: var(--primary-light); border: none; cursor: pointer;
        transition: all var(--transition-fast);
    }
    .docd-add-line:hover { background: rgba(139,92,246,0.2); }
    .docd-lines { display: flex; flex-direction: column; gap: 0.75rem; }
    .docd-line {
        background: var(--bg-app); border: 1px solid var(--border);
        border-radius: var(--radius-lg); padding: 1rem;
        display: flex; flex-direction: column; gap: 0.75rem;
    }
    .docd-line-desc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .docd-label-sm { font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .docd-catalog-select {
        font-size: 0.6875rem; background: transparent; border: none;
        color: var(--primary); cursor: pointer; padding: 0; outline: none;
    }
    .docd-line-nums {
        display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 0.75rem; align-items: end;
    }
    .docd-group-sm { display: flex; flex-direction: column; gap: 0.25rem; }
    .docd-line-total {
        padding: 0.75rem; font-size: 0.875rem; font-weight: 700; text-align: center;
        color: var(--primary); background: var(--primary-light);
        border-radius: var(--radius-lg);
    }
    .docd-line-remove {
        width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
        border: none; background: transparent; color: var(--text-muted); cursor: pointer;
        border-radius: var(--radius-md); transition: all var(--transition-fast);
    }
    .docd-line-remove:hover { background: rgba(239,68,68,0.1); color: var(--danger); }

    /* Grand total */
    .docd-grand-total {
        display: flex; justify-content: flex-end; align-items: center; gap: 1rem;
        padding-top: 1.25rem; margin-top: 1rem; border-top: 1px solid var(--border);
        font-size: 0.875rem; color: var(--text-secondary);
    }
    .docd-grand-total-val {
        font-size: 1.5rem; font-weight: 700;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .docd-tva { text-align: right; font-size: 0.6875rem; color: var(--text-muted); margin-top: 0.25rem; }

    /* Footer / Actions */
    .docd-footer-bar { padding: 1.5rem; border-top: 1px solid var(--border); background: var(--bg-surface-hover); display: flex; justify-content: flex-end; gap: 0.75rem; }
    .docd-cancel-btn {
        padding: 0.75rem 1.25rem; background: transparent; border: 1px solid var(--border);
        border-radius: var(--radius-md); font-weight: 600; font-size: 0.875rem;
        cursor: pointer; transition: all 0.2s; color: var(--text-secondary);
    }
    .docd-cancel-btn:hover { background: var(--bg-card); color: var(--text-primary); border-color: var(--border-light); }
    .docd-save-btn {
        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white; border: none; border-radius: var(--radius-md);
        font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
    }
    .docd-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3); }
    .docd-save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 700px) {
        .docd-grid-2 { grid-template-columns: 1fr; }
        .docd-line-nums { grid-template-columns: 1fr 1fr; }
        .docd-panel { max-width: 100%; }
        .docd-line-nums { grid-template-columns: 1fr 1fr 1fr auto; align-items: start; }
    }
    @media (max-width: 480px) {
        .docd-line-nums { grid-template-columns: 1fr 1fr; }
        .docd-line-remove { grid-column: span 2; width: 100%; }
    }
`;
