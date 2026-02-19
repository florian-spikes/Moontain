
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import { useClients } from '../../hooks/useClients';
import { useCatalog } from '../../hooks/useCatalog';
import { Plus, Trash2, Save, ArrowLeft, FileText, Receipt, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { DocumentType } from '../../types';

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

export function NewDocument() {
    const navigate = useNavigate();
    const { createDocument } = useDocuments();
    const { clients } = useClients();
    const { catalogItems } = useCatalog();

    const { control, register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        defaultValues: {
            type: 'invoice',
            date: format(new Date(), 'yyyy-MM-dd'),
            due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
            lines: [{ description: '', quantity: 1, unit_price: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

    const watchType = watch('type');
    const watchLines = watch('lines');

    const totalAmount = watchLines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);

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
        try {
            const newDoc = await createDocument.mutateAsync({
                client_id: data.client_id,
                type: data.type,
                date: data.date,
                due_date: data.due_date,
                lines: data.lines.map(line => ({
                    description: line.description,
                    quantity: line.quantity,
                    unit_price: line.unit_price
                }))
            });
            navigate(`/documents/${newDoc.id}`);
        } catch (error) {
            console.error('Failed', error);
        }
    };

    return (
        <div className="ndoc animate-fade-in">
            {/* Breadcrumb */}
            <div className="ndoc-breadcrumb">
                <Link to="/documents" className="ndoc-back"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="ndoc-title">Nouveau Document</h1>
                    <p className="ndoc-subtitle">Créez un devis ou une facture</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="ndoc-form">
                {/* Header Config */}
                <div className="ndoc-card">
                    <div className="ndoc-section-title">Informations</div>
                    <div className="ndoc-grid-2">
                        <div className="ndoc-group">
                            <label className="ndoc-label">Type de document</label>
                            <div className="ndoc-type-btns">
                                <label className={`ndoc-type-btn ${watchType === 'invoice' ? 'ndoc-type-active' : ''}`}>
                                    <input type="radio" value="invoice" {...register('type')} className="sr-only" />
                                    <Receipt size={18} />
                                    Facture
                                </label>
                                <label className={`ndoc-type-btn ${watchType === 'quote' ? 'ndoc-type-active' : ''}`}>
                                    <input type="radio" value="quote" {...register('type')} className="sr-only" />
                                    <FileText size={18} />
                                    Devis
                                </label>
                            </div>
                        </div>

                        <div className="ndoc-group">
                            <label className="ndoc-label">Client <span className="ndoc-req">*</span></label>
                            <select
                                {...register('client_id', { required: 'Client requis' })}
                                className={`ndoc-select ${errors.client_id ? 'ndoc-input-error' : ''}`}
                            >
                                <option value="">Sélectionner un client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.emoji || '🏢'} {client.name}</option>
                                ))}
                            </select>
                            {errors.client_id && <p className="ndoc-error">{errors.client_id.message}</p>}
                        </div>

                        <div className="ndoc-group">
                            <label className="ndoc-label">Date d'émission</label>
                            <input type="date" {...register('date')} className="ndoc-input" />
                        </div>

                        <div className="ndoc-group">
                            <label className="ndoc-label">{watchType === 'quote' ? "Validité jusqu'au" : "Échéance"}</label>
                            <input type="date" {...register('due_date')} className="ndoc-input" />
                        </div>
                    </div>
                </div>

                {/* Lines */}
                <div className="ndoc-card">
                    <div className="ndoc-lines-header">
                        <span className="ndoc-section-title">Lignes</span>
                        <button
                            type="button"
                            onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
                            className="ndoc-add-line"
                        >
                            <Plus size={16} /> Ajouter
                        </button>
                    </div>

                    <div className="ndoc-lines">
                        {fields.map((field, index) => (
                            <div key={field.id} className="ndoc-line">
                                <div className="ndoc-line-desc">
                                    <div className="ndoc-line-desc-header">
                                        <label className="ndoc-label-sm">Description</label>
                                        <select
                                            className="ndoc-catalog-select"
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
                                        className="ndoc-input ndoc-textarea"
                                        placeholder="Description de la prestation"
                                    />
                                </div>
                                <div className="ndoc-line-nums">
                                    <div className="ndoc-group-sm">
                                        <label className="ndoc-label-sm">Qté</label>
                                        <input
                                            type="number" step="0.01"
                                            {...register(`lines.${index}.quantity` as const, { valueAsNumber: true })}
                                            className="ndoc-input ndoc-input-sm"
                                        />
                                    </div>
                                    <div className="ndoc-group-sm">
                                        <label className="ndoc-label-sm">Prix Unit. (€)</label>
                                        <input
                                            type="number" step="0.01"
                                            {...register(`lines.${index}.unit_price` as const, { valueAsNumber: true })}
                                            className="ndoc-input ndoc-input-sm"
                                        />
                                    </div>
                                    <div className="ndoc-group-sm">
                                        <label className="ndoc-label-sm">Total</label>
                                        <div className="ndoc-line-total">
                                            {((watchLines[index]?.quantity || 0) * (watchLines[index]?.unit_price || 0)).toFixed(2)}€
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => remove(index)} className="ndoc-line-remove">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Grand total */}
                    <div className="ndoc-grand-total">
                        <span>Total HT</span>
                        <span className="ndoc-grand-total-val">
                            {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </div>
                    <div className="ndoc-tva">TVA non applicable, art. 293 B du CGI</div>
                </div>

                <div className="ndoc-actions">
                    <Link to="/documents" className="ndoc-btn-cancel">Annuler</Link>
                    <button type="submit" className="ndoc-btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Création...</> : <><Save size={18} /> Créer le document</>}
                    </button>
                </div>
            </form>

            <style>{ndocStyles}</style>
        </div>
    );
}

const ndocStyles = `
    .ndoc { max-width: 860px; margin: 0 auto; padding-bottom: 2rem; }
    .ndoc-breadcrumb { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .ndoc-back {
        width: 36px; height: 36px; border-radius: var(--radius-lg);
        background: var(--bg-card); border: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center;
        color: var(--text-secondary); transition: all var(--transition-smooth); text-decoration: none;
    }
    .ndoc-back:hover { color: var(--text-primary); border-color: var(--primary); background: var(--primary-light); }
    .ndoc-title { font-size: 1.5rem; font-weight: 700; }
    .ndoc-subtitle { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.125rem; }
    .ndoc-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .ndoc-card {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-xl); padding: 1.5rem;
    }
    .ndoc-section-title {
        font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 1rem;
    }
    .ndoc-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .ndoc-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .ndoc-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); }
    .ndoc-req { color: var(--danger); }
    .ndoc-input, .ndoc-select {
        width: 100%; padding: 0.75rem 1rem !important;
        background: var(--bg-app) !important; border: 1.5px solid var(--border) !important;
        border-radius: var(--radius-lg) !important; color: var(--text-primary) !important;
        font-size: 0.875rem !important;
        transition: border var(--transition-smooth), box-shadow var(--transition-smooth) !important;
    }
    .ndoc-input:focus, .ndoc-select:focus {
        outline: none !important; border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
    }
    .ndoc-input-error { border-color: var(--danger) !important; }
    .ndoc-error { font-size: 0.75rem; color: var(--danger); }
    .ndoc-textarea { resize: vertical; min-height: 60px; }
    .ndoc-input-sm { text-align: center; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

    /* Type buttons */
    .ndoc-type-btns { display: flex; gap: 0.5rem; }
    .ndoc-type-btn {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        padding: 0.75rem; border-radius: var(--radius-lg); border: 1.5px solid var(--border);
        background: transparent; color: var(--text-secondary); font-weight: 500; font-size: 0.875rem;
        cursor: pointer; transition: all var(--transition-smooth);
    }
    .ndoc-type-btn:hover { border-color: var(--primary); color: var(--primary); }
    .ndoc-type-active {
        border-color: var(--primary) !important; background: var(--primary-light) !important;
        color: var(--primary) !important; font-weight: 600;
    }

    /* Lines */
    .ndoc-lines-header { display: flex; justify-content: space-between; align-items: center; }
    .ndoc-add-line {
        display: flex; align-items: center; gap: 0.375rem;
        padding: 0.375rem 0.75rem; border-radius: var(--radius-md);
        font-size: 0.75rem; font-weight: 600; color: var(--primary);
        background: var(--primary-light); border: none; cursor: pointer;
        transition: all var(--transition-fast);
    }
    .ndoc-add-line:hover { background: rgba(139,92,246,0.2); }
    .ndoc-lines { display: flex; flex-direction: column; gap: 0.75rem; }
    .ndoc-line {
        background: var(--bg-app); border: 1px solid var(--border);
        border-radius: var(--radius-lg); padding: 1rem;
        display: flex; flex-direction: column; gap: 0.75rem;
    }
    .ndoc-line-desc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .ndoc-label-sm { font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .ndoc-catalog-select {
        font-size: 0.6875rem; background: transparent; border: none;
        color: var(--primary); cursor: pointer; padding: 0;
    }
    .ndoc-line-nums {
        display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 0.75rem; align-items: end;
    }
    .ndoc-group-sm { display: flex; flex-direction: column; gap: 0.25rem; }
    .ndoc-line-total {
        padding: 0.75rem; font-size: 0.875rem; font-weight: 700; text-align: center;
        color: var(--primary); background: var(--primary-light);
        border-radius: var(--radius-lg);
    }
    .ndoc-line-remove {
        width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
        border: none; background: transparent; color: var(--text-muted); cursor: pointer;
        border-radius: var(--radius-md); transition: all var(--transition-fast);
    }
    .ndoc-line-remove:hover { background: rgba(239,68,68,0.1); color: var(--danger); }

    /* Grand total */
    .ndoc-grand-total {
        display: flex; justify-content: flex-end; align-items: center; gap: 1rem;
        padding-top: 1.25rem; margin-top: 1rem; border-top: 1px solid var(--border);
        font-size: 0.875rem; color: var(--text-secondary);
    }
    .ndoc-grand-total-val {
        font-size: 1.5rem; font-weight: 700;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .ndoc-tva { text-align: right; font-size: 0.6875rem; color: var(--text-muted); margin-top: 0.25rem; }

    /* Actions */
    .ndoc-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
    .ndoc-btn-cancel {
        padding: 0.625rem 1.25rem; border-radius: var(--radius-lg);
        color: var(--text-secondary); font-weight: 600; font-size: 0.8125rem;
        text-decoration: none; border: 1px solid var(--border); background: transparent;
        cursor: pointer; transition: all var(--transition-smooth);
    }
    .ndoc-btn-cancel:hover { background: var(--bg-surface-hover); color: var(--text-primary); }
    .ndoc-btn-submit {
        display: inline-flex; align-items: center; gap: 0.5rem;
        padding: 0.625rem 1.5rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white; font-weight: 600; font-size: 0.8125rem; border: none;
        border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition-smooth);
    }
    .ndoc-btn-submit:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(139,92,246,0.3); transform: translateY(-1px); }
    .ndoc-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .animate-spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 700px) {
        .ndoc-grid-2 { grid-template-columns: 1fr; }
        .ndoc-line-nums { grid-template-columns: 1fr 1fr; }
    }
`;
