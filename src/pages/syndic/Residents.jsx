import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { residentAPI, appartementAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Users, Plus, Edit, Trash2, Search, Eye, Mail, Phone, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Residents() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState({ open: false, data: null, paiements: [] });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const resRes = await residentAPI.getAll();
      setResidents(resRes.data);
    } catch { toast.error(t.loadingError); }
    finally { setLoading(false); }
  };

  const openCreate = () => navigate('/syndic/residents/nouveau');
  const openEdit = (r) => navigate(`/syndic/residents/edit/${r.id}`);

  const openDetail = async (r) => {
    try {
      const [resData, pData] = await Promise.all([residentAPI.getById(r.id), residentAPI.getPaiements(r.id)]);
      setDetailModal({ open: true, data: resData.data, paiements: pData.data });
    } catch { toast.error(t.error); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t.deleteResident)) return;
    try { await residentAPI.delete(id); toast.success(t.residentDeleted); loadData(); }
    catch (error) { toast.error(error.response?.data?.message || t.error); }
  };
  const filtered = residents.filter(r => `${r.nom} ${r.prenom}`.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.residents}</h1>
          <p className="text-slate-500 mt-1">{residents.length} {t.registeredResidents}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> {t.addApartment}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchResident}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {[t.resident, t.residentType, t.phone, t.apartment, t.status, t.actions].map(h => (
                <TableHead key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                      {(r.prenom?.[0] || '').toUpperCase()}{(r.nom?.[0] || '').toUpperCase()}
                    </div>
                    <span className="font-medium text-sm text-slate-800">{r.prenom} {r.nom}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.typeResident === 'LOCATAIRE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {r.typeResident === 'LOCATAIRE' ? t.tenant : t.owner}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-slate-600">{r.telephone || '-'}</TableCell>
                <TableCell className="px-6 py-4 text-sm text-slate-600">{r.appartement ? r.appartement.numero : <span className="text-slate-400">{t.notAssigned}</span>}</TableCell>
                <TableCell className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.actif ? t.active : t.inactive}</span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openDetail(r)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(r)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t.notAssigned}</p></div>}
      </div>

      {/* Modal Detail – rendered via Portal to escape overflow:auto parent */}
      {detailModal.open && detailModal.data && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setDetailModal({ open: false, data: null, paiements: [] })}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">{t.residentFile}</h3>
              <button onClick={() => setDetailModal({ open: false, data: null, paiements: [] })} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xl font-bold text-white">
                  {(detailModal.data.prenom?.[0] || '').toUpperCase()}{(detailModal.data.nom?.[0] || '').toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{detailModal.data.prenom} {detailModal.data.nom}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${detailModal.data.typeResident === 'LOCATAIRE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {detailModal.data.typeResident === 'LOCATAIRE' ? t.tenant : t.owner}
                    </span>
                    {detailModal.data.telephone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{detailModal.data.telephone}</span>}
                  </div>
                </div>
              </div>
              {detailModal.data.appartement && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-500 mb-2">{t.assignedApartment}</p>
                  <p className="font-semibold text-slate-800">{detailModal.data.appartement.numero} — {detailModal.data.appartement.type}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">{t.paymentHistory}</p>
                <div className="space-y-2">
                  {detailModal.paiements.length === 0 ? <p className="text-sm text-slate-400">{t.noPayment}</p> : detailModal.paiements.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-700">{t.monthsShort[p.mois]} {p.annee}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">{p.montant.toLocaleString('fr-FR')} DH</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.statut === 'PAYE' ? 'bg-emerald-100 text-emerald-700' : p.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.statut === 'PAYE' ? `✅ ${t.paid}` : p.statut === 'EN_RETARD' ? `❌ ${t.late}` : `⏳ ${t.pending}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
