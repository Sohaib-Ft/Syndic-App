import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { annonceAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { ArrowLeft, Megaphone, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnnonceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLang();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ categorie: 'INFO', titre: '', contenu: '' });

  useEffect(() => {
    if (isEdit) {
      loadAnnonce();
    }
  }, [id]);

  const loadAnnonce = async () => {
    try {
      const { data } = await annonceAPI.getById(id);
      setForm({
        categorie: data.categorie,
        titre: data.titre || '',
        contenu: data.contenu || ''
      });
    } catch { 
      toast.error(t.error);
      navigate('/syndic/annonces');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      categorie: form.categorie,
      titre: form.titre.trim(),
      contenu: form.contenu.trim()
    };

    try {
      if (isEdit) {
        await annonceAPI.update(id, payload);
        toast.success(t.announcementUpdated);
      } else {
        await annonceAPI.create(payload);
        toast.success(t.announcementCreated);
      }
      navigate('/syndic/annonces');
    } catch (error) {
      toast.error(error.response?.data?.message || t.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/syndic/annonces')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? t.editAnnouncement : t.newAnnouncement}</h1>
          <p className="text-slate-500 mt-1">{t.publishInfo}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">{t.announcementDetails}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.category}</label>
              <select value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white">
                <option value="INFO">{t.information}</option>
                <option value="URGENT">{t.urgent}</option>
                <option value="TRAVAUX">{t.works}</option>
                <option value="ASSEMBLEE">{t.assembly}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.title} *</label>
              <input
                required
                value={form.titre}
                onChange={e => setForm({...form, titre: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white"
                placeholder={t.exAnnouncementTitle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.content} *</label>
              <textarea
                required
                value={form.contenu}
                onChange={e => setForm({...form, contenu: e.target.value})}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white resize-none"
                placeholder={t.announcementDesc}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/syndic/annonces')} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              {t.cancel}
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#1e3a5f]/20 transition-all disabled:opacity-70">
              <Save className="w-4 h-4" /> {isEdit ? t.save : t.publishAnnouncement}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
