import { useState, useEffect } from 'react';
import { paiementAPI } from '../../services/api';
import { CreditCard, Check, Filter, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function Paiements() {
  const [paiements, setPaiements] = useState([]);
  const [stats, setStats] = useState([]);
  const [statsAnnuel, setStatsAnnuel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ mois: '', annee: new Date().getFullYear().toString(), statut: '' });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pRes, sRes, aRes] = await Promise.all([
        paiementAPI.getAll(filters),
        paiementAPI.statsMensuel(),
        paiementAPI.statsAnnuel(new Date().getFullYear())
      ]);
      setPaiements(pRes.data);
      setStats(sRes.data);
      setStatsAnnuel(aRes.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  const applyFilters = async () => {
    try {
      const params = {};
      if (filters.mois) params.mois = filters.mois;
      if (filters.annee) params.annee = filters.annee;
      if (filters.statut) params.statut = filters.statut;
      const { data } = await paiementAPI.getAll(params);
      setPaiements(data);
    } catch { toast.error('Erreur'); }
  };

  const handleValider = async (id) => {
    try {
      await paiementAPI.valider(id);
      toast.success('Paiement validé');
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const handleGenerer = async () => {
    const mois = new Date().getMonth() + 1;
    const annee = new Date().getFullYear();
    if (!confirm(`Générer les paiements pour ${moisNoms[mois]} ${annee} ?`)) return;
    try {
      const { data } = await paiementAPI.generer({ mois, annee });
      toast.success(data.message);
      loadData();
    } catch (error) { toast.error(error.response?.data?.message || 'Erreur'); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Paiements</h1>
          <p className="text-slate-500 mt-1">Gestion des charges mensuelles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all">
            <TrendingUp className="w-4 h-4" /> Statistiques
          </button>
          <button onClick={handleGenerer} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
            <Calendar className="w-4 h-4" /> Générer le mois
          </button>
        </div>
      </div>

      {/* Stats annuelles */}
      {statsAnnuel && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total encaissé', value: `${statsAnnuel.totalPaye.toLocaleString('fr-FR')} DH`, color: 'text-emerald-600' },
            { label: 'Total attendu', value: `${statsAnnuel.totalAttendu.toLocaleString('fr-FR')} DH`, color: 'text-blue-600' },
            { label: 'Impayés', value: `${statsAnnuel.totalImpayes.toLocaleString('fr-FR')} DH`, color: 'text-red-500' },
            { label: 'Taux recouvrement', value: `${statsAnnuel.tauxRecouvrement}%`, color: 'text-amber-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">{s.label} ({statsAnnuel.annee})</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {showStats && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Paiements reçus vs attendus</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats}>
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
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Mois</label>
          <select value={filters.mois} onChange={e => setFilters({...filters, mois: e.target.value})} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Tous</option>
            {moisNoms.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Année</label>
          <select value={filters.annee} onChange={e => setFilters({...filters, annee: e.target.value})} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
          <select value={filters.statut} onChange={e => setFilters({...filters, statut: e.target.value})} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Tous</option>
            <option value="PAYE">Payé</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_RETARD">En retard</option>
          </select>
        </div>
        <button onClick={applyFilters} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm font-medium hover:bg-[#2a5080] transition-colors">
          <Filter className="w-4 h-4" /> Filtrer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {['Résident', 'Appartement', 'Période', 'Montant', 'Statut', 'Date paiement', 'Action'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {paiements.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{p.resident.prenom} {p.resident.nom}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.appartement.numero}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{moisNoms[p.mois]} {p.annee}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{p.montant.toLocaleString('fr-FR')} DH</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.statut === 'PAYE' ? 'bg-emerald-100 text-emerald-700' : p.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.statut === 'PAYE' ? '✅ Payé' : p.statut === 'EN_RETARD' ? '❌ Retard' : '⏳ En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR') : '-'}</td>
                  <td className="px-6 py-4">
                    {p.statut !== 'PAYE' && (
                      <button onClick={() => handleValider(p.id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
                        <Check className="w-3.5 h-3.5" /> Valider
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paiements.length === 0 && <div className="text-center py-12 text-slate-400"><CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Aucun paiement trouvé</p></div>}
      </div>
    </div>
  );
}
