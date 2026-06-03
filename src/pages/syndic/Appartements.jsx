import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appartementAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { Building2, Plus, Edit, Trash2, Search, Home } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Appartements() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [appartements, setAppartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data } = await appartementAPI.getAll();
      setAppartements(data);
    } catch { toast.error(t.loadingError); }
    finally { setLoading(false); }
  };

  const openCreate = () => navigate('/syndic/appartements/nouveau');
  const openEdit = (appart) => navigate(`/syndic/appartements/edit/${appart.id}`);

  const handleDelete = async (id) => {
    if (!confirm(t.deleteApartment)) return;
    try {
      await appartementAPI.delete(id);
      toast.success(t.apartmentDeleted);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || t.error);
    }
  };

  const filtered = appartements.filter(a =>
    a.numero.toLowerCase().includes(search.toLowerCase()) ||
    a.type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.apartments}</h1>
          <p className="text-slate-500 mt-1">{appartements.length} {t.apartments.toLowerCase()} {t.total}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> {t.addApartment}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchApartment}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[t.number, t.floor, t.type, t.status, t.resident, t.actions].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-[#1e3a5f]" />
                      <span className="font-semibold text-sm text-slate-800">{a.numero}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{a.etage}e</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{a.type || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${a.statut === 'OCCUPE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {a.statut === 'OCCUPE' ? t.occupied : t.vacant}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {a.resident ? `${a.resident.prenom} ${a.resident.nom}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(a)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.noApartmentFound}</p>
          </div>
        )}
      </div>

    </div> 
  );
}