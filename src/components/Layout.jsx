import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import {
  LayoutDashboard, Building2, Users, CreditCard, Megaphone, Receipt,
  LogOut, Menu, X, ChevronRight, Building, Globe
} from 'lucide-react';

const langLabels = { fr: 'FR', en: 'EN', ar: 'AR' };
const langFlags = { fr: '🇫🇷', en: '🇬🇧', ar: '🇲🇦' };

export default function Layout() {
  const { user, logout } = useAuth();
  const { lang, t, switchLang } = useLang();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const menu = [
    { path: '/syndic', label: t.dashboard, icon: LayoutDashboard, end: true },
    { path: '/syndic/appartements', label: t.apartments, icon: Building2 },
    { path: '/syndic/residents', label: t.residents, icon: Users },
    { path: '/syndic/paiements', label: t.payments, icon: CreditCard },
    { path: '/syndic/annonces', label: t.announcements, icon: Megaphone },
    { path: '/syndic/charges', label: t.charges, icon: Receipt },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dateLocale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div className="flex h-screen bg-slate-100">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">SyndicPro</h1>
            <p className="text-xs text-blue-200/70">{t.coManagement}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 hover:bg-white/10 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm font-bold shadow">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-blue-200/60">{t.admin}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                    : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1" />

          {/* Language switcher */}
          <div className="relative">
            <button onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors">
              <Globe className="w-4 h-4" />
              <span>{langFlags[lang]} {langLabels[lang]}</span>
            </button>
            {langMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 min-w-[140px]">
                  {Object.keys(langLabels).map(code => (
                    <button key={code} onClick={() => { switchLang(code); setLangMenuOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${lang === code ? 'text-[#1e3a5f] font-semibold bg-blue-50/50' : 'text-slate-600'}`}>
                      <span className="text-lg">{langFlags[code]}</span>
                      <span>{code === 'fr' ? 'Français' : code === 'en' ? 'English' : 'العربية'}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hidden sm:inline">{new Date().toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
