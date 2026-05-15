import { useState, useEffect } from 'react';
import { residentAPI, appartementAPI } from '../../services/api';
import { Users, Plus, Edit, Trash2, Search, X, Eye, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [appartements, setAppartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [detailModal, setDetailModal] = useState({ open: false, data: null, paiements: [] });
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', password: '', appartementId: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [resRes, appRes] = await Promise.all([residentAPI.getAll(), appartementAPI.getAll()]);
      setResidents(resRes.data);
      setAppartements(appRes.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ nom: '', prenom: '', email: '', telephone: '', password: '', appartementId: '' });
    setModal({ open: true, mode: 'create', data: null });
  };

  const openEdit = (r) => {
    setForm({ nom: r.nom, prenom: r.prenom, email: r.email, telephone: r.telephone || '', password: '', appartementId: r.appartement?.id?.toString() || '' });
    setModal({ open: true, mode: 'edit', data: r });
  };

  const openDetail = async (r) => {
    try {
      const [resData, pData] = await Promise.all([residentAPI.getById(r.id), residentAPI.getPaiements(r.id)]);
      setDetailModal({ open: true, data: resData.data, paiements: pData.data });
    } catch { toast.error('Erreur'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, appartementId: form.appartementId ? parseInt(form.appartementId) : null };
      if (modal.mode === 'create') {
        if (!payload.password) return toast.error('Mot de passe requis');
        await residentAPI.create(payload);
        toast.success('Résident créé');
      } else {
        if (!payload.password) delete payload.password;
        await residentAPI.update(modal.data.id, payload);
        toast.success('Résident modifié');
      }
      setModal({ open: false, mode: 'create', data: null });
      loadData();
    } catch (error) { toast.error(error.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce résident ?')) return;
    try { await residentAPI.delete(id); toast.success('Résident supprimé'); loadData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Erreur'); }
  };

  const vacantApparts = appartements.filter(a => a.statut === 'VACANT' || (modal.mode === 'edit' && modal.data?.appartement?.id === a.id));
  const filtered = residents.filter(r => `${r.nom} ${r.prenom} ${r.email}`.toLowerCase().includes(search.toLowerCase()));
  const moisNoms = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Résidents</h1>
          <p className="text-slate-500 mt-1">{residents.length} résidents enregistrés</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un résident..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {['Résident', 'Email', 'Téléphone', 'Appartement', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">{r.prenom[0]}{r.nom[0]}</div>
                      <span className="font-medium text-sm text-slate-800">{r.prenom} {r.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.telephone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.appartement ? r.appartement.numero : <span className="text-slate-400">Non assigné</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.actif ? 'Actif' : 'Inactif'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(r)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(r)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Aucun résident trouvé</p></div>}
      </div>

      {/* Modal Create/Edit */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">{modal.mode === 'create' ? 'Nouveau résident' : 'Modifier le résident'}</h3>
              <button onClick={() => setModal({ open: false, mode: 'create', data: null })} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label><input required value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label><input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email *</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label><input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">{modal.mode === 'create' ? 'Mot de passe *' : 'Nouveau mdp'}</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" placeholder={modal.mode === 'edit' ? 'Laisser vide pour ne pas changer' : ''} /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Appartement</label>
                <select value={form.appartementId} onChange={e => setForm({...form, appartementId: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm">
                  <option value="">Non assigné</option>
                  {vacantApparts.map(a => <option key={a.id} value={a.id}>{a.numero} - {a.type} (Étage {a.etage})</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal({ open: false, mode: 'create', data: null })} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">{modal.mode === 'create' ? 'Créer' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {detailModal.open && detailModal.data && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailModal({ open: false, data: null, paiements: [] })}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Fiche résident</h3>
              <button onClick={() => setDetailModal({ open: false, data: null, paiements: [] })} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xl font-bold text-white">{detailModal.data.prenom[0]}{detailModal.data.nom[0]}</div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{detailModal.data.prenom} {detailModal.data.nom}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{detailModal.data.email}</span>
                    {detailModal.data.telephone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{detailModal.data.telephone}</span>}
                  </div>
                </div>
              </div>
              {detailModal.data.appartement && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-500 mb-2">Appartement assigné</p>
                  <p className="font-semibold text-slate-800">{detailModal.data.appartement.numero} — {detailModal.data.appartement.type}</p>
                  <p className="text-sm text-slate-600">Étage {detailModal.data.appartement.etage} · {detailModal.data.appartement.superficie} m² · Charges: {detailModal.data.appartement.chargesMensuelles?.toLocaleString('fr-FR')} DH/mois</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Historique des paiements</p>
                <div className="space-y-2">
                  {detailModal.paiements.length === 0 ? <p className="text-sm text-slate-400">Aucun paiement</p> : detailModal.paiements.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-700">{moisNoms[p.mois]} {p.annee}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">{p.montant.toLocaleString('fr-FR')} DH</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.statut === 'PAYE' ? 'bg-emerald-100 text-emerald-700' : p.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.statut === 'PAYE' ? '✅ Payé' : p.statut === 'EN_RETARD' ? '❌ Retard' : '⏳ En attente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
