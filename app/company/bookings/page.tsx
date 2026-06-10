"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Clock, CheckCircle, XCircle, MoreVertical, Eye, Download, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTimeFR = (timeString: string) => {
    if (!timeString) return "";
    return timeString.substring(0, 5).replace(':', 'h');
  };

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session.user.id).single();
        
      if (profile?.company_id) {
        // Fetch bookings for all trips belonging to this company
        const { data, error } = await supabase
          .from('bookings')
          .select('*, trips!inner(*)')
          .eq('trips.company_id', profile.company_id)
          .order('created_at', { ascending: false });
        
        if (data) {
          setBookings(data);
        }
      }
      setLoading(false);
    };

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(b => 
    b.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.passenger_phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Réservations Clients</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérez les billets, validez les paiements et consultez les historiques.</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center space-x-2 cursor-pointer">
          <Download className="w-4 h-4" />
          <span>Exporter la liste</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Rechercher un n° de billet ou nom..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-hidden focus:border-brand-green focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto opacity-50 pointer-events-none" title="Filtres bientôt disponibles">
          <select className="flex-1 sm:flex-none bg-gray-50 border border-gray-100 text-gray-500 text-sm font-semibold rounded-xl px-4 py-2">
            <option>Tous les statuts</option>
          </select>
          <select className="flex-1 sm:flex-none bg-gray-50 border border-gray-100 text-gray-500 text-sm font-semibold rounded-xl px-4 py-2">
            <option>Tous les trajets</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">N° Billet & Client</th>
                <th className="p-4">Trajet</th>
                <th className="p-4">Sièges</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Statut</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-green" />
                    <p className="font-bold">Chargement des réservations...</p>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <p className="text-sm font-bold text-gray-400">Aucune réservation trouvée.</p>
                  </td>
                </tr>
              ) : filteredBookings.map((booking) => {
                const dateOfTravel = booking.travel_date || booking.trips?.trip_date;
                const formattedDate = dateOfTravel ? new Date(dateOfTravel).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Tous les jours";

                return (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div>
                      <p className="font-black text-brand-green text-sm">{booking.booking_number}</p>
                      <p className="font-bold text-gray-900 mt-1">{booking.passenger_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{booking.passenger_phone}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-900">{booking.trips?.departure_city} ➔ {booking.trips?.arrival_city}</p>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 mt-1">
                      {booking.trips?.is_daily && !booking.travel_date ? (
                         <span className="flex items-center text-emerald-600 bg-emerald-50 px-1 rounded"><RotateCcw className="w-3 h-3 mr-1" /> Quotidien</span>
                      ) : (
                         <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {formattedDate}</span>
                      )}
                      <span>•</span>
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatTimeFR(booking.trips?.departure_time)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold tracking-widest border border-amber-100 whitespace-nowrap">
                      {booking.selected_seats?.join(", ") || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-black text-gray-900">{booking.total_price?.toLocaleString()} FCFA</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Payé par {booking.payment_method || 'Espèces'}</p>
                  </td>
                  <td className="p-4">
                    {booking.status === 'CONFIRMED' || booking.payment_status === 'PAID' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirmé
                      </span>
                    ) : booking.status === 'CANCELLED' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        <XCircle className="w-3 h-3 mr-1" />
                        Annulé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <Clock className="w-3 h-3 mr-1" />
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-400 hover:text-brand-green hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Voir les détails">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Plus d'actions">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
