
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useClients } from '../../hooks/useClients';
import { ArrowLeft, Save, User, Mail, MapPin, StickyNote, Loader2 } from 'lucide-react';
import { EmojiPicker } from '../../components/EmojiPicker';

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
    const [emoji, setEmoji] = useState('🏢');

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
                emoji,
            });
            navigate('/clients');
        } catch (error) {
            console.error('Failed to create client:', error);
        }
    };

    return (
        <div className="frm animate-fade-in">
            {/* Breadcrumb */}
            <div className="frm-breadcrumb">
                <Link to="/clients" className="frm-back">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="frm-title">Nouveau Client</h1>
                    <p className="frm-subtitle">Remplissez les informations du client</p>
                </div>
            </div>

            <div className="frm-card">
                <form onSubmit={handleSubmit(onSubmit)} className="frm-form">
                    {/* Emoji + Name row */}
                    <div className="frm-row-emoji">
                        <EmojiPicker value={emoji} onChange={setEmoji} />
                        <div className="frm-group" style={{ flex: 1 }}>
                            <label className="frm-label">
                                <User size={14} />
                                Nom / Raison sociale <span className="frm-req">*</span>
                            </label>
                            <input
                                {...register('name')}
                                className={`frm-input ${errors.name ? 'frm-input-error' : ''}`}
                                placeholder="Ex: Acme Corp"
                            />
                            {errors.name && <p className="frm-error">{errors.name.message}</p>}
                        </div>
                    </div>

                    <div className="frm-group">
                        <label className="frm-label">
                            <Mail size={14} />
                            Email contact
                        </label>
                        <input
                            type="email"
                            {...register('email')}
                            className={`frm-input ${errors.email ? 'frm-input-error' : ''}`}
                            placeholder="contact@example.com"
                        />
                        {errors.email && <p className="frm-error">{errors.email.message}</p>}
                    </div>

                    <div className="frm-group">
                        <label className="frm-label">
                            <MapPin size={14} />
                            Adresse complète
                        </label>
                        <textarea
                            {...register('address')}
                            rows={3}
                            className="frm-input frm-textarea"
                            placeholder="123 Rue de la Paix, 75000 Paris"
                        />
                    </div>

                    <div className="frm-group">
                        <label className="frm-label">
                            <StickyNote size={14} />
                            Notes internes
                        </label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            className="frm-input frm-textarea"
                            placeholder="Infos utiles, SIRET, préférences..."
                        />
                    </div>

                    <div className="frm-actions">
                        <Link to="/clients" className="frm-btn-cancel">Annuler</Link>
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

export const formStyles = `
    .frm { max-width: 680px; margin: 0 auto; }

    .frm-breadcrumb {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .frm-back {
        width: 36px;
        height: 36px;
        border-radius: var(--radius-lg);
        background: var(--bg-card);
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        transition: all var(--transition-smooth);
        text-decoration: none;
    }
    .frm-back:hover {
        color: var(--text-primary);
        border-color: var(--primary);
        background: var(--primary-light);
    }
    .frm-title {
        font-size: 1.5rem;
        font-weight: 700;
    }
    .frm-subtitle {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin-top: 0.125rem;
    }

    .frm-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        padding: 2rem;
    }
    .frm-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .frm-row-emoji {
        display: flex;
        align-items: flex-start;
        gap: 1.25rem;
    }
    .frm-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }
    .frm-label {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-secondary);
        letter-spacing: 0.01em;
    }
    .frm-req {
        color: var(--danger);
        font-weight: 700;
    }
    .frm-input {
        width: 100%;
        padding: 0.75rem 1rem !important;
        background: var(--bg-app) !important;
        border: 1.5px solid var(--border) !important;
        border-radius: var(--radius-lg) !important;
        color: var(--text-primary) !important;
        font-size: 0.875rem !important;
        transition: border var(--transition-smooth), box-shadow var(--transition-smooth) !important;
    }
    .frm-input:focus {
        outline: none !important;
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
    }
    .frm-input::placeholder {
        color: var(--text-muted) !important;
    }
    .frm-input-error {
        border-color: var(--danger) !important;
    }
    .frm-input-error:focus {
        box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important;
    }
    .frm-textarea {
        resize: vertical;
        min-height: 80px;
    }
    .frm-error {
        font-size: 0.75rem;
        color: var(--danger);
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .frm-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding-top: 1.25rem;
        border-top: 1px solid var(--border);
    }
    .frm-btn-cancel {
        padding: 0.625rem 1.25rem;
        border-radius: var(--radius-lg);
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.8125rem;
        text-decoration: none;
        border: 1px solid var(--border);
        background: transparent;
        cursor: pointer;
        transition: all var(--transition-smooth);
    }
    .frm-btn-cancel:hover {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
    }
    .frm-btn-submit {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.5rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        font-weight: 600;
        font-size: 0.8125rem;
        border: none;
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all var(--transition-smooth);
    }
    .frm-btn-submit:hover:not(:disabled) {
        box-shadow: 0 4px 16px rgba(139,92,246,0.3);
        transform: translateY(-1px);
    }
    .frm-btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .animate-spin {
        animation: spin 0.8s linear infinite;
    }
    @media (max-width: 600px) {
        .frm-row-emoji { flex-direction: column; align-items: center; }
        .frm-actions { flex-direction: column-reverse; }
        .frm-btn-cancel, .frm-btn-submit { width: 100%; justify-content: center; }
        .frm-btn-submit:hover:not(:disabled) { transform: none; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
`;
