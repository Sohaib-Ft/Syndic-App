import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Layout from './components/Layout';
import SyndicDashboard from './pages/syndic/Dashboard';
import Appartements from './pages/syndic/Appartements';
import AppartementForm from './pages/syndic/AppartementForm';
import Residents from './pages/syndic/Residents';
import ResidentForm from './pages/syndic/ResidentForm';
import Paiements from './pages/syndic/Paiements';
import Annonces from './pages/syndic/Annonces';
import AnnonceForm from './pages/syndic/AnnonceForm';
import Charges from './pages/syndic/Charges';
import ChargeForm from './pages/syndic/ChargeForm';
import ResidentDashboard from './pages/resident/Dashboard';
import MesPaiements from './pages/resident/MesPaiements';
import ResidentAnnonces from './pages/resident/Annonces';
import MesCharges from './pages/resident/MesCharges';

// Protection des routes
const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'SYNDIC' ? '/syndic' : '/resident'} />;
  if (user.mustChangePassword) return <Navigate to="/change-password" />;
  return children;
};

function App() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={user.role === 'SYNDIC' ? '/syndic' : '/resident'} /> : <Login />} />
      <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
      <Route path="/change-password" element={isAuthenticated ? <ChangePassword /> : <Navigate to="/login" />} />

      {/* Routes Syndic */}
      <Route path="/syndic" element={<ProtectedRoute role="SYNDIC"><Layout /></ProtectedRoute>}>
        <Route index element={<SyndicDashboard />} />
        <Route path="appartements" element={<Appartements />} />
        <Route path="appartements/nouveau" element={<AppartementForm />} />
        <Route path="appartements/edit/:id" element={<AppartementForm />} />
        <Route path="residents" element={<Residents />} />
        <Route path="residents/nouveau" element={<ResidentForm />} />
        <Route path="residents/edit/:id" element={<ResidentForm />} />
        <Route path="paiements" element={<Paiements />} />
        <Route path="annonces" element={<Annonces />} />
        <Route path="annonces/nouveau" element={<AnnonceForm />} />
        <Route path="annonces/edit/:id" element={<AnnonceForm />} />
        <Route path="charges" element={<Charges />} />
        <Route path="charges/nouveau" element={<ChargeForm />} />
        <Route path="charges/edit/:id" element={<ChargeForm />} />
      </Route>

      {/* Routes Résident */}
      <Route path="/resident" element={<ProtectedRoute role="RESIDENT"><Layout /></ProtectedRoute>}>
        <Route index element={<ResidentDashboard />} />
        <Route path="paiements" element={<MesPaiements />} />
        <Route path="charges" element={<MesCharges />} />
        <Route path="annonces" element={<ResidentAnnonces />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
