import { useState, useEffect } from 'react';
import { annonceAPI } from '../../services/api';
import { Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

const catColors = { INFO: 'bg-blue-100 text-blue-700', URGENT: 'bg-red-100 text-red-700', TRAVAUX: 'bg-amber-100 text-amber-700', ASSEMBLEE: 'bg-purple-100 text-purple-700' };
const catLabels = { INFO: 'Information', URGENT: 'Urgent', TRAVAUX: 'Travaux', ASSEMBLEE: 'Assemblée' };

export default function ResidentAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const { data } = await annonceAPI.getAll(); setAnnonces(data); }
      catch { toast.error('Erreur'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Annonces</h1><p className="text-slate-500 mt-1">Toutes les annonces du syndic</p></div>

      <div className="space-y-4">
        {annonces.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${catColors[a.categorie]}`}>{catLabels[a.categorie]}</span>
              <span className="text-xs text-slate-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{a.titre}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{a.contenu}</p>
          </div>
        ))}
      </div>
      {annonces.length === 0 && <div className="text-center py-16 text-slate-400"><Megaphone className="w-16 h-16 mx-auto mb-3 opacity-30" /><p>Aucune annonce pour le moment</p></div>}
    </div>
  );
}
