import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appartementAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AppartementForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLang();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ 
    numero: '', 
    etage: '', 
    superficie: '0', 
    nbPieces: '', 
    type: '', 
    description: '', 
    chargesMensuelles: '' 
  });

  useEffect(() => {
    if (isEdit) {
      loadAppartement();
    }
  }, [id]);

  const loadAppartement = async () => {
    try {
      const { data } = await appartementAPI.getById(id);
      setForm({ 
        numero: data.numero, 
        etage: data.etage.toString(), 
        superficie: data.superficie.toString(), 
        nbPieces: data.nbPieces.toString(), 
        type: data.type || '', 
        description: data.description || '', 
        chargesMensuelles: data.chargesMensuelles.toString() 
      });
    } catch { 
      toast.error(t.error);
      navigate('/syndic/appartements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await appartementAPI.update(id, form);
        toast.success(t.apartmentUpdated);
      } else {
        await appartementAPI.create(form);
        toast.success(t.apartmentCreated);
      }
      navigate('/syndic/appartements');
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
        <button onClick={() => navigate('/syndic/appartements')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? t.editApartment : t.newApartment}</h1>
          <p className="text-slate-500 mt-1">{t.fillApartmentInfo}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">{t.apartmentDetails}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.number} *</label>
              <input required value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exNumber} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.floor} *</label>
              <input required type="number" value={form.etage} onChange={e => setForm({...form, etage: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exFloor} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.nbRooms} *</label>
              <input required type="number" value={form.nbPieces} onChange={e => setForm({...form, nbPieces: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exRooms} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.type}</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white">
                <option value="">{t.select}...</option>
                <option value="Studio">Studio</option>
                <option value="F1">F1</option>
                <option value="F2">F2</option>
                <option value="F3">F3</option>
                <option value="F4">F4</option>
                <option value="F5">F5</option>
                <option value="Duplex">Duplex</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.chargesMonthDH}</label>
              <input type="number" value={form.chargesMensuelles} onChange={e => setForm({...form, chargesMensuelles: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exCharges} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.description}</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white resize-none" 
              placeholder={t.aptDetailsDesc} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/syndic/appartements')} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              {t.cancel}
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#1e3a5f]/20 transition-all disabled:opacity-70">
              <Save className="w-4 h-4" /> {isEdit ? t.save : t.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
