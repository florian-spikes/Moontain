
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2, Lock, Mail, Mountain } from 'lucide-react';
import { clsx } from 'clsx';

const registerSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const onSubmit = async (data: RegisterFormData) => {
        setError(null);
        setSuccess(false);

        const { error: signUpError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });

        if (signUpError) {
            setError(signUpError.message);
            return;
        }

        setSuccess(true);
    };

    if (success) {
        return (
            <div className="register-page">
                <div className="register-panel-left">
                    <div className="register-panel-content animate-fade-in">
                        <div className="register-brand">
                            <div className="register-brand-icon"><Mountain size={28} /></div>
                            <span className="register-brand-text">MOONTAIN</span>
                        </div>
                        <h2 className="register-panel-title">
                            Bienvenue dans<br />
                            <span>l'aventure.</span>
                        </h2>
                    </div>
                </div>
                <div className="register-panel-right">
                    <div className="register-form-wrapper animate-slide-up" style={{ textAlign: 'center' }}>
                        <div className="success-icon">
                            <CheckCircle size={40} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Inscription réussie !</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
                            Veuillez vérifier votre boîte mail pour confirmer votre adresse.
                            Une fois confirmé, votre compte sera en attente de validation par un administrateur.
                        </p>
                        <Link to="/login" className="register-submit" style={{ textDecoration: 'none' }}>
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
                <style>{registerStyles}</style>
            </div>
        );
    }

    return (
        <div className="register-page">
            {/* Left decorative panel */}
            <div className="register-panel-left">
                <div className="register-panel-content animate-fade-in">
                    <div className="register-brand">
                        <div className="register-brand-icon"><Mountain size={28} /></div>
                        <span className="register-brand-text">MOONTAIN</span>
                    </div>
                    <h2 className="register-panel-title">
                        Rejoignez une<br />
                        gestion client<br />
                        <span>intelligente.</span>
                    </h2>
                    <p className="register-panel-subtitle">
                        Créez votre compte en quelques secondes.
                    </p>

                    <div className="register-dots" aria-hidden="true">
                        {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className="register-dot" style={{
                                animationDelay: `${i * 0.08}s`,
                                opacity: 0.15 + Math.random() * 0.25,
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="register-panel-right">
                <div className="register-form-wrapper animate-slide-up">
                    <div className="register-form-header">
                        <h1>Créer un compte</h1>
                        <p>Commencez à gérer vos projets dès maintenant</p>
                    </div>

                    {error && (
                        <div className="register-error">
                            <AlertCircle size={18} />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="register-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={18} />
                                <input
                                    {...register('email')}
                                    id="email"
                                    type="email"
                                    className={clsx(errors.email && 'input-error')}
                                    placeholder="vous@exemple.fr"
                                />
                            </div>
                            {errors.email && <p className="field-error">{errors.email.message}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Mot de passe</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    {...register('password')}
                                    id="password"
                                    type="password"
                                    className={clsx(errors.password && 'input-error')}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="field-error">{errors.password.message}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    {...register('confirmPassword')}
                                    id="confirmPassword"
                                    type="password"
                                    className={clsx(errors.confirmPassword && 'input-error')}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="register-submit"
                        >
                            {isSubmitting ? <Loader2 size={20} className="spin" /> : "S'inscrire"}
                        </button>
                    </form>

                    <p className="register-footer">
                        Déjà un compte ?{' '}
                        <Link to="/login">Se connecter</Link>
                    </p>
                </div>
            </div>

            <style>{registerStyles}</style>
        </div>
    );
}

const registerStyles = `
    .register-page {
        display: flex;
        min-height: 100vh;
        min-height: 100dvh;
    }

    .register-panel-left {
        flex: 1;
        background: linear-gradient(135deg, #1a1040 0%, #0f172a 40%, #0a0f1e 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        padding: 3rem;
    }
    .register-panel-left::before {
        content: '';
        position: absolute;
        top: -30%;
        left: -20%;
        width: 60%;
        height: 60%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
        pointer-events: none;
    }
    .register-panel-left::after {
        content: '';
        position: absolute;
        bottom: -20%;
        right: -10%;
        width: 50%;
        height: 50%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
        pointer-events: none;
    }

    .register-panel-content {
        position: relative;
        z-index: 1;
        max-width: 440px;
    }

    .register-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 2.5rem;
    }
    .register-brand-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 16px rgba(139,92,246,0.3);
    }
    .register-brand-text {
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        background: linear-gradient(to right, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .register-panel-title {
        font-size: 2.25rem;
        font-weight: 700;
        line-height: 1.25;
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
    .register-panel-title span {
        background: linear-gradient(to right, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .register-panel-subtitle {
        font-size: 1rem;
        color: var(--text-secondary);
        line-height: 1.6;
    }

    .register-dots {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
        margin-top: 3rem;
        max-width: 120px;
    }
    .register-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--primary);
        animation: fadeIn 0.6s ease forwards;
    }

    .register-panel-right {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        background: var(--bg-app);
    }

    .register-form-wrapper {
        width: 100%;
        max-width: 400px;
    }

    .register-form-header {
        margin-bottom: 2rem;
    }
    .register-form-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    .register-form-header p {
        color: var(--text-secondary);
        font-size: 0.9375rem;
    }

    .register-error {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        background: rgba(239,68,68,0.08);
        border: 1px solid rgba(239,68,68,0.15);
        border-radius: var(--radius-lg);
        color: #f87171;
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
    }
    .register-error svg { flex-shrink: 0; }

    .register-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
    }
    .input-wrapper {
        position: relative;
    }
    .input-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        pointer-events: none;
    }
    .input-wrapper input {
        padding-left: 2.75rem;
    }
    .input-error {
        border-color: var(--danger) !important;
    }
    .field-error {
        font-size: 0.8125rem;
        color: #f87171;
        margin-top: 0.375rem;
    }

    .register-submit {
        width: 100%;
        padding: 0.75rem;
        margin-top: 0.5rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: var(--radius-lg);
        border: none;
        cursor: pointer;
        transition: all var(--transition-smooth);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    .register-submit:hover:not(:disabled) {
        box-shadow: 0 4px 20px rgba(139,92,246,0.35);
        transform: translateY(-1px);
    }
    .register-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .success-icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: rgba(16,185,129,0.1);
        color: var(--success);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
    }

    .register-footer {
        text-align: center;
        margin-top: 2rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    .register-footer a {
        color: var(--primary);
        font-weight: 500;
        transition: color var(--transition-fast);
    }
    .register-footer a:hover {
        color: var(--primary-hover);
        text-decoration: underline;
    }

    @media (max-width: 900px) {
        .register-page { flex-direction: column; }
        .register-panel-left { padding: 2rem 1.5rem; min-height: auto; }
        .register-panel-title { font-size: 1.5rem; }
        .register-dots { display: none; }
        .register-panel-right { padding: 2rem 1.5rem; }
    }
    @media (max-width: 480px) {
        .register-panel-left, .register-panel-right { padding: 1.5rem 1rem; }
    }
`;
