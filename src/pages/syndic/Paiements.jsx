import { useState, useEffect, useRef } from 'react';
import { paiementAPI, residentChargeAPI, chargeAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { CreditCard, Check, Filter, TrendingUp, Search, Settings, X, Wallet, Users, PiggyBank, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';

export default function Paiements() {
  const { t } = useLang();
  const [paiements, setPaiements] = useState([]);
  const [charges, setCharges] = useState([]);
  const [stats, setStats] = useState([]);
  const [statsAnnuel, setStatsAnnuel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    mois: (new Date().getMonth() + 1).toString(),
    annee: new Date().getFullYear().toString(),
    statut: ''
  });
  const [search, setSearch] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [essentialAmount, setEssentialAmount] = useState('');
  
  const [printingPayment, setPrintingPayment] = useState(null);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Recu_Paiement`,
    onAfterPrint: () => setPrintingPayment(null)
  });

  const triggerPrint = (p) => {
    setPrintingPayment(p);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pRes, sRes, aRes, essRes, cRes] = await Promise.all([
        paiementAPI.getAll(filters),
        paiementAPI.statsMensuel(),
        paiementAPI.statsAnnuel(new Date().getFullYear()),
        residentChargeAPI.getEssentielle(),
        chargeAPI.getAll()
      ]);
      setPaiements(pRes.data);
      setStats(sRes.data);
      setStatsAnnuel(aRes.data);
      setEssentialAmount(essRes.data.value);
      setCharges(cRes.data);
    } catch { toast.error(t.loadingError); }
    finally { setLoading(false); }
  };

  const applyFilters = async () => {
    try {
      const params = {};
      if (filters.mois) params.mois = filters.mois;
      if (filters.annee) params.annee = filters.annee;
      if (filters.statut) params.statut = filters.statut;
      const { data } = await paiementAPI.getAll(params);
      setPaiements(data);
    } catch { toast.error(t.error); }
  };

  const handleValider = async (id) => {
    try {
      await paiementAPI.valider(id);
      toast.success(t.paymentValidated);
      loadData();
    } catch { toast.error(t.error); }
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

  const filteredPaiements = paiements.filter(p =>
    `${p.resident.nom} ${p.resident.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    `${p.resident.prenom} ${p.resident.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalDuMois = filteredPaiements.filter(p => p.statut === 'PAYE').reduce((sum, p) => sum + p.montant, 0);
  const totalConsumed = charges.reduce((sum, c) => sum + c.montant, 0);
  const totalApresCharges = (statsAnnuel ? statsAnnuel.totalPaye : 0) - totalConsumed;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.paymentsTitle}</h1>
          <p className="text-slate-500 mt-1">{t.paymentsSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!showStats && (
            <>
              <div className="bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 flex items-center gap-3">
                <Wallet className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{t.totalOfMonth}</p>
                  <p className="text-lg font-black text-blue-700">{totalDuMois.toLocaleString('fr-FR')} DH</p>
                </div>
              </div>
              
              <button onClick={() => setShowConfig(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all">
                <Settings className="w-4 h-4" /> {t.configureFixedAmount}
              </button>
            </>
          )}

          <button onClick={() => setShowStats(!showStats)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${showStats ? 'bg-[#1e3a5f] text-white border border-[#2a5080]' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            {showStats ? <Users className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {showStats ? t.back : t.viewStatistics}
          </button>
        </div>
      </div>

      {/* VUE STATISTIQUES */}
      {showStats ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {statsAnnuel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: t.totalCollected, value: `${statsAnnuel.totalPaye.toLocaleString('fr-FR')} DH`, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                { label: t.totalAfterCharges, value: `${totalApresCharges.toLocaleString('fr-FR')} DH`, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
                { label: t.totalExpected, value: `${statsAnnuel.totalAttendu.toLocaleString('fr-FR')} DH`, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                { label: t.unpaid, value: `${statsAnnuel.totalImpayes.toLocaleString('fr-FR')} DH`, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
                { label: t.recoveryRate, value: `${statsAnnuel.tauxRecouvrement}%`, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                { label: t.fixedCharge, value: `${essentialAmount} DH`, color: 'text-[#1e3a5f]', bg: 'bg-slate-50 border-slate-100', isConfig: true },
              ].map((s, i) => (
                <div key={i} className={`rounded-2xl p-6 shadow-sm border ${s.bg} relative group`}>
                  <p className="text-sm text-slate-600 font-bold uppercase tracking-wider">{s.label} ({statsAnnuel.annee})</p>
                  <p className={`text-3xl font-black mt-2 ${s.color}`}>{s.value}</p>
                  {s.isConfig && (
                    <button
                      onClick={() => setShowConfig(true)}
                      className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-[#1e3a5f] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">{t.paymentsReceivedVsExpected}</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v) => `${v.toLocaleString('fr-FR')} DH`} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="totalAttendu" fill="#cbd5e1" name={t.expected} radius={[6, 6, 0, 0]} barSize={30} />
                <Bar dataKey="totalPaye" fill="#1e3a5f" name={t.received} radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* VUE LISTE (TABLEAU) */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{t.month}</label>
              <select value={filters.mois} onChange={e => setFilters({ ...filters, mois: e.target.value })} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-[#1e3a5f]">
                {t.months.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{t.year}</label>
              <select value={filters.annee} onChange={e => setFilters({ ...filters, annee: e.target.value })} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-[#1e3a5f]">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{t.statusFilter}</label>
              <select value={filters.statut} onChange={e => setFilters({ ...filters, statut: e.target.value })} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-[#1e3a5f]">
                <option value="">{t.all}</option>
                <option value="PAYE">{t.paid}</option>
                <option value="EN_ATTENTE">{t.pending}</option>
                <option value="EN_RETARD">{t.late}</option>
              </select>
            </div>
            <button onClick={applyFilters} className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-bold hover:bg-[#2a5080] transition-colors shadow-sm">
              <Filter className="w-4 h-4" /> {t.filter}
            </button>

            <div className="flex-1 min-w-[200px] relative">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{t.search}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.nameOrFirstName}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-[#1e3a5f]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {t.paymentsList} {filters.mois ? `- ${t.months[filters.mois]} ${filters.annee}` : `(${filters.annee})`}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {[t.resident, t.apartment, t.period, t.amount, t.status, t.paymentDate, t.action].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPaiements.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{p.resident.prenom} {p.resident.nom}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{p.appartement.numero}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{t.months[p.mois]} {p.annee}</td>
                      <td className="px-6 py-4 text-sm font-black text-[#1e3a5f]">{p.montant.toLocaleString('fr-FR')} DH</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.statut === 'PAYE' ? 'bg-emerald-100 text-emerald-700' : p.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.statut === 'PAYE' ? t.paid : p.statut === 'EN_RETARD' ? t.late : t.pending}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{p.datePaiement ? new Date(p.datePaiement).toLocaleDateString(t.dir === 'rtl' ? 'ar-MA' : 'fr-FR') : '-'}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        {p.statut !== 'PAYE' && (
                          <button onClick={() => handleValider(p.id)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                            <Check className="w-4 h-4" /> {t.validate}
                          </button>
                        )}
                        {p.statut === 'PAYE' && (
                          <button onClick={() => triggerPrint(p)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors" title="Imprimer le reçu">
                            <Printer className="w-4 h-4" /> Imprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPaiements.length === 0 && (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center">
                <CreditCard className="w-16 h-16 mb-4 opacity-20 text-[#1e3a5f]" />
                <p className="font-medium text-lg text-slate-500">{t.noPaymentFound}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden Print Receipt Template */}
      <div className="hidden">
        {printingPayment && (
          <div ref={printRef} className="p-10 font-sans max-w-2xl mx-auto bg-white" style={{ color: '#1e3a5f' }}>
            <div className="text-center mb-10 pb-6 border-b-2 border-slate-200">
              <h1 className="text-4xl font-black mb-2 uppercase tracking-widest text-[#1e3a5f]">Reçu de Paiement</h1>
              <p className="text-lg text-slate-500 font-medium">Syndicat de Copropriété</p>
            </div>
            
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Résident</p>
                <p className="text-xl font-bold">{printingPayment.resident.prenom} {printingPayment.resident.nom}</p>
                <p className="text-md text-slate-600 mt-1">Appartement n° {printingPayment.appartement.numero}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Date d'édition</p>
                <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 mb-12 border border-slate-100">
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-200">
                <span className="text-lg font-bold text-slate-600">Période concernée</span>
                <span className="text-xl font-black capitalize">{t.months[printingPayment.mois]} {printingPayment.annee}</span>
              </div>
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-200">
                <span className="text-lg font-bold text-slate-600">Date de paiement</span>
                <span className="text-xl font-black">{printingPayment.datePaiement ? new Date(printingPayment.datePaiement).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-[#1e3a5f] uppercase">Montant Total Payé</span>
                <span className="text-3xl font-black text-emerald-600">{printingPayment.montant.toLocaleString('fr-FR')} DH</span>
              </div>
            </div>

            <div className="mt-16 text-center text-slate-500 text-sm">
              <p>Ce reçu est généré informatiquement et fait office de preuve de paiement.</p>
              <p className="mt-2 font-bold">Merci de votre confiance.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Configuration Charge Mensuelle */}
      {showConfig && (
        <div className="fixed inset-0 bg-[#1e3a5f]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
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
        </div>
      )}
    </div>
  );
}
