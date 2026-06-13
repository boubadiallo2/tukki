"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, Clock, CheckCircle, XCircle, MoreVertical, Eye, Download, Loader2, RotateCcw, AlertTriangle, Check, X } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous les statuts");
  const [filterRoute, setFilterRoute] = useState("Tous les trajets");
  const [filterDate, setFilterDate] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Actions menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Alert state
  const [alertContent, setAlertContent] = useState<{title: string, message: string, type: 'success' | 'error'} | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session.user.id).single();
      
    if (profile?.company_id) {
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

  useEffect(() => {
    fetchBookings();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.actions-dropdown')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const formatTimeFR = (timeString: string) => {
    if (!timeString) return "";
    return timeString.substring(0, 5).replace(':', 'h');
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      setIsCancelModalOpen(false);
      fetchBookings();
      setAlertContent({
        type: 'success',
        title: "Réservation annulée",
        message: "La réservation a été annulée avec succès. Les places sont de nouveau disponibles."
      });
    } catch (err: any) {
      console.error(err);
      setAlertContent({ type: 'error', title: "Erreur", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !newDate) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ travel_date: newDate })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      setIsDateModalOpen(false);
      fetchBookings();
      setAlertContent({
        type: 'success',
        title: "Date modifiée",
        message: "La date de voyage a été mise à jour avec succès."
      });
    } catch (err: any) {
      console.error(err);
      setAlertContent({ type: 'error', title: "Erreur", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract unique routes for the filter dropdown
  const uniqueRoutes = Array.from(new Set(bookings.map(b => `${b.trips?.departure_city} ➔ ${b.trips?.arrival_city}`))).filter(Boolean);

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.passenger_phone.includes(searchTerm);
      
    let matchesStatus = true;
    if (filterStatus === "Confirmé") matchesStatus = b.status === 'CONFIRMED' || b.payment_status === 'PAID';
    else if (filterStatus === "En attente") matchesStatus = b.status !== 'CONFIRMED' && b.status !== 'CANCELLED' && b.payment_status !== 'PAID';
    else if (filterStatus === "Annulé") matchesStatus = b.status === 'CANCELLED';

    let matchesRoute = true;
    if (filterRoute !== "Tous les trajets") {
      const routeStr = `${b.trips?.departure_city} ➔ ${b.trips?.arrival_city}`;
      matchesRoute = routeStr === filterRoute;
    }

    let matchesDate = true;
    if (filterDate) {
       const bDate = b.travel_date || b.trips?.trip_date;
       matchesDate = bDate === filterDate;
    }

    return matchesSearch && matchesStatus && matchesRoute && matchesDate;
  });

  const expandedBookings = filteredBookings.flatMap(booking => {
    const names = booking.passenger_name.split(',').map((n: string) => n.trim()).filter(Boolean);
    const seats = booking.selected_seats || [];
    
    if (names.length <= 1) {
      return [{
        ...booking,
        virtual_id: booking.id,
        virtual_name: booking.passenger_name,
        virtual_seat: seats,
        virtual_price: booking.total_price,
        is_group: false
      }];
    }

    return names.map((name: string, idx: number) => ({
      ...booking,
      virtual_id: `${booking.id}-${idx}`,
      virtual_name: name,
      virtual_seat: seats[idx] ? [seats[idx]] : seats, // Assign corresponding seat
      virtual_price: booking.total_price / names.length, // Divide price equally
      is_group: true,
      group_size: names.length
    }));
  });

  const exportToCSV = () => {
    if (expandedBookings.length === 0) {
      setAlertContent({
        type: 'error',
        title: "Export impossible",
        message: "Il n'y a aucune réservation à exporter avec les filtres actuels."
      });
      return;
    }

    const headers = [
      "N° Billet",
      "Client",
      "Téléphone",
      "Départ",
      "Arrivée",
      "Date",
      "Heure",
      "Sièges",
      "Montant (FCFA)",
      "Paiement",
      "Statut"
    ];

    const rows = expandedBookings.map(b => {
      const dateOfTravel = b.travel_date || b.trips?.trip_date;
      const formattedDate = dateOfTravel ? new Date(dateOfTravel).toLocaleDateString('fr-FR') : "Quotidien";
      const statusStr = b.status === 'CANCELLED' ? "Annulé" : "Confirmé";
      
      return [
        b.booking_number,
        `"${b.virtual_name}"`,
        b.passenger_phone,
        `"${b.trips?.departure_city}"`,
        `"${b.trips?.arrival_city}"`,
        formattedDate,
        formatTimeFR(b.trips?.departure_time),
        `"${b.virtual_seat?.join(', ') || ''}"`,
        b.virtual_price,
        b.payment_method || 'Espèces',
        statusStr
      ];
    });

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reservations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Réservations Clients</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérez les billets, validez les paiements et consultez les historiques.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exporter la liste</span>
        </button>
      </div>

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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input 
            type="date"
            className="flex-1 sm:flex-none bg-gray-50 border border-gray-100 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-hidden focus:border-brand-green cursor-pointer"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            title="Filtrer par date de voyage"
          />
          <select 
            className="flex-1 sm:flex-none bg-gray-50 border border-gray-100 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-hidden focus:border-brand-green cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>Tous les statuts</option>
            <option>Confirmé</option>
            <option>En attente</option>
            <option>Annulé</option>
          </select>
          <select 
            className="flex-1 sm:flex-none bg-gray-50 border border-gray-100 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-hidden focus:border-brand-green cursor-pointer"
            value={filterRoute}
            onChange={(e) => setFilterRoute(e.target.value)}
          >
            <option>Tous les trajets</option>
            {uniqueRoutes.map(route => (
              <option key={route} value={route}>{route}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
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
              ) : expandedBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <p className="text-sm font-bold text-gray-400">Aucune réservation trouvée.</p>
                  </td>
                </tr>
              ) : expandedBookings.map((booking) => {
                const dateOfTravel = booking.travel_date || booking.trips?.trip_date;
                const formattedDate = dateOfTravel ? new Date(dateOfTravel).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Tous les jours";
                const isCancelled = booking.status === 'CANCELLED';

                return (
                <tr key={booking.virtual_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div>
                      <p className={`font-black text-sm ${isCancelled ? 'text-gray-400 line-through' : 'text-brand-green'}`}>{booking.booking_number}</p>
                      <p className={`font-bold mt-1 ${isCancelled ? 'text-gray-400' : 'text-gray-900'}`}>{booking.virtual_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{booking.passenger_phone}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className={`text-sm font-bold ${isCancelled ? 'text-gray-400' : 'text-gray-900'}`}>{booking.trips?.departure_city} ➔ {booking.trips?.arrival_city}</p>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 mt-1">
                      {booking.trips?.is_daily && !booking.travel_date ? (
                         <span className={`flex items-center px-1 rounded ${isCancelled ? 'text-gray-400 bg-gray-100' : 'text-emerald-600 bg-emerald-50'}`}><RotateCcw className="w-3 h-3 mr-1" /> Quotidien</span>
                      ) : (
                         <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {formattedDate}</span>
                      )}
                      <span>•</span>
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatTimeFR(booking.trips?.departure_time)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-widest border whitespace-nowrap ${isCancelled ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {booking.virtual_seat?.join(", ") || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className={`text-sm font-black ${isCancelled ? 'text-gray-400' : 'text-gray-900'}`}>{booking.virtual_price?.toLocaleString()} FCFA</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Payé par {booking.payment_method || 'Espèces'}</p>
                  </td>
                  <td className="p-4">
                    {!isCancelled ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirmé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        <XCircle className="w-3 h-3 mr-1" />
                        Annulé
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right relative actions-dropdown">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-400 hover:text-brand-green hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Voir les détails">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === booking.virtual_id ? null : booking.virtual_id)}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" 
                        title="Plus d'actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dropdown Menu */}
                    {openMenuId === booking.virtual_id && (
                      <div className="absolute right-6 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNewDate(booking.travel_date || booking.trips?.trip_date || "");
                            setIsDateModalOpen(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Modifier la date</span>
                        </button>
                        {!isCancelled && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsCancelModalOpen(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span>Annuler réservation</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'annulation */}
      {isCancelModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Annuler la réservation ?</h3>
              <p className="text-sm text-gray-500 font-medium">
                Voulez-vous vraiment annuler la réservation <strong className="text-gray-900">{selectedBooking.booking_number}</strong> de <strong className="text-gray-900">{selectedBooking.virtual_name}</strong> ?
                {selectedBooking.is_group && (
                  <span className="block mt-3 text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-left">
                    <AlertTriangle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    <strong>Attention :</strong> Ceci est une réservation de groupe. L'annulation supprimera les <strong>{selectedBooking.group_size} places</strong> associées à ce billet.
                  </span>
                )}
                <br /><br />
                Les sièges redeviendront disponibles à la vente.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
              <button 
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button 
                onClick={handleCancelBooking}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Oui, annuler"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier Date */}
      {isDateModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">Modifier la date</h3>
              <button onClick={() => setIsDateModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-1 border border-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangeDate} className="p-6 space-y-4">
              <p className="text-sm text-gray-500 font-medium mb-4">
                Changement de date pour la réservation <strong className="text-gray-900">{selectedBooking.booking_number}</strong>.
              </p>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nouvelle date de voyage</label>
                <input 
                  type="date" required 
                  value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsDateModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-brand-green hover:bg-brand-green-dark text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enregistrer</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              {alertContent.type === 'error' ? (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              <h3 className="text-xl font-black text-gray-900 mb-2">{alertContent.title}</h3>
              <p className="text-sm text-gray-500 font-medium">{alertContent.message}</p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setAlertContent(null)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
