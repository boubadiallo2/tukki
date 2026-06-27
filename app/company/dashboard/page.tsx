"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowUpRight,
  Bus,
  Clock,
  Plus
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";
import Link from "next/link";

function TicketIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userInfo, setUserInfo] = useState<{firstName: string, lastName: string} | null>(null);

  useEffect(() => {
    setFilterDate(new Date().toISOString().split('T')[0]);
  }, []);
  
  const [stats, setStats] = useState({
    revenue: 0,
    tickets: 0,
    passengers: 0,
    occupancyRate: 0,
    weeklySales: [] as { date: string, amount: number, label: string }[]
  });
  
  const [departures, setDepartures] = useState<any[]>([]);

  const formatTimeFR = (timeString: string) => {
    if (!timeString) return "";
    return timeString.substring(0, 5).replace(':', 'h');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role, first_name, last_name')
        .eq('id', session.user.id)
        .single();
        
      setUserId(session.user.id);
      if (profile) {
        setUserRole(profile.role);
        if (profile.first_name && profile.last_name) {
          setUserInfo({ firstName: profile.first_name, lastName: profile.last_name });
        }
      }

      if (profile?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', profile.company_id)
          .single();
          
        if (company) setCompanyInfo(company);

        const { data: trips, error } = await supabase
          .from('trips')
          .select('*, bookings(*)')
          .eq('company_id', profile.company_id);
          
        if (trips && trips.length > 0) {
           setAllTrips(trips);
        }
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (allTrips.length > 0) {
      let totalRevenue = 0;
      let totalTickets = 0;
      let uniqueUsers = new Set();
      
      let weeklyData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
        return { date: dateStr, amount: 0, label };
      });
      
      allTrips.forEach(trip => {
        if (trip.bookings) {
          trip.bookings.forEach((b: any) => {
            // Filter logic for agents
            if (userRole === 'company_agent' && b.agent_id !== userId) return;

            const bookingDate = b.created_at ? b.created_at.split('T')[0] : (b.travel_date || trip.trip_date);
            
            // Populate weekly sales (ignores filterDate so the graph always shows the full week)
            if (bookingDate) {
              const dayIndex = weeklyData.findIndex(w => w.date === bookingDate);
              if (dayIndex !== -1 && (b.status === 'CONFIRMED' || b.payment_status === 'PAID')) {
                weeklyData[dayIndex].amount += (b.total_price || trip.price || 0);
              }
            }

            if (filterDate && bookingDate !== filterDate) return;

            if (b.status === 'CONFIRMED' || b.payment_status === 'PAID') {
              totalRevenue += b.total_price || trip.price || 0;
              totalTickets += b.selected_seats?.length || 1;
              if (b.passenger_email || b.passenger_phone) uniqueUsers.add(b.passenger_email || b.passenger_phone);
            }
          });
        }
      });
      
      setStats({
        revenue: totalRevenue,
        tickets: totalTickets,
        passengers: uniqueUsers.size,
        occupancyRate: 0,
        weeklySales: weeklyData
      });

      const targetDate = filterDate ? new Date(filterDate) : new Date();
      const targetDay = targetDate.getDay();

      const upcoming = allTrips
        .filter(t => {
          if (t.is_daily) return true;
          if (t.operating_days && t.operating_days.length > 0) {
            return t.operating_days.includes(targetDay);
          }
          if (filterDate) {
            return t.trip_date === filterDate;
          } else {
            return new Date(t.trip_date) >= new Date(new Date().setHours(0,0,0,0));
          }
        })
        .sort((a,b) => {
          if ((a.is_daily || (a.operating_days && a.operating_days.length > 0)) && (b.is_daily || (b.operating_days && b.operating_days.length > 0))) return a.departure_time.localeCompare(b.departure_time);
          if (a.is_daily || (a.operating_days && a.operating_days.length > 0)) return -1;
          if (b.is_daily || (b.operating_days && b.operating_days.length > 0)) return 1;
          return new Date(a.trip_date).getTime() - new Date(b.trip_date).getTime() || a.departure_time.localeCompare(b.departure_time);
        })
        .slice(0, 5);
        
      setDepartures(upcoming);
    }
  }, [allTrips, filterDate]);

  const isTodayFilter = filterDate === new Date().toISOString().split('T')[0];

  const STATS_UI = [
    {
      title: isTodayFilter ? "Revenu du Jour" : "Revenu Total",
      value: `${stats.revenue.toLocaleString()} FCFA`,
      change: stats.revenue > 0 ? "+0%" : "0%",
      isPositive: true,
      icon: Wallet,
      color: "text-brand-green",
      bgColor: "bg-emerald-50"
    },
    {
      title: isTodayFilter ? "Billets du Jour" : "Billets Vendus",
      value: stats.tickets.toString(),
      change: "0%",
      isPositive: true,
      icon: TicketIcon,
      color: "text-brand-yellow",
      bgColor: "bg-amber-50"
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  const exportDashboardReport = () => {
    const headers = ["Métrique", "Valeur"];
    const rows = [
      ["Revenu Total (FCFA)", stats.revenue],
      ["Billets Vendus", stats.tickets]
    ];

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rapport_dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasData = stats.tickets > 0 || departures.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Bonjour, {userRole === 'company_agent' && userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : companyInfo?.name || "Partenaire"} 👋
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {userRole === 'company_agent' ? "Voici le résumé de vos ventes personnelles." : "Voici le résumé de votre activité."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="flex-1 sm:flex-none bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-brand-green shadow-xs cursor-pointer transition-colors"
            title="Filtrer par date"
          />
          <button 
            onClick={exportDashboardReport}
            className="flex-1 sm:flex-none justify-center bg-brand-green text-white hover:bg-brand-green-dark px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <span>Exporter le rapport</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {STATS_UI.map((stat, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-7 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-black text-gray-900">Ventes de la semaine</h2>
            {hasData && (
              <select className="bg-gray-50 border border-gray-100 text-gray-600 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-brand-green">
                <option>Cette semaine</option>
                <option>Semaine dernière</option>
              </select>
            )}
          </div>

          {!hasData ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <TrendingUp className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Aucune vente pour le moment</h3>
              <p className="text-sm text-gray-500 max-w-sm mb-6">
                Le graphique de vos ventes apparaîtra ici dès que vos premiers clients réserveront vos trajets.
              </p>
              <Link 
                href="/company/trips"
                className="inline-flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Créer mon premier trajet</span>
              </Link>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-2 pt-8">
              {stats.weeklySales?.map((day, i) => {
                const maxAmount = Math.max(...stats.weeklySales.map(d => d.amount), 1);
                const heightPercentage = (day.amount / maxAmount) * 100;
                
                return (
                  <div key={i} className="flex flex-col items-center justify-end w-full h-full group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap pointer-events-none z-10">
                      {day.amount.toLocaleString()} FCFA
                    </div>
                    <div 
                      className="w-full max-w-[40px] bg-brand-green/20 group-hover:bg-brand-green rounded-t-lg transition-all duration-300 relative overflow-hidden"
                      style={{ height: `${Math.max(heightPercentage, 4)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-green/40 to-transparent"></div>
                    </div>
                    <span className="text-xs font-bold text-gray-400 mt-3 uppercase">{day.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-900">Prochains départs</h2>
            {departures.length > 0 && (
              <Link href="/company/trips" className="text-brand-green hover:underline text-xs font-bold">Voir tout</Link>
            )}
          </div>
          
          <div className="space-y-4 flex-1">
            {!hasData || departures.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Bus className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-bold text-gray-400">Aucun départ prévu</p>
              </div>
            ) : (
              departures.map((departure) => (
                <div key={departure.id} className="flex items-start justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="bg-emerald-50 text-brand-green p-2 rounded-lg mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">
                        {formatTimeFR(departure.departure_time)}
                      </p>
                      <p className="text-xs font-bold text-gray-600 mt-0.5">
                        {departure.departure_city} ➔ {departure.arrival_city}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${departure.is_daily ? 'bg-emerald-100 text-emerald-700' : departure.operating_days && departure.operating_days.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {departure.is_daily ? 'Quotidien' : departure.operating_days && departure.operating_days.length > 0 ? 'Récurrent' : 'Prévu'}
                    </span>
                    <p className="text-xs font-bold text-gray-500 mt-1">
                      {departure.bookings?.length || 0} résa.
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
