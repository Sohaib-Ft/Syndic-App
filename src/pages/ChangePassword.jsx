import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Save, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Les mots de passe ne correspondent pas.');
    }
    if (password.length < 8) {
      return toast.error('Le mot de passe doit contenir au moins 8 caractères.');
    }
    setLoading(true);
    try {
      await authAPI.changePassword({ newPassword: password });
      toast.success('Mot de passe changé avec succès !');
      // Update local storage user mustChangePassword to false so App.jsx doesn't redirect
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Reload to update AuthContext state
      window.location.href = user.role === 'SYNDIC' ? '/syndic' : '/resident';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800">
          Changement obligatoire
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Pour des raisons de sécurité, veuillez choisir un nouveau mot de passe.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nouveau mot de passe</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all"
                placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmer le mot de passe</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all"
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] hover:shadow-lg transition-all disabled:opacity-70">
              {loading ? 'Enregistrement...' : <><Save className="w-5 h-5 mr-2" /> Valider</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
