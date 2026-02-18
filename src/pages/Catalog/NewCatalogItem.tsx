
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCatalog } from '../../hooks/useCatalog';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const itemSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    description: z.string().optional(),
    unit_price: z.number({ invalid_type_error: 'Le prix doit être un nombre' }).min(0, 'Le prix doit être positif'),
    unit: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

export function NewCatalogItem() {
    const { createCatalogItem } = useCatalog();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ItemFormData>({
        resolver: zodResolver(itemSchema),
    });

    const onSubmit = async (data: ItemFormData) => {
        try {
            await createCatalogItem.mutateAsync({
                ...data,
                description: data.description || null,
                unit: data.unit || 'pièce',
            });
            navigate('/catalog');
        } catch (error) {
            console.error('Failed to create item:', error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link to="/catalog" className="text-[--text-secondary] hover:text-[--text-primary]">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold">Nouvelle Prestation</h1>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="name">Nom de la prestation *</label>
                        <input
                            id="name"
                            {...register('name')}
                            className={errors.name ? 'border-[--danger]' : ''}
                            placeholder="Ex: Landing Page, Maintenance Mensuelle..."
                        />
                        {errors.name && <p className="text-[--danger] text-sm mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            {...register('description')}
                            rows={3}
                            placeholder="Détails de la prestation..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="unit_price">Prix Unitaire (€) *</label>
                            <input
                                id="unit_price"
                                type="number"
                                step="0.01"
                                {...register('unit_price', { valueAsNumber: true })}
                                className={errors.unit_price ? 'border-[--danger]' : ''}
                            />
                            {errors.unit_price && <p className="text-[--danger] text-sm mt-1">{errors.unit_price.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="unit">Unité</label>
                            <input
                                id="unit"
                                {...register('unit')}
                                placeholder="Ex: pièce, heure, jour, mois"
                                defaultValue="pièce"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[--border]">
                        <Link to="/catalog" className="btn btn-secondary">
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                'Enregistrement...'
                            ) : (
                                <>
                                    <Save size={18} />
                                    Enregistrer
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
