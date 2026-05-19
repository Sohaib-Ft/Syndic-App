import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { authAPI } from '../services/api';
import { Building, Mail, Lock, Eye, EyeOff, LogIn, Globe, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const langFlags = { fr: '🇫🇷', en: '🇬🇧', ar: '🇲🇦' };

export default function Login() {
  const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  // Force change password state
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);

  const { login, googleLogin } = useAuth();
  const { lang, t, switchLang } = useLang();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const user = await googleLogin(credentialResponse.credential);
      // store email for next time
      if (user.email) {
        localStorage.setItem('rememberedEmail', user.email);
        setEmail(user.email);
      }
      
      // user object holds role, prenom
      if (user.mustChangePassword) {
        setLoggedUser(user);
        setMustChangePassword(true);
        toast('🔒 Vous devez changer votre mot de passe', { icon: '⚠️' });
      } else {
        toast.success(`${t.welcome}, ${user.prenom} !`);
        navigate(user.role === 'SYNDIC' ? '/dashboard/syndic' : '/dashboard/resident');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la connexion Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error(t.fillAllFields);
    setLoading(true);
    try {
      const user = await login(email, password);
      // store email for next time
      localStorage.setItem('rememberedEmail', email);

      if (user.mustChangePassword) {
        setLoggedUser(user);
        setMustChangePassword(true);
        toast('🔒 Vous devez changer votre mot de passe', { icon: '⚠️' });
      } else {
        toast.success(`${t.welcome}, ${user.prenom} !`);
        navigate(user.role === 'SYNDIC' ? '/dashboard/syndic' : '/dashboard/resident');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t.loginError);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return toast.error(t.fillAllFields);
    if (newPassword !== confirmPassword) return toast.error(t.passwordsMismatch);
    if (newPassword.length < 6) return toast.error('Le mot de passe doit contenir au moins 6 caractères');
    setChangeLoading(true);
    try {
      await authAPI.changePassword({ newPassword });
      const updatedUser = { ...loggedUser, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Mot de passe modifié avec succès !');
      navigate(updatedUser.role === 'SYNDIC' ? '/dashboard/syndic' : '/dashboard/resident');
    } catch (error) {
      toast.error(error.response?.data?.message || t.error);
    } finally {
      setChangeLoading(false);
    }
  };

  const openReset = () => {
    setResetEmail(email);
    setShowReset(true);
  };

  const closeReset = () => {
    setShowReset(false);
    setIsEmailSent(false);
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (!resetEmail) return toast.error(t.fillAllFields);
    setResetLoading(true);
    try {
      await authAPI.forgotPassword({ email: resetEmail });
      toast.success(t.resetEmailSent);
      setIsEmailSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || t.resetEmailError);
    } finally {
      setResetLoading(false);
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
          <p className="text-lg text-blue-200/70 leading-relaxed">{t.brandDesc}</p>
          <div className="grid grid-cols-3 gap-4 pt-8">
            {[{ val: '10+', lab: t.apartments }, { val: '8+', lab: t.residents }, { val: '99%', lab: t.reliability }].map((s,i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-amber-400">{s.val}</p>
                <p className="text-xs text-blue-200/50 mt-1">{s.lab}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Building className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">SyndicPro</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            {/* === FORCE CHANGE PASSWORD === */}
            {mustChangePassword ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Changement obligatoire</h2>
                  <p className="text-slate-500 mt-2">Choisissez un nouveau mot de passe sécurisé pour continuer.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all text-sm"
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t.confirmPassword}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all text-sm"
                        placeholder="••••••••" />
                    </div>
                  </div>

                  <button type="submit" disabled={changeLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                    {changeLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Changer le mot de passe</>}
                  </button>
                </form>
              </>

            /* === RESET PASSWORD === */
            ) : showReset ? (
              isEmailSent ? (
                <div className="text-center py-4 space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center animate-bounce">
                    <Mail className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800">Consultez votre boîte mail</h2>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      Nous avons envoyé un lien de réinitialisation de mot de passe à l'adresse <strong className="text-slate-800">{resetEmail}</strong>.
                    </p>
                  </div>
                  <div className="space-y-3 pt-4">
                    <a
                      href="https://mail.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-[#1e3a5f] hover:bg-[#1a3050] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#1e3a5f]/25 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      Ouvrir Gmail
                    </a>
                    <button
                      type="button"
                      onClick={closeReset}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all duration-300"
                    >
                      {t.backToLogin}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full border-2 border-slate-800 flex items-center justify-center mb-4">
                      <Lock className="w-10 h-10 text-slate-800" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Problèmes de connexion ?</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                      Entrez votre adresse e-mail et nous vous enverrons un lien pour récupérer votre compte.
                    </p>
                  </div>

                  <form onSubmit={handleResetRequest} className="space-y-4">
                    <div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="reset-email"
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all text-sm"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>

                    <button
                      id="reset-submit"
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#1e3a5f]/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {resetLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Envoyer le lien de connexion"}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={closeReset}
                      className="text-sm font-semibold text-slate-800 hover:text-slate-600 transition-colors"
                    >
                      {t.backToLogin}
                    </button>
                  </div>
                </div>
              )

            /* === LOGIN === */
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-800">{t.login}</h2>
                  <p className="text-slate-500 mt-2">{t.loginSubtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t.email}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all text-sm"
                        placeholder="votre@email.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all text-sm"
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={openReset}
                      className="text-sm text-slate-500 hover:text-[#1e3a5f] transition-colors"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>

                  <button id="login-submit" type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#1e3a5f]/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-5 h-5" /> {t.signIn}</>}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <p className="text-sm text-slate-600">
                    Vous n'avez pas de compte ?{' '}
                    <Link to="/register" className="text-[#1e3a5f] hover:underline font-semibold">
                      Créer un compte
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
