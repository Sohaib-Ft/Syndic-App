import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function MesPaiements() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await dashboardAPI.resident();
        setPaiements(data.historiquePaiements || []);
      } catch { toast.error('Erreur'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Mes Paiements</h1><p className="text-slate-500 mt-1">Historique complet de vos paiements</p></div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {['Période', 'Montant', 'Statut', 'Date de paiement'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {paiements.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{moisNoms[p.mois]} {p.annee}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{p.montant.toLocaleString('fr-FR')} DH</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.statut === 'PAYE' ? 'bg-emerald-100 text-emerald-700' : p.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.statut === 'PAYE' ? '✅ Payé' : p.statut === 'EN_RETARD' ? '❌ Retard' : '⏳ En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.datePaiement ? new Date(p.datePaiement).toLocaleDateString('fr-FR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paiements.length === 0 && <div className="text-center py-12 text-slate-400"><CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Aucun paiement trouvé</p></div>}
      </div>
    </div>
  );
}
