
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useDocuments } from '../../hooks/useDocuments';
import { useClients } from '../../hooks/useClients';
import { useCatalog } from '../../hooks/useCatalog';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
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

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'lines'
    });

    const watchType = watch('type');
    const watchLines = watch('lines');

    const totalAmount = watchLines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);

    // Update due_date when type changes
    useEffect(() => {
        if (watchType === 'quote') {
            setValue('due_date', format(addDays(new Date(), 30), 'yyyy-MM-dd')); // Valid 30 days
        } else {
            setValue('due_date', format(addDays(new Date(), 30), 'yyyy-MM-dd')); // Due in 30 days
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
            await createDocument.mutateAsync({
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
            navigate('/documents');
        } catch (error) {
            console.error('Failed', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-6 flex items-center gap-4">
                <Link to="/documents" className="text-[--text-secondary] hover:text-[--text-primary]">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold">Nouveau Document</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Header Config */}
                <div className="card grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label>Type de document</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="invoice" {...register('type')} />
                                    Facture
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="quote" {...register('type')} />
                                    Devis
                                </label>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="client_id">Client *</label>
                            <select
                                id="client_id"
                                {...register('client_id', { required: 'Client requis' })}
                                className={errors.client_id ? 'border-[--danger]' : ''}
                            >
                                <option value="">Sélectionner un client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            {errors.client_id && <p className="text-[--danger] text-sm mt-1">{errors.client_id.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="date">Date d'émission</label>
                            <input type="date" id="date" {...register('date')} />
                        </div>
                        <div>
                            <label htmlFor="due_date">{watchType === 'quote' ? 'Validité jusqu\'au' : 'Échéance'}</label>
                            <input type="date" id="due_date" {...register('due_date')} />
                        </div>
                    </div>
                </div>

                {/* Lines */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Lignes</h3>
                        <button
                            type="button"
                            onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
                            className="text-sm text-[--primary] hover:underline flex items-center gap-1"
                        >
                            <Plus size={16} /> Ajouter une ligne
                        </button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-start bg-[--bg-app]/50 p-4 rounded-lg">
                                <div className="col-span-12 md:col-span-6">
                                    <div className="flex justify-between mb-1">
                                        <label className="text-xs">Description</label>
                                        <select
                                            className="text-xs w-auto py-0 px-1 h-5 border-none bg-transparent text-[--primary] cursor-pointer"
                                            onChange={(e) => handleCatalogSelect(index, e.target.value)}
                                            value={watchLines[index]?.catalog_item_id || ''}
                                        >
                                            <option value="">Charger du catalogue...</option>
                                            {catalogItems.map(item => (
                                                <option key={item.id} value={item.id}>{item.name} - {item.unit_price}€</option>
                                            ))}
                                        </select>
                                    </div>
                                    <textarea
                                        {...register(`lines.${index}.description` as const, { required: true })}
                                        rows={2}
                                        className="w-full text-sm"
                                        placeholder="Description de la prestation"
                                    />
                                </div>

                                <div className="col-span-4 md:col-span-2">
                                    <label className="text-xs">Qté</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register(`lines.${index}.quantity` as const, { valueAsNumber: true })}
                                        className="text-sm"
                                    />
                                </div>

                                <div className="col-span-4 md:col-span-2">
                                    <label className="text-xs">Prix Unit. (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register(`lines.${index}.unit_price` as const, { valueAsNumber: true })}
                                        className="text-sm"
                                    />
                                </div>

                                <div className="col-span-4 md:col-span-1 text-right">
                                    <label className="text-xs block mb-2">Total</label>
                                    <span className="text-sm font-medium">
                                        {((watchLines[index]?.quantity || 0) * (watchLines[index]?.unit_price || 0)).toFixed(2)}€
                                    </span>
                                </div>

                                <div className="col-span-12 md:col-span-1 flex justify-end pt-6">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-[--text-secondary] hover:text-[--danger]"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end items-center gap-4 pt-4 border-t border-[--border]">
                        <div className="text-right">
                            <span className="text-sm text-[--text-secondary] mr-4">Total HT</span>
                            <span className="text-2xl font-bold text-[--primary]">
                                {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                            <div className="text-xs text-[--text-muted] mt-1">TVA non applicable, art. 293 B du CGI</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link to="/documents" className="btn btn-secondary">
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Création...' : (
                            <>
                                <Save size={18} />
                                Créer le document
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
