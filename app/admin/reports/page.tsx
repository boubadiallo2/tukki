"use client";

import { useState, useEffect } from "react";
import { 
  Download, 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight,
  Filter,
  ArrowDownRight,
  Building2,
  TicketCheck,
  Loader2
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

type CompanyReport = {
  id: string;
  name: string;
  code: string;
  color: string;
  tickets: number;
  totalRevenue: number;
  platformFee: number;
  netPayout: number;
};

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<CompanyReport[]>([]);
  const [totals, setTotals] = useState({
    tickets: 0,
    revenue: 0,
    platformFees: 0,
    netPayout: 0
  });

  const [timeFilter, setTimeFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchData(timeFilter);
  }, [timeFilter]);

  const fetchData = async (filter: string) => {
    setLoading(true);
    
    // Fetch real data from Supabase
    const { data: companies } = await supabase.from('companies').select('id, name, color, code');
    let query = supabase.from('bookings').select('*, trips(company_id, price)');
    
    // Apply date filters if needed
    if (filter === "month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfMonth.toISOString());
    } else if (filter === "week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfWeek.toISOString());
    }

    const { data: bookings } = await query;

    const confirmedBookings = bookings?.filter(b => b.status === 'CONFIRMED') || [];
    
    let totalRev = 0;
    let totalTix = 0;
    
    const companyReports: Record<string, CompanyReport> = {};

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
      // @ts-ignore
      const companyId = booking.trips?.company_id;
      if (companyId && companyReports[companyId]) {
        const tickets = booking.selected_seats?.length || 1;
        // @ts-ignore
        const revenue = booking.total_price || (booking.trips?.price * tickets) || 0;
        const fee = tickets * 100; // 100 FCFA per ticket

        companyReports[companyId].tickets += tickets;
        companyReports[companyId].totalRevenue += revenue;
        companyReports[companyId].platformFee += fee;
        companyReports[companyId].netPayout += (revenue - fee);
        
        totalTix += tickets;
        totalRev += revenue;
      }
    });

    const totalFees = totalTix * 100;
    const totalNet = totalRev - totalFees;

    const sorted = Object.values(companyReports)
      .filter(c => c.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    setReports(sorted);
    setTotals({
      tickets: totalTix,
      revenue: totalRev,
      platformFees: totalFees,
      netPayout: totalNet
    });
    setLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ["Compagnie", "Code", "Billets Vendus", "Chiffre d'Affaires (FCFA)", "Commissions TUKKI (FCFA)", "Montant Net Dû (FCFA)"];
    
    const rows = reports.map(r => [
      `"${r.name}"`,
      r.code,
      r.tickets,
      r.totalRevenue,
      r.platformFee,
      r.netPayout
    ]);

    // Add totals row at the bottom
    rows.push([
      '"TOTAL"',
      '""',
      totals.tickets,
      totals.revenue,
      totals.platformFees,
      totals.netPayout
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rapport_Financier_Tukki_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rapports & Finances</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Analyse détaillée des revenus et commissions de la plateforme.</p>
        </div>
        <div className="flex gap-2 relative">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>
                {timeFilter === "all" ? "Toutes les dates" : timeFilter === "month" ? "Ce mois-ci" : "Cette semaine"}
              </span>
            </button>
            
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-10 py-1">
                <button 
                  onClick={() => { setTimeFilter("all"); setIsFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "all" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Toutes les dates
                </button>
                <button 
                  onClick={() => { setTimeFilter("month"); setIsFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "month" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Ce mois-ci
                </button>
                <button 
                  onClick={() => { setTimeFilter("week"); setIsFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "week" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Cette semaine
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleExportCSV}
            disabled={loading || reports.length === 0}
            className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-100 text-slate-900">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Volume d'Affaires</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{totals.revenue.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-brand-yellow/10 text-brand-yellow">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Commissions TUKKI</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{totals.platformFees.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs font-semibold text-brand-yellow mt-1">Sur la base de 100 FCFA / billet</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Montant à reverser</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{totals.netPayout.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs font-semibold text-slate-400 mt-1">Paiements nets aux compagnies</p>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
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
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                        Aucune donnée financière disponible pour la période sélectionnée.
                      </td>
                    </tr>
                  ) : (
                    reports.map((company) => (
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
                {reports.length > 0 && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td className="p-4 pl-6 font-black text-slate-900 text-sm">TOTAL</td>
                      <td className="p-4 font-black text-slate-900 text-sm">{totals.tickets}</td>
                      <td className="p-4 font-black text-slate-900 text-sm">{totals.revenue.toLocaleString('fr-FR')} FCFA</td>
                      <td className="p-4 font-black text-brand-yellow text-sm">{totals.platformFees.toLocaleString('fr-FR')} FCFA</td>
                      <td className="p-4 pr-6 text-right font-black text-blue-600 text-sm">{totals.netPayout.toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
