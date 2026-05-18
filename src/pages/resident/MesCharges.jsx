import { useState, useEffect } from 'react';
import { residentChargeAPI, chargeAPI } from '../../services/api';
import { useLang } from '../../contexts/LangContext';
import { Receipt, Info, TrendingDown, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MesCharges() {
  const { t } = useLang();
  const [data, setData] = useState({ paiements: [], charges: [] });
  const [loading, setLoading] = useState(true);

  const catLabels = { ENTRETIEN: t.maintenance, ELECTRICITE: t.electricity, EAU: t.water, ASCENSEUR: t.elevator, NETTOYAGE: t.cleaning, REPARATIONS: t.repairs, DIVERS: t.miscellaneous };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resRes, expRes] = await Promise.all([
        residentChargeAPI.getMesCharges(),
        chargeAPI.getAll()
      ]);
      setData({ paiements: resRes.data.paiements, charges: expRes.data });
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t.charges}</h1>
        <p className="text-slate-500 mt-1">Transparence des fonds de la copropriété</p>
      </div>

      {/* Charge Mensuelle Fixe */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Receipt className="w-5 h-5" /></div>
          <h2 className="text-lg font-bold text-slate-800">Ma Charge Mensuelle Fixe</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Montant défini par le syndic pour les frais communs.</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${data.paiements[0]?.statut === 'PAYE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                Statut actuel: {data.paiements[0]?.statut === 'PAYE' ? 'Payé' : 'En attente'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-[#1e3a5f]">{data.paiements[0]?.montant || 0} DH</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Par mois</p>
          </div>
        </div>
      </section>

      {/* Utilisation des fonds (Dépenses/Charges Partielles) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-50 rounded-lg text-red-600"><TrendingDown className="w-5 h-5" /></div>
          <h2 className="text-lg font-bold text-slate-800">Utilisation des Fonds (Dépenses)</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">Dépense</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.charges.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700">{c.libelle}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{c.description}</div>
                  </td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-full text-slate-600">{catLabels[c.categorie] || c.categorie}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(c.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-black text-red-600">-{c.montant} DH</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.charges.length === 0 && (
            <div className="p-12 text-center text-slate-400 italic">Aucune dépense enregistrée ce mois-ci.</div>
          )}
        </div>
      </section>
    </div>
  );
}
