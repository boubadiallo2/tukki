"use client";

import { useState, useEffect } from "react";
import { 
  Ticket, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Building2,
  CalendarDays,
  MapPin,
  Loader2
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

export default function AdminBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, CONFIRMED, PENDING, CANCELLED
  const [timeFilter, setTimeFilter] = useState("all"); // all, today, week, month
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);

  useEffect(() => {
    fetchBookings(timeFilter);
  }, [timeFilter]);

  useEffect(() => {
    let result = bookings;

    if (statusFilter !== "ALL") {
      result = result.filter(b => b.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.booking_number?.toLowerCase().includes(query) ||
        b.passenger_name?.toLowerCase().includes(query) ||
        b.passenger_phone?.includes(query) ||
        b.trips?.companies?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(result);
  }, [searchQuery, statusFilter, bookings]);

  const fetchBookings = async (filter: string) => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select('*, trips(departure_city, arrival_city, trip_date, departure_time, companies(name, color))')
      .order('created_at', { ascending: false });

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

    const { data } = await query;
    setBookings(data || []);
    setLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ["Référence", "Passager", "Téléphone", "Compagnie", "Trajet", "Date", "Sièges", "Prix (FCFA)", "Statut", "Date de réservation"];
    
    const rows = filteredBookings.map(b => [
      b.booking_number,
      `"${b.passenger_name}"`,
      b.passenger_phone,
      `"${b.trips?.companies?.name || 'Inconnue'}"`,
      `"${b.trips?.departure_city} - ${b.trips?.arrival_city}"`,
      b.trips?.trip_date,
      `"${b.selected_seats?.join(', ')}"`,
      b.total_price,
      b.status,
      new Date(b.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reservations_Tukki_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Payé
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-red-50 text-red-600 border border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Annulé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30">
            <Clock className="w-3 h-3 mr-1" /> En attente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Toutes les Réservations</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Gérez et consultez l'historique de toutes les réservations de la plateforme.</p>
        </div>
        
        <div className="flex gap-2 relative">
          <div className="relative">
            <button 
              onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>
                {timeFilter === "all" ? "Toutes les dates" : timeFilter === "today" ? "Aujourd'hui" : timeFilter === "month" ? "Ce mois-ci" : "Cette semaine"}
              </span>
            </button>
            
            {isTimeFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-10 py-1">
                <button 
                  onClick={() => { setTimeFilter("all"); setIsTimeFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "all" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Toutes les dates
                </button>
                <button 
                  onClick={() => { setTimeFilter("today"); setIsTimeFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "today" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Aujourd'hui
                </button>
                <button 
                  onClick={() => { setTimeFilter("week"); setIsTimeFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "week" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Cette semaine
                </button>
                <button 
                  onClick={() => { setTimeFilter("month"); setIsTimeFilterOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-50 ${timeFilter === "month" ? "text-brand-yellow" : "text-slate-700"}`}
                >
                  Ce mois-ci
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleExportCSV}
            disabled={loading || filteredBookings.length === 0}
            className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {["ALL", "CONFIRMED", "PENDING", "CANCELLED"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                statusFilter === status 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {status === "ALL" ? "Toutes" : status === "CONFIRMED" ? "Payées" : status === "PENDING" ? "En attente" : "Annulées"}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par Réf, Passager, Compagnie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 font-medium"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Référence</th>
                <th className="p-4">Passager</th>
                <th className="p-4">Trajet & Date</th>
                <th className="p-4">Compagnie</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow mx-auto" />
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    Aucune réservation trouvée pour ces filtres.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center font-mono font-bold text-sm text-slate-900">
                        <Ticket className="w-4 h-4 mr-2 text-slate-400" />
                        {booking.booking_number}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black text-slate-900">{booking.passenger_name}</p>
                      <p className="text-xs font-medium text-slate-500">{booking.passenger_phone}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm font-bold text-slate-900">
                        <MapPin className="w-3 h-3 mr-1 text-brand-yellow" />
                        {booking.trips?.departure_city} - {booking.trips?.arrival_city}
                      </div>
                      <div className="flex items-center text-xs font-medium text-slate-500 mt-1">
                        <CalendarDays className="w-3 h-3 mr-1" />
                        {booking.trips?.trip_date} à {booking.trips?.departure_time?.slice(0,5)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0 shadow-sm text-white"
                          style={{ backgroundColor: booking.trips?.companies?.color || '#059669' }}
                        >
                          <Building2 className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-black text-slate-900">
                          {booking.trips?.companies?.name || 'Inconnue'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black text-slate-900">{booking.total_price?.toLocaleString('fr-FR')} FCFA</p>
                      <p className="text-xs font-medium text-slate-500">{booking.selected_seats?.length} siège(s)</p>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(booking.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
