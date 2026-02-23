import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2, Save, FileText, Receipt, Loader2, GripVertical } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useClients } from '../hooks/useClients';
import { useCatalog } from '../hooks/useCatalog';
import type { DocumentType } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type FormData = {
    client_id: string;
    type: DocumentType;
    date: string;
    due_date: string;
    lines: {
        catalog_item_id?: string;
        name: string;
        description: string;
        quantity: number;
        unit_price: number;
    }[];
};

interface DocumentDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    document?: FormData; // Assuming Document is similar to FormData for editing
    initialClientId?: string;
    defaultType?: DocumentType;
    onSave: (data: FormData) => Promise<void>;
    isSaving: boolean;
}

interface SortableLineProps {
    id: string;
    index: number;
    register: any;
    remove: (index: number) => void;
    watchLines: any;
}

function SortableLine({ id, index, register, remove, watchLines }: SortableLineProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 0,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={`docd-line ${isDragging ? 'docd-line-dragging' : ''}`}>
            <div className="docd-line-drag-handle" {...attributes} {...listeners}>
                <GripVertical size={16} />
            </div>
            <div className="docd-line-content">
                <div className="docd-line-desc">
                    <label className="docd-label-sm">Prestation</label>
                    <input
                        {...register(`lines.${index}.name` as const, { required: true })}
                        className="docd-input"
                        placeholder="Titre de la prestation"
                        style={{ marginBottom: '0.5rem', fontWeight: 600 }}
                    />
                    <textarea
                        {...register(`lines.${index}.description` as const)}
                        rows={2}
                        className="docd-input docd-textarea"
                        placeholder="Description (optionnelle)"
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
                    <button type="button" onClick={() => remove(index)} className="docd-line-remove" title="Supprimer la ligne">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function DocumentDrawer({ isOpen, onClose, document, initialClientId, defaultType, onSave, isSaving }: DocumentDrawerProps) {
    const { clients } = useClients();
    const { catalogItems } = useCatalog();
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);

    const { control, register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            client_id: document?.client_id || initialClientId || '',
            type: document?.type || defaultType || 'invoice',
            date: document?.date || format(new Date(), 'yyyy-MM-dd'),
            due_date: document?.due_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
            lines: document?.lines && document.lines.length > 0 ? document.lines : []
        }
    });

    const { fields, append, remove, move } = useFieldArray({ control, name: 'lines' });

    const watchType = watch('type');
    const watchLines = watch('lines');

    const totalAmount = watchLines.reduce((sum, line) => sum + ((line.quantity || 0) * (line.unit_price || 0)), 0);

    useEffect(() => {
        if (isOpen) {
            reset({
                client_id: document?.client_id || initialClientId || '',
                type: document?.type || defaultType || 'invoice',
                date: document?.date || format(new Date(), 'yyyy-MM-dd'),
                due_date: document?.due_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
                lines: document?.lines && document.lines.length > 0 ? document.lines : [],
            });
        }
    }, [isOpen, document, initialClientId, defaultType, reset]);

    useEffect(() => {
        if (watchType === 'quote') {
            setValue('due_date', format(addDays(new Date(), 30), 'yyyy-MM-dd'));
        } else {
            setValue('due_date', format(addDays(new Date(), 30), 'yyyy-MM-dd'));
        }
    }, [watchType, setValue]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    const handleAddFromCatalog = (itemId?: string) => {
        if (itemId) {
            const item = catalogItems.find(i => i.id === itemId);
            if (item) {
                append({
                    catalog_item_id: item.id,
                    name: item.name,
                    description: item.description || '',
                    quantity: 1,
                    unit_price: item.unit_price
                });
            }
        } else {
            append({ name: '', description: '', quantity: 1, unit_price: 0 });
        }
        setIsCatalogOpen(false);
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

                    <div className="docd-lines-header" style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>
                        <span className="docd-section-title" style={{ margin: 0 }}>Lignes du document</span>
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                            <div className="docd-lines">
                                {fields.map((field, index) => (
                                    <SortableLine
                                        key={field.id}
                                        id={field.id}
                                        index={index}
                                        register={register}
                                        remove={remove}
                                        watchLines={watchLines}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Add zone */}
                    <div className="docd-add-zone">
                        {isCatalogOpen ? (
                            <div className="docd-catalog-dropdown animate-fade-in">
                                <div className="docd-catalog-header">
                                    <h4>Ajouter une prestation</h4>
                                    <button type="button" onClick={() => setIsCatalogOpen(false)} className="docd-catalog-close">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="docd-catalog-list">
                                    <button type="button" onClick={() => handleAddFromCatalog()} className="docd-catalog-item docd-catalog-custom">
                                        <Plus size={16} /> Prestation personnalisée (libre)
                                    </button>
                                    {catalogItems.length > 0 && <div className="docd-catalog-divider" />}
                                    {catalogItems.map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleAddFromCatalog(item.id)}
                                            className="docd-catalog-item"
                                        >
                                            <span className="name">{item.name}</span>
                                            <span className="price">{item.unit_price}€</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsCatalogOpen(true)}
                                className="docd-btn-add-large"
                            >
                                <Plus size={18} /> Ajouter une prestation
                            </button>
                        )}
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
        position: relative; width: 100%; max-width: 720px; height: 100dvh; max-height: 100dvh;
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
    .docd-lines { display: flex; flex-direction: column; gap: 0.75rem; }
    .docd-line {
        background: var(--bg-app); border: 1px solid var(--border);
        border-radius: var(--radius-lg); padding: 0.75rem 1rem 0.75rem 0.25rem;
        display: flex; gap: 0.75rem; align-items: stretch; transition: border 0.2s, box-shadow 0.2s;
    }
    .docd-line-dragging { border-color: var(--primary); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .docd-line-drag-handle {
        display: flex; align-items: center; justify-content: center;
        color: var(--text-muted); cursor: grab; padding: 0 0.5rem;
    }
    .docd-line-drag-handle:active { cursor: grabbing; color: var(--primary); }
    .docd-line-content {
        flex: 1; display: flex; flex-direction: column; gap: 0.75rem;
    }
    .docd-label-sm { font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25rem; }
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

    /* Add zone */
    .docd-add-zone { margin-top: 1rem; }
    .docd-btn-add-large {
        width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        padding: 1rem; border: 2px dashed var(--border); border-radius: var(--radius-lg);
        background: transparent; color: var(--text-secondary); font-weight: 600; font-size: 0.875rem;
        cursor: pointer; transition: all var(--transition-smooth);
    }
    .docd-btn-add-large:hover { border-color: var(--primary); color: var(--primary); background: rgba(139,92,246,0.05); }
    
    .docd-catalog-dropdown {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: var(--radius-lg); overflow: hidden;
        box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }
    .docd-catalog-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); background: var(--bg-surface-hover);
    }
    .docd-catalog-header h4 { font-size: 0.8125rem; font-weight: 600; margin: 0; color: var(--text-primary); }
    .docd-catalog-close { background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; }
    .docd-catalog-close:hover { color: var(--text-primary); }
    .docd-catalog-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; }
    .docd-catalog-item {
        display: flex; justify-content: space-between; align-items: center; text-align: left;
        padding: 0.75rem 1rem; background: transparent; border: none; border-bottom: 1px solid var(--border-light);
        cursor: pointer; transition: background var(--transition-fast);
    }
    .docd-catalog-item:last-child { border-bottom: none; }
    .docd-catalog-item:hover { background: var(--bg-surface-hover); }
    .docd-catalog-item .name { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
    .docd-catalog-item .price { font-size: 0.8125rem; color: var(--text-secondary); font-weight: 600; }
    .docd-catalog-custom { color: var(--primary) !important; font-weight: 600 !important; justify-content: flex-start; gap: 0.5rem; }
    .docd-catalog-divider { height: 4px; background: var(--bg-surface-hover); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }

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
        .docd-header-bar { padding: 1.25rem 1rem; }
        .docd-body { padding: 1rem; }
        .docd-footer-bar { padding: 1rem; padding-bottom: max(1rem, env(safe-area-inset-bottom)); flex-direction: column-reverse; }
        .docd-save-btn, .docd-cancel-btn { width: 100%; justify-content: center; }
    }
`;
