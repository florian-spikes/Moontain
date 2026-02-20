import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Loader2, User, Mail, MapPin, StickyNote } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import type { Client } from '../types';

const clientSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    address: z.string().optional(),
    notes: z.string().optional(),
    manager_civility: z.string().optional(),
    manager_first_name: z.string().optional(),
    manager_last_name: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
    onSave: (data: Partial<Client>) => Promise<void>;
    isSaving: boolean;
}

export function ClientDrawer({ isOpen, onClose, client, onSave, isSaving }: ClientDrawerProps) {
    const [emoji, setEmoji] = useState(client.emoji || '🏢');

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: client.name || '',
            email: client.email || '',
            address: client.address || '',
            notes: client.notes || '',
            manager_civility: client.manager_civility || '',
            manager_first_name: client.manager_first_name || '',
            manager_last_name: client.manager_last_name || '',
        }
    });

    useEffect(() => {
        if (isOpen) {
            setEmoji(client.emoji || '🏢');
            reset({
                name: client.name || '',
                email: client.email || '',
                address: client.address || '',
                notes: client.notes || '',
                manager_civility: client.manager_civility || '',
                manager_first_name: client.manager_first_name || '',
                manager_last_name: client.manager_last_name || '',
            });
        }
    }, [isOpen, client, reset]);

    const onSubmit = async (data: ClientFormData) => {
        await onSave({
            ...data,
            email: data.email || null,
            address: data.address || null,
            notes: data.notes || null,
            manager_civility: data.manager_civility || null,
            manager_first_name: data.manager_first_name || null,
            manager_last_name: data.manager_last_name || null,
            emoji
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="cd-overlay">
            <div className="cd-backdrop" onClick={onClose} />
            <div className="cd-panel animate-slide-in-right">
                <div className="cd-header-bar">
                    <h3>Modifier le client</h3>
                    <button onClick={onClose} className="cd-close"><X size={20} /></button>
                </div>

                <form className="cd-body" onSubmit={handleSubmit(onSubmit)}>
                    <div className="cd-field-group">
                        <label className="cd-lbl"><User size={14} /> Logo & Entreprise</label>
                        <div className="cd-row-emoji">
                            <EmojiPicker value={emoji} onChange={setEmoji} />
                            <div className="cd-input-wrap" style={{ flex: 1 }}>
                                <input
                                    {...register('name')}
                                    className={`cd-input ${errors.name ? 'cd-input-error' : ''}`}
                                    placeholder="Ex: Acme Corp"
                                />
                                {errors.name && <p className="cd-error">{errors.name.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="cd-field-group">
                        <label className="cd-lbl"><User size={14} /> Contact Gérant</label>
                        <div className="cd-manager-grid">
                            <select {...register('manager_civility')} className="cd-input cd-select">
                                <option value="">Civilité...</option>
                                <option value="Monsieur">Monsieur</option>
                                <option value="Madame">Madame</option>
                            </select>
                            <input
                                {...register('manager_first_name')}
                                className="cd-input"
                                placeholder="Prénom"
                            />
                            <input
                                {...register('manager_last_name')}
                                className="cd-input"
                                placeholder="Nom"
                            />
                        </div>
                    </div>

                    <div className="cd-field-group">
                        <label className="cd-lbl"><Mail size={14} /> Email entreprise</label>
                        <input
                            type="email"
                            {...register('email')}
                            className={`cd-input ${errors.email ? 'cd-input-error' : ''}`}
                            placeholder="contact@example.com"
                        />
                        {errors.email && <p className="cd-error">{errors.email.message}</p>}
                    </div>

                    <div className="cd-field-group">
                        <label className="cd-lbl"><MapPin size={14} /> Adresse complète</label>
                        <textarea
                            {...register('address')}
                            rows={3}
                            className="cd-input cd-textarea"
                            placeholder="123 Rue de la Paix, 75000 Paris"
                        />
                    </div>

                    <div className="cd-field-group">
                        <label className="cd-lbl"><StickyNote size={14} /> Notes internes</label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            className="cd-input cd-textarea"
                            placeholder="Infos utiles, SIRET, préférences..."
                        />
                    </div>
                </form>

                <div className="cd-footer-bar">
                    <button className="cd-cancel-btn" onClick={onClose} type="button">Annuler</button>
                    <button className="cd-save-btn" onClick={handleSubmit(onSubmit)} disabled={isSaving} type="button">
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Enregistrer
                    </button>
                </div>
            </div>

            <style>{cdDrawerStyles}</style>
        </div>
    );
}

const cdDrawerStyles = `
    .cd-overlay { position: fixed; inset: 0; z-index: 100; display: flex; justify-content: flex-end; }
    .cd-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); animation: fadeIn 0.2s; }
    .cd-panel {
        position: relative; width: 100%; max-width: 550px; height: 100%;
        background: var(--bg-card); border-left: 1px solid var(--border);
        box-shadow: -4px 0 24px rgba(0,0,0,0.1);
        display: flex; flex-direction: column;
    }
    .cd-header-bar {
        padding: 1.5rem; border-bottom: 1px solid var(--border);
        display: flex; justify-content: space-between; align-items: center;
    }
    .cd-header-bar h3 { font-size: 1.125rem; font-weight: 600; margin: 0; }
    .cd-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0.5rem; border-radius: 50%; transition: all 0.2s; display: flex; }
    .cd-close:hover { background: var(--bg-surface-hover); color: var(--text-primary); }

    .cd-body { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; }
    
    .cd-field-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .cd-lbl { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); }
    
    .cd-row-emoji { display: flex; align-items: flex-start; gap: 1rem; }
    .cd-input-wrap { display: flex; flex-direction: column; gap: 0.25rem; }
    
    .cd-manager-grid { display: grid; grid-template-columns: 1fr 1.5fr 1.5fr; gap: 0.75rem; }

    .cd-input {
        width: 100%; padding: 0.625rem 0.875rem;
        background: var(--bg-app); border: 1px solid var(--border);
        border-radius: var(--radius-md); color: var(--text-primary);
        font-size: 0.875rem; transition: all 0.2s; outline: none;
    }
    .cd-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }
    .cd-input-error { border-color: var(--danger); }
    .cd-error { font-size: 0.75rem; color: var(--danger); margin: 0; }
    .cd-textarea { resize: vertical; min-height: 80px; }
    .cd-select { padding-right: 2rem; }

    .cd-footer-bar { padding: 1.5rem; border-top: 1px solid var(--border); background: var(--bg-surface-hover); display: flex; justify-content: flex-end; gap: 0.75rem; }
    .cd-cancel-btn {
        padding: 0.75rem 1.25rem; background: transparent; border: 1px solid var(--border);
        border-radius: var(--radius-md); font-weight: 600; font-size: 0.875rem;
        cursor: pointer; transition: all 0.2s; color: var(--text-secondary);
    }
    .cd-cancel-btn:hover { background: var(--bg-card); color: var(--text-primary); border-color: var(--border-light); }
    
    .cd-save-btn {
        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white; border: none; border-radius: var(--radius-md);
        font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
    }
    .cd-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3); }
    .cd-save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;
