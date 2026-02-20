
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

import { ClientsList } from './pages/Clients/ClientsList';
import { ClientDetail } from './pages/Clients/ClientDetail';
import { ServicesList } from './pages/Services/ServicesList';
import { CatalogList } from './pages/Catalog/CatalogList';
import { DocumentsList } from './pages/Documents/DocumentsList';
import { DocumentDetail } from './pages/Documents/DocumentDetail';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />

            <Route path="clients" element={<ClientsList />} />
            <Route path="clients/:id" element={<ClientDetail />} />

            <Route path="catalog" element={<CatalogList />} />

            <Route path="documents" element={<DocumentsList />} />
            <Route path="documents/:id" element={<DocumentDetail />} />

            <Route path="services" element={<ServicesList />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
