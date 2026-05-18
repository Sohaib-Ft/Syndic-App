import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { Home, CreditCard, CheckCircle, Clock, Megaphone, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const catColors = { INFO: 'bg-blue-100 text-blue-700', URGENT: 'bg-red-100 text-red-700', TRAVAUX: 'bg-amber-100 text-amber-700', ASSEMBLEE: 'bg-purple-100 text-purple-700' };

export default function ResidentDashboard() {
  const { t, lang } = useLang();
  const dateLocale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-US' : 'fr-FR';
  const catLabels = { INFO: t.information, URGENT: t.urgent, TRAVAUX: t.works, ASSEMBLEE: t.assembly };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const res = await dashboardAPI.resident(); setData(res.data); }
      catch { toast.error(t.loadingError); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;
  if (!data) return <div className="text-center py-20 text-slate-500">{t.noData}</div>;

  const paiement = data.paiementMoisActuel;
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t.welcome}, {data.user.prenom} 👋</h1>
        <p className="text-slate-500 mt-1">{t.residentSpace}</p>
      </div>

      {/* Appartement info + Paiement du mois */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info appartement */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{t.myApartment}</h3>
          </div>
          {data.appartement ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-500">{t.number}</p><p className="font-semibold text-slate-800">{data.appartement.numero}</p></div>
                <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-500">{t.type}</p><p className="font-semibold text-slate-800">{data.appartement.type || '-'}</p></div>
                <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-500">{t.floor}</p><p className="font-semibold text-slate-800">{data.appartement.etage}</p></div>
                <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-500">{t.area}</p><p className="font-semibold text-slate-800">{data.appartement.superficie} m²</p></div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs text-amber-600 font-medium">{t.monthlyCharge}</p>
                <p className="text-2xl font-bold text-amber-700">{data.chargeMensuelle.toLocaleString(dateLocale)} DH</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400"><Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>{t.noApartmentAssigned}</p></div>
          )}
        </div>

        {/* Statut paiement du mois */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{t.monthPayment}</h3>
          </div>
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 mb-4">{t.months[now.getMonth() + 1]} {now.getFullYear()}</p>
            {paiement ? (
              paiement.statut === 'PAYE' ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8 text-emerald-500" /></div>
                  <p className="text-lg font-bold text-emerald-600">{t.paid} ✅</p>
                  <p className="text-sm text-slate-500">{t.amount}: {paiement.montant.toLocaleString(dateLocale)} DH</p>
                  {paiement.datePaiement && <p className="text-xs text-slate-400">{t.paidOn} {new Date(paiement.datePaiement).toLocaleDateString(dateLocale)}</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto"><Clock className="w-8 h-8 text-amber-500" /></div>
                  <p className="text-lg font-bold text-amber-600">{t.pending} ⏳</p>
                  <p className="text-sm text-slate-500">{t.amountDue}: {paiement.montant.toLocaleString(dateLocale)} DH</p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto"><CreditCard className="w-8 h-8 text-slate-400" /></div>
                <p className="text-sm text-slate-400">{t.noPaymentGenerated}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historique paiements */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t.paymentHistory}</h3>
        <div className="space-y-2">
          {data.historiquePaiements.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">{t.noDataAvailable}</p>
          ) : data.historiquePaiements.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-700">{t.months[p.mois]} {p.annee}</p>
                {p.datePaiement && <p className="text-xs text-slate-400">{t.paidOn} {new Date(p.datePaiement).toLocaleDateString(dateLocale)}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">{p.montant.toLocaleString(dateLocale)} DH</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.statut === 'PAYE' ? 'bg-emerald-100 text-emerald-700' : p.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.statut === 'PAYE' ? `✅ ${t.paid}` : p.statut === 'EN_RETARD' ? `❌ ${t.late}` : `⏳ ${t.pending}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Annonces */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-[#1e3a5f]" /> {t.latestAnnouncements}</h3>
        <div className="space-y-3">
          {data.annonces.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">{t.noAnnouncementPublished}</p>
          ) : data.annonces.slice(0, 5).map((a) => (
            <div key={a.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
              <div className="flex items-start gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColors[a.categorie]}`}>{catLabels[a.categorie] || a.categorie}</span>
                <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString(dateLocale)}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800">{a.titre}</h4>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.contenu}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
