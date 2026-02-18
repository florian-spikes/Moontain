
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

export default function PublicRoute() {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[--bg-surface]">
                <Loader2 className="w-8 h-8 animate-spin text-[--primary]" />
            </div>
        );
    }

    if (session) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
