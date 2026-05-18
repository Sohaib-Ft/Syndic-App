import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { residentAPI, appartementAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { ArrowLeft, User, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResidentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLang();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appartements, setAppartements] = useState([]);
  const [form, setForm] = useState({ 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '', 
    typeResident: 'PROPRIETAIRE',
    appartementId: '' 
  });
  const [currentAppartId, setCurrentAppartId] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const appRes = await appartementAPI.getAll();
      setAppartements(appRes.data);

      if (isEdit) {
        const { data } = await residentAPI.getById(id);
        setCurrentAppartId(data.appartement?.id);
        setForm({ 
          nom: data.nom, 
          prenom: data.prenom, 
          email: data.email, 
          telephone: data.telephone || '', 
          typeResident: data.typeResident || 'PROPRIETAIRE',
          appartementId: data.appartement?.id?.toString() || '' 
        });
      }
    } catch { 
      toast.error(t.error);
      navigate('/syndic/residents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, appartementId: form.appartementId ? parseInt(form.appartementId) : null };
      
      if (isEdit) {
        await residentAPI.update(id, payload);
        toast.success(t.residentUpdated);
      } else {
        await residentAPI.create(payload);
        toast.success(t.residentCreated);
      }
      navigate('/syndic/residents');
    } catch (error) {
      console.error('Erreur frontend ResidentForm:', error);
      toast.error(error.response?.data?.message || error.message || t.error);
    } finally {
      setSubmitting(false);
    }
  };

  const vacantApparts = (Array.isArray(appartements) ? appartements : []).filter(a => a.statut === 'VACANT' || (isEdit && currentAppartId === a.id));

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/syndic/residents')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? t.editResident : t.newResident}</h1>
          <p className="text-slate-500 mt-1">{t.fillPersonalInfo}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">{t.identityContact}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.firstName} *</label>
              <input required value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exFirstName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.lastName} *</label>
              <input required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exLastName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.email} *</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exEmail} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.phone}</label>
              <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exPhone} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.residentTypeLabel}</label>
              <select value={form.typeResident} onChange={e => setForm({...form, typeResident: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white">
                <option value="PROPRIETAIRE">{t.owner}</option>
                <option value="LOCATAIRE">{t.tenant}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.assignedApt}</label>
              <select value={form.appartementId} onChange={e => setForm({...form, appartementId: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white">
                <option value="">{t.waitingList}</option>
                {vacantApparts.map(a => (
                  <option key={a.id} value={a.id}>{a.numero} - {a.type} (Étage {a.etage})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/syndic/residents')} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              {t.cancel}
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#1e3a5f]/20 transition-all disabled:opacity-70">
              <Save className="w-4 h-4" /> {isEdit ? t.saveChanges : t.createResident}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
