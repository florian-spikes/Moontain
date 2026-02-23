import { useState, useEffect } from 'react';
import { X, Send, Plus, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface EmailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: { to: string[], cc: string[], bcc: string[] }) => Promise<void>;
    initialTo: string;
    documentNumber: string;
    type: 'invoice' | 'quote';
    isSending: boolean;
    titleOverride?: string;
}

export function EmailDrawer({ isOpen, onClose, onSend, initialTo, documentNumber, type, isSending, titleOverride }: EmailDrawerProps) {
    const [to, setTo] = useState<string[]>([initialTo]);
    const [cc, setCc] = useState<string[]>([]);
    const [bcc, setBcc] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [addField, setAddField] = useState<'to' | 'cc' | 'bcc' | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setTo([initialTo]);
            setCc([]);
            setBcc([]);
            setNewEmail('');
            setAddField(null);
            setError(null);
        }
    }, [isOpen, initialTo]);

    if (!isOpen) return null;

    const handleAddEmail = (field: 'to' | 'cc' | 'bcc') => {
        if (!newEmail) {
            setAddField(null);
            return;
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            setError('Email invalide');
            return;
        }

        if (field === 'to') setTo([...to, newEmail]);
        if (field === 'cc') setCc([...cc, newEmail]);
        if (field === 'bcc') setBcc([...bcc, newEmail]);

        setNewEmail('');
        setAddField(null);
        setError(null);
    };

    const removeEmail = (field: 'to' | 'cc' | 'bcc', index: number) => {
        if (field === 'to') {
            if (to.length <= 1) {
                setError('Il faut au moins un destinataire principal');
                return;
            }
            setTo(to.filter((_, i) => i !== index));
        }
        if (field === 'cc') setCc(cc.filter((_, i) => i !== index));
        if (field === 'bcc') setBcc(bcc.filter((_, i) => i !== index));
        setError(null);
    };

    const handleSend = async () => {
        if (to.length === 0) {
            setError('Veuillez ajouter un destinataire');
            return;
        }
        try {
            await onSend({ to, cc, bcc });
            onClose();
        } catch (e) {
            setError('Erreur lors de l\'envoi');
        }
    };

    return (
        <div className="ed-overlay">
            <div className="ed-backdrop" onClick={onClose} />
            <div className="ed-panel animate-slide-in-right">
                <div className="ed-header">
                    <h3>{titleOverride || `Envoyer ${type === 'invoice' ? 'la facture' : 'le devis'} ${documentNumber}`}</h3>
                    <button onClick={onClose} className="ed-close"><X size={20} /></button>
                </div>

                <div className="ed-body">
                    {error && (
                        <div className="ed-error">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="ed-field-group">
                        <label>À :</label>
                        <div className="ed-chips">
                            {to.map((email, i) => (
                                <div key={i} className="ed-chip">
                                    {email}
                                    <button onClick={() => removeEmail('to', i)}><X size={12} /></button>
                                </div>
                            ))}
                            <button className="ed-add-btn" onClick={() => setAddField('to')}><Plus size={14} /></button>
                        </div>
                    </div>
                    {addField === 'to' && (
                        <div className="ed-input-row">
                            <input
                                autoFocus
                                className="ed-input"
                                placeholder="email@exemple.com"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddEmail('to'); if (e.key === 'Escape') setAddField(null); }}
                            />
                            <button className="ed-btn-sm" onClick={() => handleAddEmail('to')}>OK</button>
                        </div>
                    )}

                    <div className="ed-field-group">
                        <label>Cc :</label>
                        <div className="ed-chips">
                            {cc.map((email, i) => (
                                <div key={i} className="ed-chip">
                                    {email}
                                    <button onClick={() => removeEmail('cc', i)}><X size={12} /></button>
                                </div>
                            ))}
                            <button className="ed-add-btn" onClick={() => setAddField('cc')}><Plus size={14} /></button>
                        </div>
                    </div>
                    {addField === 'cc' && (
                        <div className="ed-input-row">
                            <input
                                autoFocus
                                className="ed-input"
                                placeholder="email@exemple.com"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddEmail('cc'); if (e.key === 'Escape') setAddField(null); }}
                            />
                            <button className="ed-btn-sm" onClick={() => handleAddEmail('cc')}>OK</button>
                        </div>
                    )}

                    <div className="ed-field-group">
                        <label>Cci :</label>
                        <div className="ed-chips">
                            {bcc.map((email, i) => (
                                <div key={i} className="ed-chip">
                                    {email}
                                    <button onClick={() => removeEmail('bcc', i)}><X size={12} /></button>
                                </div>
                            ))}
                            <button className="ed-add-btn" onClick={() => setAddField('bcc')}><Plus size={14} /></button>
                        </div>
                    </div>
                    {addField === 'bcc' && (
                        <div className="ed-input-row">
                            <input
                                autoFocus
                                className="ed-input"
                                placeholder="email@exemple.com"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddEmail('bcc'); if (e.key === 'Escape') setAddField(null); }}
                            />
                            <button className="ed-btn-sm" onClick={() => handleAddEmail('bcc')}>OK</button>
                        </div>
                    )}
                </div>

                <div className="ed-footer">
                    <button className="ed-send-btn" onClick={handleSend} disabled={isSending}>
                        {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        Envoyer
                    </button>
                </div>
            </div>

            <style>{edStyles}</style>
        </div>
    );
}

