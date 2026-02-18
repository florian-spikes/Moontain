
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

import { ClientsList } from './pages/Clients/ClientsList';
import { NewClient } from './pages/Clients/NewClient';
import { ServicesList } from './pages/Services/ServicesList';
import { CatalogList } from './pages/Catalog/CatalogList';
import { NewCatalogItem } from './pages/Catalog/NewCatalogItem';
import { DocumentsList } from './pages/Documents/DocumentsList';
import { NewDocument } from './pages/Documents/NewDocument';
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
            <Route path="clients/new" element={<NewClient />} />

            <Route path="catalog" element={<CatalogList />} />
            <Route path="catalog/new" element={<NewCatalogItem />} />

            <Route path="documents" element={<DocumentsList />} />
            <Route path="documents/new" element={<NewDocument />} />
            <Route path="documents/:id" element={<DocumentDetail />} />

            <Route path="services" element={<ServicesList />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
