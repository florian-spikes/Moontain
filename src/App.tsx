
import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';

import { ClientsList } from './pages/Clients/ClientsList';
import { NewClient } from './pages/Clients/NewClient';
import { ServicesList } from './pages/Services/ServicesList';
import { CatalogList } from './pages/Catalog/CatalogList';
import { NewCatalogItem } from './pages/Catalog/NewCatalogItem';
import { DocumentsList } from './pages/Documents/DocumentsList';
import { NewDocument } from './pages/Documents/NewDocument';
import { DocumentDetail } from './pages/Documents/DocumentDetail';
import { Dashboard } from './pages/Dashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { state: { from: location } });
    }
  }, [session, loading, navigate, location]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[--bg-app] text-[--text-secondary]">Chargement...</div>;
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />



          <Route path="clients" element={<ClientsList />} />
          <Route path="clients/new" element={<NewClient />} />

          <Route path="catalog" element={<CatalogList />} />
          <Route path="catalog/new" element={<NewCatalogItem />} />

          <Route path="documents" element={<DocumentsList />} />
          <Route path="documents/new" element={<NewDocument />} />
          <Route path="documents/:id" element={<DocumentDetail />} />

          <Route path="services" element={<ServicesList />} />

        </Route>
      </Routes>
    </AuthProvider>
  );
}
