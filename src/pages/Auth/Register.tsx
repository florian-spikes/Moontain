
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2, Lock, Mail } from 'lucide-react';
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
            <div className="min-h-screen bg-[--bg-surface] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[--bg-card] rounded-lg shadow-xl border border-[--border] p-8 text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-[--text-primary] mb-4">Inscription réussie !</h2>
                    <p className="text-[--text-secondary] mb-8">
                        Veuillez vérifier votre boîte mail pour confirmer votre adresse.
                        Une fois confirmé, votre compte sera en attente de validation par un administrateur.
                    </p>
                    <Link to="/login" className="inline-block w-full bg-[--primary] hover:bg-[--primary-hover] text-white py-2 rounded-lg font-medium transition-colors">
                        Retour à la connexion
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[--bg-surface] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[--bg-card] rounded-lg shadow-xl border border-[--border] p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[--text-primary] mb-2">Créer un compte</h1>
                    <p className="text-[--text-secondary]">Rejoindre Moontain CRM</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
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

                    <div>
                        <label className="block text-sm font-medium text-[--text-secondary] mb-1">Confirmer mot de passe</label>
                        <div className="relative">
                            <input
                                {...register('confirmPassword')}
                                type="password"
                                className={clsx(
                                    "w-full pl-10 pr-4 py-2 bg-[--bg-surface] border rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary] text-[--text-primary]",
                                    errors.confirmPassword ? "border-red-500" : "border-[--border]"
                                )}
                                placeholder="••••••••"
                            />
                            <Lock className="w-5 h-5 text-[--text-tertiary] absolute left-3 top-2.5" />
                        </div>
                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-[--primary] hover:bg-[--primary-hover] text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "S'inscrire"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-[--text-secondary]">
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-[--primary] hover:underline">
                        Se connecter
                    </Link>
                </div>
            </div>
        </div>
    );
}