const edStyles = `
    .ed-overlay { position: fixed; inset: 0; z-index: 100; display: flex; justify-content: flex-end; }
    .ed-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); animation: fadeIn 0.2s; }
    .ed-panel {
        position: relative; width: 100%; max-width: 500px; height: 100dvh; max-height: 100dvh;
        background: var(--bg-card); border-left: 1px solid var(--border);
        box-shadow: -4px 0 24px rgba(0,0,0,0.1);
        display: flex; flex-direction: column;
    }
    .ed-header {
        padding: 1.5rem; border-bottom: 1px solid var(--border);
        display: flex; justify-content: space-between; align-items: center;
    }
    .ed-header h3 { font-size: 1.125rem; font-weight: 600; margin: 0; }
    .ed-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0.5rem; border-radius: 50%; transition: all 0.2s; display: flex; }
    .ed-close:hover { background: var(--bg-surface-hover); color: var(--text-primary); }

    .ed-body { flex: 1; padding: 1.5rem; overflow-y: auto; }
    .ed-field-group { margin-bottom: 1.5rem; }
    .ed-field-group label { display: block; font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; }
    
    .ed-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; min-height: 38px; padding: 0.25rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg-main); transition: border-color 0.2s; }
    .ed-chip {
        display: inline-flex; align-items: center; gap: 0.375rem;
        padding: 0.25rem 0.625rem; background: var(--bg-surface-hover);
        border-radius: 999px; font-size: 0.8125rem; color: var(--text-primary); border: 1px solid var(--border);
    }
    .ed-chip button { display: flex; border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 0; border-radius: 50%; }
    .ed-chip button:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    
    .ed-add-btn {
        width: 24px; height: 24px; border-radius: 50%; border: 1px dashed var(--border);
        background: none; color: var(--text-muted); display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.2s;
    }
    .ed-add-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }

    .ed-input-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; animation: slideDown 0.2s; }
    .ed-input { flex: 1; padding: 0.5rem; border: 1px solid var(--primary); border-radius: var(--radius-md); font-size: 0.875rem; outline: none; background: var(--bg-card); color: var(--text-primary); }
    .ed-btn-sm { padding: 0 1rem; background: var(--primary); color: white; border: none; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }

    .ed-footer { padding: 1.5rem; border-top: 1px solid var(--border); background: var(--bg-surface-hover); }
    .ed-send-btn {
        width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        padding: 0.875rem; background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white; border: none; border-radius: var(--radius-lg);
        font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
    }
    .ed-send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3); }
    .ed-send-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    .ed-error {
        margin-bottom: 1rem; padding: 0.75rem; background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-md);
        color: #ef4444; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;
    }

    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 480px) {
        .ed-header { padding: 1rem; }
        .ed-body { padding: 1rem; }
        .ed-footer { padding: 1rem; padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
        .ed-panel { max-width: 100%; }
    }
`;
