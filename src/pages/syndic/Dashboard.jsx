import { useState, useEffect } from 'react';
import { dashboardAPI, paiementAPI } from '../../services/api';
import { Building2, Users, CreditCard, AlertTriangle, TrendingUp, Megaphone, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#1e3a5f', '#e8a838', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function SyndicDashboard() {
  const [data, setData] = useState(null);
  const [statsChart, setStatsChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, statsRes] = await Promise.all([dashboardAPI.syndic(), paiementAPI.statsMensuel()]);
      setData(dashRes.data);
      setStatsChart(statsRes.data);
    } catch (error) {
      toast.error('Erreur de chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;
  if (!data) return <div className="text-center py-20 text-slate-500">Aucune donnée disponible</div>;

  const kpis = [
    { label: 'Appartements', value: data.kpis.totalAppartements, icon: Building2, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: 'Résidents actifs', value: data.kpis.residentsActifs, icon: Users, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Encaissé ce mois', value: `${data.kpis.totalEncaisseMois.toLocaleString('fr-FR')} DH`, icon: CreditCard, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
    { label: 'Impayés ce mois', value: `${data.kpis.impayesMois.toLocaleString('fr-FR')} DH`, icon: AlertTriangle, color: 'from-red-500 to-rose-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Vue d'ensemble de votre copropriété</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{kpi.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${kpi.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paiements reçus vs attendus */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1e3a5f]" /> Paiements (12 derniers mois)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v.toLocaleString('fr-FR')} DH`} />
              <Legend />
              <Bar dataKey="totalAttendu" fill="#cbd5e1" name="Attendu" radius={[4,4,0,0]} />
              <Bar dataKey="totalPaye" fill="#1e3a5f" name="Reçu" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dernières annonces */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#1e3a5f]" /> Dernières annonces
          </h3>
          <div className="space-y-3">
            {data.dernieresAnnonces.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune annonce</p>
            ) : data.dernieresAnnonces.map((a) => {
              const catColors = { INFO: 'bg-blue-100 text-blue-700', URGENT: 'bg-red-100 text-red-700', TRAVAUX: 'bg-amber-100 text-amber-700', ASSEMBLEE: 'bg-purple-100 text-purple-700' };
              return (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${catColors[a.categorie] || 'bg-slate-100 text-slate-600'}`}>{a.categorie}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{a.titre}</p>
                    <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers paiements */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> Derniers paiements reçus
          </h3>
          <div className="space-y-3">
            {data.derniersPaiements.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucun paiement</p>
            ) : data.derniersPaiements.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.resident.prenom} {p.resident.nom}</p>
                    <p className="text-xs text-slate-400">Appt. {p.appartement.numero}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{p.montant.toLocaleString('fr-FR')} DH</p>
                  <p className="text-xs text-slate-400">{p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Résidents en retard */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" /> Résidents en retard
          </h3>
          <div className="space-y-3">
            {data.residentsEnRetard.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Tous les paiements sont à jour !</p>
              </div>
            ) : data.residentsEnRetard.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.resident.prenom} {p.resident.nom}</p>
                    <p className="text-xs text-slate-400">{moisNoms[p.mois]} {p.annee} - Appt. {p.appartement.numero}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-500">{p.montant.toLocaleString('fr-FR')} DH</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
