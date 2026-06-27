"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { 
  Banknote, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Search,
  Building,
  Check
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function AdminPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [reference, setReference] = useState("");

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payouts')
      .select('*, companies(name)')
      .order('requested_at', { ascending: false });

    if (data) {
      setPayouts(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (payout: any) => {
    setSelectedPayout(payout);
    setReference("");
    setShowModal(true);
  };

  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    setProcessingId(selectedPayout.id);
    try {
      const { error } = await supabase
        .from('payouts')
        .update({ 
          status: 'PAID', 
          reference: reference, 
          paid_at: new Date().toISOString() 
        })
        .eq('id', selectedPayout.id);

      if (error) throw error;

      toast.success(`Reversement pour ${selectedPayout.companies.name} marqué comme payé.`);
      setShowModal(false);
      fetchPayouts();
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayouts = payouts.filter(p => 
    p.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingPayouts = payouts.filter(p => p.status === 'PENDING').length;
  const pendingAmount = payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payouts.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reversements</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Gérez les demandes de retraits des compagnies partenaires.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-amber-500">
            <Clock className="w-16 h-16" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2">En Attente ({pendingPayouts})</p>
            <h3 className="text-3xl font-black text-amber-900">{pendingAmount.toLocaleString()} <span className="text-lg">FCFA</span></h3>
          </div>
        </div>

        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden sm:col-span-2">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-emerald-500">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2">Total Reversé</p>
            <h3 className="text-3xl font-black text-emerald-900">{totalPaid.toLocaleString()} <span className="text-lg">FCFA</span></h3>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center">
            <Banknote className="w-5 h-5 mr-2 text-brand-green" /> Demandes de reversements
          </h2>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Compagnie</th>
                <th className="p-4">Date de demande</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Référence</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                    Aucune demande trouvée.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-black text-gray-900">{payout.companies?.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-medium">
                      {new Date(payout.requested_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <span className="font-black text-gray-900 text-base">{payout.amount.toLocaleString()} FCFA</span>
                    </td>
                    <td className="p-4">
                      {payout.status === 'PENDING' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          <Clock className="w-3 h-3 mr-1" /> EN ATTENTE
                        </span>
                      ) : payout.status === 'PAID' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> PAYÉ
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                          <AlertCircle className="w-3 h-3 mr-1" /> REJETÉ
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-medium">
                      {payout.reference ? (
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{payout.reference}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Aucune</span>
                      )}
                    </td>
                    <td className="p-4 text-right pr-6">
                      {payout.status === 'PENDING' && (
                        <button
                          onClick={() => handleOpenModal(payout)}
                          className="inline-flex items-center space-x-1 bg-white border border-brand-green text-brand-green hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                        >
                          <Check className="w-3 h-3" />
                          <span>Payer</span>
                        </button>
                      )}
                      {payout.status === 'PAID' && (
                        <span className="text-xs text-gray-400 font-medium">
                          le {new Date(payout.paid_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 bg-emerald-50">
              <h3 className="text-xl font-black text-gray-900">Valider le reversement</h3>
              <p className="text-sm text-emerald-800 font-medium mt-1">Marquer ce retrait comme effectué.</p>
            </div>
            
            <form onSubmit={handleMarkAsPaid} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-gray-500 font-medium">Compagnie:</span>
                  <span className="font-bold text-gray-900">{selectedPayout.companies?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Montant à payer:</span>
                  <span className="font-black text-brand-green text-lg">{selectedPayout.amount.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Référence du transfert (Optionnel)</label>
                <input 
                  type="text" 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: Ref Wave, Numéro de virement..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-green"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Entrez l'ID de la transaction pour garder une trace comptable.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={processingId === selectedPayout.id}
                  className="flex-1 bg-brand-green text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-green-dark shadow-md transition disabled:opacity-50 flex items-center justify-center"
                >
                  {processingId === selectedPayout.id ? "Validation..." : "Confirmer le paiement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
