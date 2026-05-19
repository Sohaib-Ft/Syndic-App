import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Building, Mail, Lock, Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

export default function Register() {
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { googleLogin, login } = useAuth();
  const navigate = useNavigate();

  // Password rules validation
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const user = await googleLogin(credentialResponse.credential);
      toast.success(`Bienvenue, ${user.prenom} !`);
      navigate('/syndic');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la connexion Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomComplet || !email || !password || !confirmPassword) {
      return toast.error('Veuillez remplir tous les champs.');
    }
    if (password !== confirmPassword) {
      return toast.error('Les mots de passe ne correspondent pas.');
    }
    if (!isPasswordValid) {
      return toast.error('Le mot de passe ne respecte pas tous les critères.');
    }

    setLoading(true);
    try {
      const response = await authAPI.register({ email, password, nomComplet });
      // Automatiquement logger l'utilisateur après inscription en sauvegardant le token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Recharger le contexte utilisateur (nous pouvons utiliser login ou getMe)
      window.location.href = '/syndic';
      toast.success('Compte créé avec succès !');
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e3a5f] via-[#1a3050] to-[#0f1f35] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center space-y-8 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">SyndicPro</h1>
          <p className="text-lg text-blue-200/70 leading-relaxed">
            Créez votre compte syndic et commencez à gérer vos résidences, appartements et charges en toute simplicité.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 relative overflow-y-auto">
        <div className="w-full max-w-md my-8">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Building className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">SyndicPro</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Créer mon compte</h2>
              <p className="text-slate-500 mt-2">Inscrivez votre syndic gratuitement</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nomComplet}
                    onChange={(e) => setNomComplet(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all text-sm"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all text-sm"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {password && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                    <p className="font-semibold text-slate-600 mb-1">Critères du mot de passe :</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${rules.length ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      <span className={rules.length ? 'text-emerald-700' : 'text-slate-500'}>8 caractères minimum</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${rules.uppercase ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      <span className={rules.uppercase ? 'text-emerald-700' : 'text-slate-500'}>Au moins une lettre majuscule</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${rules.number ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      <span className={rules.number ? 'text-emerald-700' : 'text-slate-500'}>Au moins un chiffre</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${rules.special ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      <span className={rules.special ? 'text-emerald-700' : 'text-slate-500'}>Au moins un caractère spécial</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
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
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full py-3 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#1e3a5f]/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" /> Créer mon compte
                  </>
                )}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Ou</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Échec de la connexion Google')}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signup_with"
                  shape="rectangular"
                />
              </div>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-slate-600">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="text-[#1e3a5f] hover:underline font-semibold">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
