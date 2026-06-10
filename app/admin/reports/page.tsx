import { 
  Download, 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight,
  Filter,
  ArrowDownRight,
  Building2,
  TicketCheck
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

export const revalidate = 0;

export default async function AdminReportsPage() {
  // Fetch real data from Supabase
  const { data: companies } = await supabase.from('companies').select('id, name, color, code');
  const { data: bookings } = await supabase.from('bookings').select('*, trips(company_id, price)');

  const confirmedBookings = bookings?.filter(b => b.status === 'CONFIRMED') || [];
  
  let totalRevenue = 0;
  let totalTickets = 0;
  
  // Aggregate data per company
  const companyReports: Record<string, {
    id: string;
    name: string;
    code: string;
    color: string;
    tickets: number;
    totalRevenue: number;
    platformFee: number;
    netPayout: number;
  }> = {};

  companies?.forEach(company => {
    companyReports[company.id] = {
      id: company.id,
      name: company.name,
      code: company.code,
      color: company.color,
      tickets: 0,
      totalRevenue: 0,
      platformFee: 0,
      netPayout: 0
    };
  });

  confirmedBookings.forEach(booking => {
    const companyId = booking.trips?.company_id;
    if (companyId && companyReports[companyId]) {
      const tickets = booking.selected_seats?.length || 1;
      const revenue = booking.total_price || (booking.trips?.price * tickets) || 0;
      const fee = tickets * 100; // 100 FCFA per ticket

      companyReports[companyId].tickets += tickets;
      companyReports[companyId].totalRevenue += revenue;
      companyReports[companyId].platformFee += fee;
      companyReports[companyId].netPayout += (revenue - fee);
      
      totalTickets += tickets;
      totalRevenue += revenue;
    }
  });

  const totalPlatformFees = totalTickets * 100;
  const totalNetPayout = totalRevenue - totalPlatformFees;

  const sortedCompanies = Object.values(companyReports)
    .filter(c => c.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rapports & Finances</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Analyse détaillée des revenus et commissions de la plateforme.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filtrer</span>
          </button>
          <button className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-900">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
              <span>+12%</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Volume d'Affaires</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalRevenue.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-brand-yellow/10 text-brand-yellow">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
              <span>+18%</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Commissions TUKKI</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalPlatformFees.toLocaleString('fr-FR')} FCFA</p>
            <p className="text-xs font-semibold text-brand-yellow mt-1">Sur la base de 100 FCFA / billet</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-600">
              <span>-2%</span>
              <ArrowDownRight className="w-3 h-3" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Montant à reverser</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalNetPayout.toLocaleString('fr-FR')} FCFA</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">Paiements nets aux compagnies</p>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Bilan détaillé par compagnie</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Compagnie</th>
                <th className="p-4">Billets Vendus</th>
                <th className="p-4">Chiffre d'Affaires</th>
                <th className="p-4">Commissions (TUKKI)</th>
                <th className="p-4 pr-6 text-right">Montant Net (Dû)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                    Aucune donnée financière disponible pour le moment.
                  </td>
                </tr>
              ) : (
                sortedCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white"
                          style={{ backgroundColor: company.color || '#059669' }}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{company.name}</p>
                          <p className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-bold mt-1 inline-block border border-slate-200">
                            {company.code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm font-bold text-slate-700">
                        <TicketCheck className="w-4 h-4 mr-2 text-emerald-500" />
                        {company.tickets}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black text-slate-900">{company.totalRevenue.toLocaleString('fr-FR')} FCFA</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-brand-yellow/20 text-brand-yellow">
                        {company.platformFee.toLocaleString('fr-FR')} FCFA
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <p className="text-sm font-black text-blue-600">{company.netPayout.toLocaleString('fr-FR')} FCFA</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sortedCompanies.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td className="p-4 pl-6 font-black text-slate-900 text-sm">TOTAL</td>
                  <td className="p-4 font-black text-slate-900 text-sm">{totalTickets}</td>
                  <td className="p-4 font-black text-slate-900 text-sm">{totalRevenue.toLocaleString('fr-FR')} FCFA</td>
                  <td className="p-4 font-black text-brand-yellow text-sm">{totalPlatformFees.toLocaleString('fr-FR')} FCFA</td>
                  <td className="p-4 pr-6 text-right font-black text-blue-600 text-sm">{totalNetPayout.toLocaleString('fr-FR')} FCFA</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
