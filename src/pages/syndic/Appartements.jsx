import { useState, useEffect } from 'react';
import { appartementAPI } from '../../services/api';
import { Building2, Plus, Edit, Trash2, Search, X, Home } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Appartements() {
  const [appartements, setAppartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState({ numero: '', etage: '', superficie: '', nbPieces: '', type: '', description: '', chargesMensuelles: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data } = await appartementAPI.getAll();
      setAppartements(data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ numero: '', etage: '', superficie: '', nbPieces: '', type: '', description: '', chargesMensuelles: '' });
    setModal({ open: true, mode: 'create', data: null });
  };

  const openEdit = (appart) => {
    setForm({ numero: appart.numero, etage: appart.etage.toString(), superficie: appart.superficie.toString(), nbPieces: appart.nbPieces.toString(), type: appart.type || '', description: appart.description || '', chargesMensuelles: appart.chargesMensuelles.toString() });
    setModal({ open: true, mode: 'edit', data: appart });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.mode === 'create') {
        await appartementAPI.create(form);
        toast.success('Appartement créé');
      } else {
        await appartementAPI.update(modal.data.id, form);
        toast.success('Appartement modifié');
      }
      setModal({ open: false, mode: 'create', data: null });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet appartement ?')) return;
    try {
      await appartementAPI.delete(id);
      toast.success('Appartement supprimé');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const filtered = appartements.filter(a => a.numero.toLowerCase().includes(search.toLowerCase()) || a.type?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appartements</h1>
          <p className="text-slate-500 mt-1">{appartements.length} appartements au total</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un appartement..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Numéro', 'Étage', 'Type', 'Superficie', 'Pièces', 'Charges/mois', 'Statut', 'Résident', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><Home className="w-4 h-4 text-[#1e3a5f]" /><span className="font-semibold text-sm text-slate-800">{a.numero}</span></div></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{a.etage}e</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{a.type || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{a.superficie} m²</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{a.nbPieces}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{a.chargesMensuelles.toLocaleString('fr-FR')} DH</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${a.statut === 'OCCUPE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {a.statut === 'OCCUPE' ? 'Occupé' : 'Vacant'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{a.resident ? `${a.resident.prenom} ${a.resident.nom}` : '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(a)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Aucun appartement trouvé</p></div>}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">{modal.mode === 'create' ? 'Nouvel appartement' : 'Modifier l\'appartement'}</h3>
              <button onClick={() => setModal({ open: false, mode: 'create', data: null })} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Numéro *</label>
                  <input required value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Étage *</label>
                  <input required type="number" value={form.etage} onChange={e => setForm({...form, etage: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Superficie (m²) *</label>
                  <input required type="number" step="0.1" value={form.superficie} onChange={e => setForm({...form, superficie: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nb pièces *</label>
                  <input required type="number" value={form.nbPieces} onChange={e => setForm({...form, nbPieces: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm">
                    <option value="">Sélectionner</option>
                    <option value="F1">F1</option><option value="F2">F2</option><option value="F3">F3</option><option value="F4">F4</option><option value="F5">F5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Charges/mois (DH)</label>
                  <input type="number" value={form.chargesMensuelles} onChange={e => setForm({...form, chargesMensuelles: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal({ open: false, mode: 'create', data: null })} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
                  {modal.mode === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
