"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Banknote,
  Landmark,
  FileText
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function CompanyFinancesPage() {
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string>("");
  
  const [stats, setStats] = useState({
    totalOnlineNet: 0,
    totalCounterCommissions: 0,
    totalPayouts: 0,
    availableBalance: 0
  });

  const [payouts, setPayouts] = useState<any[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [requestAmount, setRequestAmount] = useState<string>("");

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single();
      
    if (profile?.company_id) {
      setCompanyId(profile.company_id);
      
      // 1. Fetch all trips for this company to get trip IDs
      const { data: trips } = await supabase
        .from('trips')
        .select('id')
        .eq('company_id', profile.company_id);

      const tripIds = trips?.map(t => t.id) || [];

      let totalOnlineNet = 0;
      let totalCounterCommissions = 0;

      if (tripIds.length > 0) {
        // 2. Fetch confirmed bookings for these trips
        const { data: bookings } = await supabase
          .from('bookings')
          .select('net_amount, commission_amount, payment_method')
          .in('trip_id', tripIds)
          .eq('status', 'CONFIRMED');

        if (bookings) {
          bookings.forEach(b => {
            if (!b.payment_method) {
              // Online payment (Tukki collected money, owes net to company)
              totalOnlineNet += (b.net_amount || 0);
            } else {
              // Counter payment (Company collected money, owes commission to Tukki)
              totalCounterCommissions += (b.commission_amount || 0);
            }
          });
        }
      }

      // 3. Fetch payouts
      const { data: payoutData } = await supabase
        .from('payouts')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('requested_at', { ascending: false });

      if (payoutData) {
        setPayouts(payoutData);
      }

      const totalPayouts = payoutData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const availableBalance = totalOnlineNet - totalCounterCommissions - totalPayouts;

      setStats({
        totalOnlineNet,
        totalCounterCommissions,
        totalPayouts,
        availableBalance
      });
    }
    setLoading(false);
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(requestAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Veuillez entrer un montant valide.");
      return;
    }

    if (amount > stats.availableBalance) {
      toast.error("Le montant demandé dépasse votre solde disponible.");
      return;
    }

    setRequesting(true);
    try {
      const { error } = await supabase.from('payouts').insert({
        company_id: companyId,
        amount: amount,
        status: 'PENDING'
      });

      if (error) throw error;

      toast.success("Demande de retrait envoyée avec succès.");
      setRequestAmount("");
      fetchFinances(); // Refresh data
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la demande: " + err.message);
    } finally {
      setRequesting(false);
    }
  };

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
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Finances & Reversements</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Gérez votre portefeuille, vos revenus en ligne et vos dettes de commissions.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="bg-brand-green text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet className="w-16 h-16" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-2">Solde Disponible</p>
            <h3 className="text-3xl font-black">
              {stats.availableBalance.toLocaleString()} <span className="text-lg">FCFA</span>
            </h3>
            {stats.availableBalance < 0 && (
              <p className="text-xs text-red-200 mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> Vous devez payer vos commissions à Tukki.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase">Revenus Nets (En ligne)</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900">{stats.totalOnlineNet.toLocaleString()} FCFA</h3>
          <p className="text-xs text-gray-400 mt-1">Tukki vous doit ce montant</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase">Commissions Guichet</p>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900">{stats.totalCounterCommissions.toLocaleString()} FCFA</h3>
          <p className="text-xs text-gray-400 mt-1">Vous devez ce montant à Tukki</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase">Total Retiré</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900">{stats.totalPayouts.toLocaleString()} FCFA</h3>
          <p className="text-xs text-gray-400 mt-1">Argent déjà reversé</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Payout Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-20">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center">
              <Banknote className="w-5 h-5 mr-2 text-brand-green" /> Demander un retrait
            </h2>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Montant à retirer (FCFA)</label>
                <input 
                  type="number" 
                  required
                  min="1000"
                  max={stats.availableBalance > 0 ? stats.availableBalance : 0}
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  disabled={stats.availableBalance <= 0}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-black text-gray-900 focus:outline-none focus:border-brand-green disabled:opacity-50"
                  placeholder="Ex: 50000"
                />
              </div>
              <button 
                type="submit" 
                disabled={requesting || stats.availableBalance <= 0}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 py-3 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center"
              >
                {requesting ? "Traitement..." : "Envoyer la demande"}
              </button>
              
              {stats.availableBalance <= 0 && (
                <p className="text-xs text-red-500 font-medium text-center bg-red-50 p-2 rounded-lg mt-2">
                  Votre solde est insuffisant pour demander un retrait.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Payouts History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-brand-green" /> Historique des reversements
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 pl-6">Date de demande</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4">Référence</th>
                    <th className="p-4 text-right pr-6">Date de paiement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">
                        Aucune demande de retrait effectuée pour le moment.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 pl-6 text-sm text-gray-900 font-medium">
                          {new Date(payout.requested_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4">
                          <span className="font-black text-gray-900">{payout.amount.toLocaleString()} FCFA</span>
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
                        <td className="p-4 text-right pr-6 text-sm text-gray-500 font-medium">
                          {payout.paid_at 
                            ? new Date(payout.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
