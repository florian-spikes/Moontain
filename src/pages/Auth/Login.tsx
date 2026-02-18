
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Lock, Mail } from 'lucide-react';
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
    const navigate = useNavigate();
    const { profile } = useAuth();

    // If user is already logged in and has valid profile, redirect
    React.useEffect(() => {
        if (profile?.role === 'admin' && profile?.status === 'active') {
            navigate('/');
        }
    }, [profile, navigate]);

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
            return;
        }

        // AuthProvider will handle profile fetching and redirection logic via the effect above or inside ProtectedRoute
        // However, to show immediate feedback if profile is invalid, we might need to check manually here too 
        // or rely on user being redirected to '/' and then bounced back if we use a loader.
        // But since state update is async, we can just wait.
    };

    return (
        <div className="min-h-screen bg-[--bg-surface] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[--bg-card] rounded-lg shadow-xl border border-[--border] p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[--text-primary] mb-2">Moontain CRM</h1>
                    <p className="text-[--text-secondary]">Connexion à votre espace</p>
                </div>

                {authError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{authError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[--text-secondary] mb-1">Email</label>
                        <div className="relative">
                            <input
                                {...register('email')}
                                type="email"
                                className={clsx(
                                    "w-full pl-10 pr-4 py-2 bg-[--bg-surface] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary] text-[--text-primary]",
                                    errors.email ? "border-red-500" : "border-[--border]"
                                )}
                                placeholder="vous@exemple.fr"
                            />
                            <Mail className="w-5 h-5 text-[--text-tertiary] absolute left-3 top-2.5" />
                        </div>
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[--text-secondary] mb-1">Mot de passe</label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type="password"
                                className={clsx(
                                    "w-full pl-10 pr-4 py-2 bg-[--bg-surface] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary] text-[--text-primary]",
                                    errors.password ? "border-red-500" : "border-[--border]"
                                )}
                                placeholder="••••••••"
                            />
                            <Lock className="w-5 h-5 text-[--text-tertiary] absolute left-3 top-2.5" />
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-[--primary] hover:bg-[--primary-hover] text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-[--text-secondary]">
                    Pas encore de compte ?{' '}
                    <Link to="/register" className="text-[--primary] hover:underline">
                        S'inscrire
                    </Link>
                </div>
            </div>
        </div>
    );
}
