import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { chargeAPI, paiementAPI, residentChargeAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { Plus, Trash2, Edit, TrendingDown, Wallet, PiggyBank, ArrowDownRight, Receipt, Settings, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Charges() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [paiements, setPaiements] = useState([]);
  const [charges, setCharges] = useState([]);
  const [statsAnnuel, setStatsAnnuel] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [essentialAmount, setEssentialAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chargesRes, paiementsRes, statsRes, essRes] = await Promise.all([
        chargeAPI.getAll(),
        paiementAPI.getAll({}),
        paiementAPI.statsAnnuel(new Date().getFullYear()),
        residentChargeAPI.getEssentielle()
      ]);
      setCharges(chargesRes.data);
      setPaiements(paiementsRes.data);
      setStatsAnnuel(statsRes.data);
      setEssentialAmount(essRes.data.value);
    } catch (error) {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEssential = async (e) => {
    e.preventDefault();
    try {
      await residentChargeAPI.updateEssentielle(essentialAmount);
      toast.success(t.monthlyChargeUpdated);
      setShowConfig(false);
    } catch {
      toast.error(t.error);
    }
  };

  if (loading && charges.length === 0) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  const totalFunds = statsAnnuel ? statsAnnuel.totalPaye : 0;
  const totalConsumed = charges.reduce((sum, c) => sum + c.montant, 0);
  const remainingTotal = totalFunds - totalConsumed;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.buildingExpenses}</h1>
          <p className="text-slate-500 mt-1">{t.fundTracking}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><PiggyBank className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t.totalCollectedCaps} ({new Date().getFullYear()})</p>
              <p className="text-lg font-black text-emerald-700">{remainingTotal.toLocaleString('fr-FR')} DH</p>
            </div>
          </div>
          
          <div className="bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><ArrowDownRight className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{t.consumedCaps}</p>
              <p className="text-lg font-black text-red-700">{totalConsumed.toLocaleString('fr-FR')} DH</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" /> {t.chargesHistory}
          </div>
          <button 
            onClick={() => navigate('/syndic/charges/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm shadow hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> {t.newCharge}
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-4">{t.expense}</th>
              <th className="px-6 py-4">{t.cause}</th>
              <th className="px-6 py-4">{t.date}</th>
              <th className="px-6 py-4">{t.amount}</th>
              <th className="px-6 py-4">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {charges.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-700">{c.libelle}</div>
                  <div className="text-xs text-slate-400">{c.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                    {c.categorie || t.miscellaneous}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{new Date(c.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm font-black text-red-600">-{c.montant} DH</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/syndic/charges/edit/${c.id}`)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {charges.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic flex flex-col items-center">
            <Receipt className="w-12 h-12 mb-3 opacity-20" />
            <p>{t.noChargeRegistered}</p>
          </div>
        )}
      </div>

      {/* Modal Configuration Charge Mensuelle – Portal */}
      {showConfig && createPortal(
        <div className="fixed inset-0 bg-[#1e3a5f]/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowConfig(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-slate-50 flex items-start justify-between border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{t.configurationTitle}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">{t.fixedMonthlyChargeAmount}</p>
              </div>
              <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-full shadow-sm border border-slate-200 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateEssential} className="p-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.newAmountDH}</label>
              <input 
                type="number" 
                required
                value={essentialAmount} 
                onChange={e => setEssentialAmount(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 font-black text-xl text-[#1e3a5f] focus:border-[#1e3a5f] focus:ring-0 outline-none transition-all"
                autoFocus
              />
              <button type="submit" className="w-full mt-8 py-4 bg-[#1e3a5f] text-white rounded-2xl text-base font-bold shadow-lg hover:shadow-[#1e3a5f]/30 hover:-translate-y-0.5 transition-all">
                {t.saveChanges}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
