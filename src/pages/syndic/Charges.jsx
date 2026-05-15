import { useState, useEffect } from 'react';
import { chargeAPI } from '../../services/api';
import { Receipt, Plus, Edit, Trash2, X, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#1e3a5f', '#e8a838', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
const catLabels = { ENTRETIEN: 'Entretien', ELECTRICITE: 'Électricité', EAU: 'Eau', ASCENSEUR: 'Ascenseur', NETTOYAGE: 'Nettoyage', REPARATIONS: 'Réparations', DIVERS: 'Divers' };

export default function Charges() {
  const [charges, setCharges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ annee: new Date().getFullYear().toString(), categorie: '' });
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState({ libelle: '', montant: '', categorie: 'ENTRETIEN', date: new Date().toISOString().split('T')[0], description: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([chargeAPI.getAll(filters), chargeAPI.stats(filters.annee)]);
      setCharges(cRes.data);
      setStats(sRes.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  const applyFilters = async () => {
    try {
      const [cRes, sRes] = await Promise.all([chargeAPI.getAll(filters), chargeAPI.stats(filters.annee)]);
      setCharges(cRes.data);
      setStats(sRes.data);
    } catch { toast.error('Erreur'); }
  };

  const openCreate = () => { setForm({ libelle: '', montant: '', categorie: 'ENTRETIEN', date: new Date().toISOString().split('T')[0], description: '' }); setModal({ open: true, mode: 'create', data: null }); };

  const openEdit = (c) => { setForm({ libelle: c.libelle, montant: c.montant.toString(), categorie: c.categorie, date: new Date(c.date).toISOString().split('T')[0], description: c.description || '' }); setModal({ open: true, mode: 'edit', data: c }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.mode === 'create') { await chargeAPI.create(form); toast.success('Charge ajoutée'); }
      else { await chargeAPI.update(modal.data.id, form); toast.success('Charge modifiée'); }
      setModal({ open: false, mode: 'create', data: null }); loadData();
    } catch (error) { toast.error(error.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette charge ?')) return;
    try { await chargeAPI.delete(id); toast.success('Charge supprimée'); loadData(); }
    catch { toast.error('Erreur'); }
  };

  const pieData = stats?.parCategorie ? Object.entries(stats.parCategorie).map(([key, value]) => ({ name: catLabels[key] || key, value })) : [];

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Charges & Dépenses</h1><p className="text-slate-500 mt-1">Gestion des dépenses de l'immeuble</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Ajouter une charge
        </button>
      </div>

      {/* Stats + Pie Chart */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Total des charges ({stats.annee})</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total.toLocaleString('fr-FR')} DH</p>
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Répartition par catégorie</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v.toLocaleString('fr-FR')} DH`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Année</label>
          <select value={filters.annee} onChange={e => setFilters({...filters, annee: e.target.value})} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Catégorie</label>
          <select value={filters.categorie} onChange={e => setFilters({...filters, categorie: e.target.value})} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Toutes</option>
            {Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
              {['Libellé', 'Catégorie', 'Montant', 'Date', 'Description', 'Actions'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {charges.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{c.libelle}</td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{catLabels[c.categorie]}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-600">{c.montant.toLocaleString('fr-FR')} DH</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate">{c.description || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {charges.length === 0 && <div className="text-center py-12 text-slate-400"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Aucune charge trouvée</p></div>}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">{modal.mode === 'create' ? 'Nouvelle charge' : 'Modifier la charge'}</h3>
              <button onClick={() => setModal({ open: false, mode: 'create', data: null })} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Libellé *</label><input required value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Montant (DH) *</label><input required type="number" step="0.01" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Catégorie *</label>
                  <select required value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm">
                    {Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Date *</label><input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal({ open: false, mode: 'create', data: null })} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Annuler</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">{modal.mode === 'create' ? 'Ajouter' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
