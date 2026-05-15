import { useState, useEffect } from 'react';
import { annonceAPI } from '../../services/api';
import { Megaphone, Plus, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const catColors = { INFO: 'bg-blue-100 text-blue-700', URGENT: 'bg-red-100 text-red-700', TRAVAUX: 'bg-amber-100 text-amber-700', ASSEMBLEE: 'bg-purple-100 text-purple-700' };
const catLabels = { INFO: 'Information', URGENT: 'Urgent', TRAVAUX: 'Travaux', ASSEMBLEE: 'Assemblée' };

export default function Annonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState({ titre: '', contenu: '', categorie: 'INFO' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const { data } = await annonceAPI.getAll(); setAnnonces(data); }
    catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm({ titre: '', contenu: '', categorie: 'INFO' }); setModal({ open: true, mode: 'create', data: null }); };

  const openEdit = (a) => { setForm({ titre: a.titre, contenu: a.contenu, categorie: a.categorie }); setModal({ open: true, mode: 'edit', data: a }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal.mode === 'create') { await annonceAPI.create(form); toast.success('Annonce créée'); }
      else { await annonceAPI.update(modal.data.id, form); toast.success('Annonce modifiée'); }
      setModal({ open: false, mode: 'create', data: null }); loadData();
    } catch (error) { toast.error(error.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    try { await annonceAPI.delete(id); toast.success('Annonce supprimée'); loadData(); }
    catch { toast.error('Erreur'); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Annonces</h1><p className="text-slate-500 mt-1">{annonces.length} annonces publiées</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Nouvelle annonce
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {annonces.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${catColors[a.categorie]}`}>{catLabels[a.categorie]}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-2">{a.titre}</h3>
            <p className="text-sm text-slate-600 line-clamp-3">{a.contenu}</p>
            <p className="text-xs text-slate-400 mt-3">{new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        ))}
      </div>
      {annonces.length === 0 && <div className="text-center py-16 text-slate-400"><Megaphone className="w-16 h-16 mx-auto mb-3 opacity-30" /><p>Aucune annonce publiée</p></div>}

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">{modal.mode === 'create' ? 'Nouvelle annonce' : 'Modifier l\'annonce'}</h3>
              <button onClick={() => setModal({ open: false, mode: 'create', data: null })} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label><input required value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Catégorie *</label>
                <select required value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm">
                  <option value="INFO">Information</option><option value="URGENT">Urgent</option><option value="TRAVAUX">Travaux</option><option value="ASSEMBLEE">Assemblée</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Contenu *</label><textarea required value={form.contenu} onChange={e => setForm({...form, contenu: e.target.value})} rows={4} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal({ open: false, mode: 'create', data: null })} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Annuler</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">{modal.mode === 'create' ? 'Publier' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
