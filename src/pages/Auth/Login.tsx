
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, Lock, Mail, Mountain } from 'lucide-react';
import { clsx } from 'clsx';

const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });
    const [authError, setAuthError] = useState<string | null>(null);

    const onSubmit = async (data: LoginFormData) => {
        setAuthError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            setAuthError(error.message === 'Invalid login credentials'
                ? 'Email ou mot de passe incorrect'
                : error.message);
        }
    };

    return (
        <div className="login-page">
            {/* Left decorative panel */}
            <div className="login-panel-left">
                <div className="login-panel-content animate-fade-in">
                    <div className="login-brand">
                        <div className="login-brand-icon">
                            <Mountain size={28} />
                        </div>
                        <span className="login-brand-text">MOONTAIN</span>
                    </div>
                    <h2 className="login-panel-title">
                        Gérez vos clients,<br />
                        factures & projets<br />
                        <span>en toute simplicité.</span>
                    </h2>
                    <p className="login-panel-subtitle">
                        Votre CRM pensé pour les freelances et agences web.
                    </p>

                    {/* Decorative dots */}
                    <div className="login-dots" aria-hidden="true">
                        {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className="login-dot" style={{
                                animationDelay: `${i * 0.08}s`,
                                opacity: 0.15 + Math.random() * 0.25,
                            }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="login-panel-right">
                <div className="login-form-wrapper animate-slide-up">
                    <div className="login-form-header">
                        <h1>Bon retour 👋</h1>
                        <p>Connectez-vous à votre espace de travail</p>
                    </div>

                    {authError && (
                        <div className="login-error">
                            <AlertCircle size={18} />
                            <p>{authError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="login-form">
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

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="login-submit"
                        >
                            {isSubmitting ? <Loader2 size={20} className="spin" /> : 'Se connecter'}
                        </button>
                    </form>

                    <p className="login-footer">
                        Pas encore de compte ?{' '}
                        <Link to="/register">S'inscrire</Link>
                    </p>
                </div>
            </div>

            <style>{`
                .login-page {
                    display: flex;
                    min-height: 100vh;
                    min-height: 100dvh;
                }

                /* ── Left Panel ─────────────────── */
                .login-panel-left {
                    flex: 1;
                    background: linear-gradient(135deg, #1a1040 0%, #0f172a 40%, #0a0f1e 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    padding: 3rem;
                }

                .login-panel-left::before {
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

                .login-panel-left::after {
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

                .login-panel-content {
                    position: relative;
                    z-index: 1;
                    max-width: 440px;
                }

                .login-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 2.5rem;
                }

                .login-brand-icon {
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

                .login-brand-text {
                    font-size: 1.25rem;
                    font-weight: 800;
                    letter-spacing: 0.04em;
                    background: linear-gradient(to right, var(--primary), var(--secondary));
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .login-panel-title {
                    font-size: 2.25rem;
                    font-weight: 700;
                    line-height: 1.25;
                    color: var(--text-primary);
                    margin-bottom: 1rem;
                }
                .login-panel-title span {
                    background: linear-gradient(to right, var(--primary), var(--secondary));
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .login-panel-subtitle {
                    font-size: 1rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                }

                .login-dots {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 12px;
                    margin-top: 3rem;
                    max-width: 120px;
                }
                .login-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--primary);
                    animation: fadeIn 0.6s ease forwards;
                }

                /* ── Right Panel ────────────────── */
                .login-panel-right {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    background: var(--bg-app);
                }

                .login-form-wrapper {
                    width: 100%;
                    max-width: 400px;
                }

                .login-form-header {
                    margin-bottom: 2rem;
                }
                .login-form-header h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }
                .login-form-header p {
                    color: var(--text-secondary);
                    font-size: 0.9375rem;
                }

                .login-error {
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
                .login-error svg { flex-shrink: 0; }

                .login-form {
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

                .login-submit {
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
                .login-submit:hover:not(:disabled) {
                    box-shadow: 0 4px 20px rgba(139,92,246,0.35);
                    transform: translateY(-1px);
                }
                .login-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .login-footer {
                    text-align: center;
                    margin-top: 2rem;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }
                .login-footer a {
                    color: var(--primary);
                    font-weight: 500;
                    transition: color var(--transition-fast);
                }
                .login-footer a:hover {
                    color: var(--primary-hover);
                    text-decoration: underline;
                }

                /* ── Responsive ─────────────────── */
                @media (max-width: 900px) {
                    .login-page {
                        flex-direction: column;
                    }
                    .login-panel-left {
                        padding: 2rem 1.5rem;
                        min-height: auto;
                    }
                    .login-panel-title {
                        font-size: 1.5rem;
                    }
                    .login-dots { display: none; }
                    .login-panel-right {
                        padding: 2rem 1.5rem;
                    }
                }
                @media (max-width: 480px) {
                    .login-panel-left, .login-panel-right { padding: 1.5rem 1rem; }
                }
            `}</style>
        </div>
    );
}
