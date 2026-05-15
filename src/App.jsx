import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import SyndicDashboard from './pages/syndic/Dashboard';
import Appartements from './pages/syndic/Appartements';
import Residents from './pages/syndic/Residents';
import Paiements from './pages/syndic/Paiements';
import Annonces from './pages/syndic/Annonces';
import Charges from './pages/syndic/Charges';
import ResidentDashboard from './pages/resident/Dashboard';
import MesPaiements from './pages/resident/MesPaiements';
import ResidentAnnonces from './pages/resident/Annonces';

// Protection des routes
const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'SYNDIC' ? '/syndic' : '/resident'} />;
  return children;
};

function App() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={user.role === 'SYNDIC' ? '/syndic' : '/resident'} /> : <Login />} />

      {/* Routes Syndic */}
      <Route path="/syndic" element={<ProtectedRoute role="SYNDIC"><Layout /></ProtectedRoute>}>
        <Route index element={<SyndicDashboard />} />
        <Route path="appartements" element={<Appartements />} />
        <Route path="residents" element={<Residents />} />
        <Route path="paiements" element={<Paiements />} />
        <Route path="annonces" element={<Annonces />} />
        <Route path="charges" element={<Charges />} />
      </Route>

      {/* Routes Résident */}
      <Route path="/resident" element={<ProtectedRoute role="RESIDENT"><Layout /></ProtectedRoute>}>
        <Route index element={<ResidentDashboard />} />
        <Route path="paiements" element={<MesPaiements />} />
        <Route path="annonces" element={<ResidentAnnonces />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
