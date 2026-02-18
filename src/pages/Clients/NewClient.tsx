
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../../hooks/useClients';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const clientSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    address: z.string().optional(),
    notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export function NewClient() {
    const { createClient } = useClients();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
    });

    const onSubmit = async (data: ClientFormData) => {
        try {
            await createClient.mutateAsync({
                ...data,
                email: data.email || null,
                address: data.address || null,
                notes: data.notes || null,
            });
            navigate('/clients');
        } catch (error) {
            console.error('Failed to create client:', error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link to="/clients" className="text-[--text-secondary] hover:text-[--text-primary]">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold">Nouveau Client</h1>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="name">Nom / Raison sociale *</label>
                        <input
                            id="name"
                            {...register('name')}
                            className={errors.name ? 'border-[--danger]' : ''}
                            placeholder="Ex: Acme Corp"
                        />
                        {errors.name && <p className="text-[--danger] text-sm mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="email">Email contact</label>
                        <input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="contact@example.com"
                        />
                        {errors.email && <p className="text-[--danger] text-sm mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="address">Adresse complète</label>
                        <textarea
                            id="address"
                            {...register('address')}
                            rows={3}
                            placeholder="123 Rue de la Paix, 75000 Paris"
                        />
                    </div>

                    <div>
                        <label htmlFor="notes">Notes internes</label>
                        <textarea
                            id="notes"
                            {...register('notes')}
                            rows={3}
                            placeholder="Infos utiles, SIRET, préférences..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[--border]">
                        <Link to="/clients" className="btn btn-secondary">
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
