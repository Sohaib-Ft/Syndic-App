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

// Protection des routes
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user.mustChangePassword) return <Navigate to="/change-password" />;
  return children;
};

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/syndic" /> : <Login />} />
      <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
      <Route path="/change-password" element={isAuthenticated ? <ChangePassword /> : <Navigate to="/login" />} />

      {/* Routes Syndic */}
      <Route path="/syndic" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
