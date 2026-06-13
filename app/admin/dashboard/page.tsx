"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight,
  Building2,
  TicketCheck,
  CreditCard,
  Users,
  Download,
  Filter,
  Loader2
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalTickets: 0,
    platformRevenue: 0
  });

  const [topCompanies, setTopCompanies] = useState<any[]>([]);
  const [exportData, setExportData] = useState<any[]>([]); // specifically for the export CSV

  useEffect(() => {
    fetchData(timeFilter);
  }, [timeFilter]);

  const fetchData = async (filter: string) => {
    setLoading(true);
    
    // Fetch real data from Supabase
    const { data: companies } = await supabase.from('companies').select('*');
    let query = supabase.from('bookings').select('*, trips(company_id, companies(name))');
    
    // Apply date filters if needed
    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfDay.toISOString());
    } else if (filter === "month") {
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

    const totalCompanies = companies?.length || 0;
    const totalBookings = bookings?.length || 0;
    
    // Calculate total revenue from CONFIRMED bookings
    const confirmedBookings = bookings?.filter(b => b.status === 'CONFIRMED') || [];
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const totalTickets = confirmedBookings.reduce((sum, b) => sum + (b.selected_seats?.length || 1), 0);
    const platformRevenue = totalTickets * 100; // 100 FCFA per ticket

    setStats({
      totalCompanies,
      totalBookings,
      totalRevenue,
      totalTickets,
      platformRevenue
    });

    // Calculate top companies based on bookings
    const companyStats: Record<string, { revenue: number, tickets: number, name: string }> = {};
    
    confirmedBookings.forEach(booking => {
      // @ts-ignore
      const companyId = booking.trips?.company_id;
      // @ts-ignore
      const companyName = booking.trips?.companies?.name || 'Inconnue';
      
      if (companyId) {
        if (!companyStats[companyId]) {
          companyStats[companyId] = { revenue: 0, tickets: 0, name: companyName };
        }
        companyStats[companyId].revenue += booking.total_price;
        companyStats[companyId].tickets += booking.selected_seats?.length || 1;
      }
    });

    const topCompaniesArray = Object.values(companyStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)
      .map(c => ({
        name: c.name,
        revenue: `${c.revenue.toLocaleString('fr-FR')} FCFA`,
        tickets: c.tickets,
        growth: "+10%" // Placeholder for now
      }));

    setTopCompanies(topCompaniesArray.length > 0 ? topCompaniesArray : [
      { name: "Aucune donnée", revenue: "0 FCFA", tickets: 0, growth: "0%" }
    ]);

    // Keep raw stats for CSV export
    const exportArray = Object.values(companyStats)
      .sort((a, b) => b.revenue - a.revenue)
      .map(c => ({
        name: c.name,
        revenue: c.revenue,
        tickets: c.tickets,
        platformFee: c.tickets * 100
      }));
    setExportData(exportArray);

    setLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ["Compagnie", "Billets Vendus", "Chiffre d'Affaires Global (FCFA)", "Commissions TUKKI (FCFA)"];
    
    const rows = exportData.map(r => [
      `"${r.name}"`,
      r.tickets,
      r.revenue,
      r.platformFee
    ]);

    rows.push([
      '"TOTAL"',
      stats.totalTickets,
      stats.totalRevenue,
      stats.platformRevenue
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bilan_Global_Tukki_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const STATS_CARDS = [
    {
      title: "Volume d'Affaires Global",
      value: `${stats.totalRevenue.toLocaleString('fr-FR')} FCFA`,
      change: "+15.2%",
      isPositive: true,
      icon: Wallet,
      color: "text-slate-900",
      bgColor: "bg-slate-100"
    },
    {
      title: "Revenus Plateforme (100F/billet)",
      value: `${stats.platformRevenue.toLocaleString('fr-FR')} FCFA`,
      change: "+18.5%",
      isPositive: true,
      icon: TrendingUp,
      color: "text-brand-yellow",
      bgColor: "bg-brand-yellow/10"
    },
    {
      title: "Billets Vendus",
      value: stats.totalBookings.toString(),
      change: "+12.1%",
      isPositive: true,
      icon: TicketCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Compagnies Actives",
      value: stats.totalCompanies.toString(),
      change: "+2",
      isPositive: true,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vue Globale Plateforme 🌍</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Supervisez l'activité de toutes les compagnies partenaires.</p>
        </div>
        
        <div className="flex gap-2 relative">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>
                {timeFilter === "all" ? "Toutes les dates" : timeFilter === "today" ? "Aujourd'hui" : timeFilter === "month" ? "Ce mois-ci" : "Cette semaine"}
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
                  onClick={() => { setTimeFilter("today"); setIsFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "today" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Aujourd'hui
                </button>
                <button 
                  onClick={() => { setTimeFilter("week"); setIsFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "week" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Cette semaine
                </button>
                <button 
                  onClick={() => { setTimeFilter("month"); setIsFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "month" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Ce mois-ci
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleExportCSV}
            disabled={loading || exportData.length === 0}
            className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger Bilan</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-300">
            {STATS_CARDS.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${
                    stat.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  }`}>
                    <span>{stat.change}</span>
                    {stat.isPositive && <ArrowUpRight className="w-3 h-3" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Performance Chart (Placeholder because we don't have daily data yet) */}
            <div className="lg:col-span-2 bg-white p-7 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Évolution des Commissions</h2>
                  <p className="text-xs text-gray-500 font-semibold mt-1">Revenus générés par les frais de service</p>
                </div>
              </div>
              <div className="h-64 flex items-end justify-between gap-2">
                {[30, 45, 40, 60, 55, 80, 95].map((height, i) => (
                  <div key={i} className="w-full flex flex-col justify-end items-center group">
                    <div 
                      className="w-full bg-[#FBC02D]/30 group-hover:bg-[#FBC02D] rounded-t-sm transition-colors relative"
                      style={{ height: `${height}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(height * 1.5).toFixed(0)}k
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Companies */}
            <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-gray-900">Top Partenaires</h2>
                <Link href="/admin/companies" className="text-slate-600 hover:text-slate-900 hover:underline text-xs font-bold">Voir tout</Link>
              </div>
              <div className="space-y-4">
                {topCompanies.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center text-sm border border-slate-200">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{company.name}</p>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 mt-0.5">
                          <span className="flex items-center"><TicketCheck className="w-3 h-3 mr-1" /> {company.tickets}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{company.revenue}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold ${
                        company.growth.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {company.growth} ce mois
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
