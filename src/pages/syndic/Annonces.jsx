import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { annonceAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { Megaphone, Plus, Edit, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const catColors = { INFO: 'bg-blue-100 text-blue-700', URGENT: 'bg-red-100 text-red-700', TRAVAUX: 'bg-amber-100 text-amber-700', ASSEMBLEE: 'bg-purple-100 text-purple-700' };

export default function Annonces() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const dateLocale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR';
  const catLabels = { INFO: t.information, URGENT: t.urgent, TRAVAUX: t.works, ASSEMBLEE: t.assembly };
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const { data } = await annonceAPI.getAll(); setAnnonces(data); }
    catch { toast.error(t.loadingError); }
    finally { setLoading(false); }
  };

  const openCreate = () => navigate('/syndic/annonces/nouveau');

  const openEdit = (a) => navigate(`/syndic/annonces/edit/${a.id}`);

  const handleDelete = async (id) => {
    if (!confirm(t.deleteAnnouncement)) return;
    try { await annonceAPI.delete(id); toast.success(t.announcementDeleted); loadData(); }
    catch { toast.error(t.error); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">{t.announcements}</h1><p className="text-slate-500 mt-1">{annonces.length} {t.announcements.toLowerCase()}</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> {t.newAnnouncement}
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
            <p className="text-xs text-slate-400 mt-3">{new Date(a.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        ))}
      </div>
      {annonces.length === 0 && <div className="text-center py-16 text-slate-400"><Megaphone className="w-16 h-16 mx-auto mb-3 opacity-30" /><p>{t.noAnnouncementPublished}</p></div>}
    </div>
  );
}
