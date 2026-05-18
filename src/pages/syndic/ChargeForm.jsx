import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { chargeAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChargeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLang();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ 
    libelle: '', 
    montant: '', 
    categorie: '', 
    date: new Date().toISOString().split('T')[0], 
    description: '' 
  });

  useEffect(() => {
    if (isEdit) {
      loadCharge();
    }
  }, [id]);

  const loadCharge = async () => {
    try {
      const { data } = await chargeAPI.getAll(); // Getting all to find the one, or we can use getById if available. Wait, getById is not implemented for charges in API service? Let's check.
      // Actually, since I don't have getById for charges in api.js, I will fetch all and filter, or just navigate back. Let's assume we can fetch all and find it.
      const charge = data.find(c => c.id === parseInt(id));
      if (!charge) throw new Error("Non trouvé");
      setForm({ 
        libelle: charge.libelle, 
        montant: charge.montant.toString(), 
        categorie: charge.categorie, 
        date: new Date(charge.date).toISOString().split('T')[0], 
        description: charge.description || '' 
      });
    } catch { 
      toast.error(t.error);
      navigate('/syndic/charges');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, montant: parseFloat(form.montant), date: new Date(form.date) };
      if (isEdit) {
        await chargeAPI.update(id, payload);
        toast.success(t.chargeUpdated);
      } else {
        await chargeAPI.create(payload);
        toast.success(t.chargeCreated);
      }
      navigate('/syndic/charges');
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
        <button onClick={() => navigate('/syndic/charges')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? t.editCharge : t.newCharge}</h1>
          <p className="text-slate-500 mt-1">{t.recordExpense}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">{t.chargeDetails}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.label} *</label>
              <input required value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exChargeLabel} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.amountDH} *</label>
              <input required type="number" step="0.01" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" 
                placeholder={t.exAmount} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.date} *</label>
              <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.cause} *</label>
              <input required type="text" value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white"
                placeholder={t.exChargeLabel} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.description} ({t.optional})</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white resize-none" 
                placeholder={t.additionalDetails} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate('/syndic/charges')} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              {t.cancel}
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-[#1e3a5f]/20 transition-all disabled:opacity-70">
              <Save className="w-4 h-4" /> {isEdit ? t.save : t.createCharge}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
