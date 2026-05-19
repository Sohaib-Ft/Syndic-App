import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { authAPI } from '../services/api';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [email] = useState(emailFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password rules validation
  const rules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return toast.error(t.fillAllFields);
    if (!token) return toast.error(t.resetLinkInvalid);
    if (newPassword !== confirmPassword) return toast.error(t.passwordsMismatch);
    if (!isPasswordValid) return toast.error('Le mot de passe ne respecte pas tous les critères.');

    setLoading(true);
    try {
      await authAPI.resetPassword({ email, token, newPassword });
      toast.success('Votre mot de passe a été réinitialisé avec succès !');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || t.resetError);
    } finally {
      setLoading(false);
    }
  };

  // Si le token est manquant ou invalide dans l'URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Lien invalide ou expiré</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Ce lien de réinitialisation n'est plus valide. Veuillez faire une nouvelle demande depuis la page de connexion.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-[#1e3a5f] hover:bg-[#1a3050] text-white rounded-xl font-semibold text-sm transition-all duration-300"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-slate-800 flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-slate-800" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Nouveau mot de passe</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Créez un mot de passe sécurisé d'au moins 8 caractères pour l'adresse <strong className="text-slate-700">{email}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Checklist visuelle du mot de passe */}
            {newPassword && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                <p className="font-semibold text-slate-600 mb-1">Critères du mot de passe :</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${rules.length ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <span className={rules.length ? 'text-emerald-700 font-medium' : 'text-slate-500'}>8 caractères minimum</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${rules.uppercase ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <span className={rules.uppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>Au moins une lettre majuscule</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${rules.number ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <span className={rules.number ? 'text-emerald-700 font-medium' : 'text-slate-500'}>Au moins un chiffre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${rules.special ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <span className={rules.special ? 'text-emerald-700 font-medium' : 'text-slate-500'}>Au moins un caractère spécial</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="reset-confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            id="reset-submit"
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#1e3a5f]/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/login" className="text-sm font-semibold text-slate-800 hover:text-slate-600 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
