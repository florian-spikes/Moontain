
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2, Lock } from 'lucide-react';

export default function ProtectedRoute() {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[--bg-surface]">
                <Loader2 className="w-8 h-8 animate-spin text-[--primary]" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If profile is still loading for some reason but user exists, show loader
    // (However, AuthProvider handles profile fetching within its loading state, so we should have profile or null here)

    if (!profile) {
        // User exists in Auth but not in Profiles table (shouldn't happen with trigger, but just in case)
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[--bg-surface] p-4">
                <div className="max-w-md text-center p-8 bg-[--bg-card] rounded-lg border border-[--border] shadow-lg">
                    <Lock className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Profil introuvable</h2>
                    <p className="text-[--text-secondary]">Impossible de récupérer votre profil utilisateur. Veuillez contacter l'administrateur.</p>
                </div>
            </div>
        );
    }

    if (profile.role !== 'admin' || profile.status !== 'active') {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[--bg-surface] p-4">
                <div className="max-w-md text-center p-8 bg-[--bg-card] rounded-lg border border-[--border] shadow-lg">
                    <Lock className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Accès restreint</h2>
                    <p className="text-[--text-secondary] mb-6">
                        Votre compte est actuellement
                        <span className="font-semibold text-[--text-primary]"> {profile.status === 'pending' ? 'en attente de validation' : 'désactivé'}</span>.
                        <br /><br />
                        Seuls les administrateurs actifs peuvent accéder à cette application.
                    </p>
                    <div className="text-sm text-[--text-tertiary]">
                        Email: {profile.email}<br />
                        Role: {profile.role}<br />
                        Status: {profile.status}
                    </div>
                </div>
            </div>
        );
    }

    return <Outlet />;
}
