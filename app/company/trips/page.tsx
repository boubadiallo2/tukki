"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MapPin, Calendar, Clock, Edit2, Trash2, Users, MoreVertical, Loader2, X, AlertTriangle, Check, RotateCcw } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

const CITIES = [
  'Dakar', 'Thiès', 'Touba', 'Ziguinchor', 'Saint-Louis', 
  'Mbour', 'Kaolack', 'Louga', 'Fatick', 'Diourbel', 
  'Kolda', 'Tambacounda', 'Kédougou', 'Kaffrine', 'Matam', 'Sédhiou'
].sort();

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<{id: string, route: string} | null>(null);
  const [alertContent, setAlertContent] = useState<{title: string, message: string, type: 'success' | 'error'} | null>(null);

  // Form states
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [newFrom, setNewFrom] = useState("Dakar");
  const [newTo, setNewTo] = useState("Thiès");
  const [newDate, setNewDate] = useState("");
  const [newIsDaily, setNewIsDaily] = useState(false);
  const [newDepTime, setNewDepTime] = useState("");
  const [newArrTime, setNewArrTime] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newTotalSeats, setNewTotalSeats] = useState("50");
  const [newCreateInverse, setNewCreateInverse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session.user.id).single();
      
    if (profile?.company_id) {
      setCompanyId(profile.company_id);
      const { data, error } = await supabase
        .from('trips')
        .select('*, bookings(*)')
        .eq('company_id', profile.company_id)
        .order('is_daily', { ascending: false })
        .order('trip_date', { ascending: false })
        .order('departure_time', { ascending: true });
      
      if (data) setTrips(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const computeDuration = (depTime: string, arrTime: string) => {
    if (!depTime || !arrTime) return "0h 00m";
    const [depH, depM] = depTime.split(':').map(Number);
    const [arrH, arrM] = arrTime.split(':').map(Number);
    let diffMinutes = (arrH * 60 + arrM) - (depH * 60 + depM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Next day arrival
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  const formatTimeFR = (timeString: string) => {
    if (!timeString) return "";
    return timeString.substring(0, 5).replace(':', 'h');
  };

  const resetForm = () => {
    setNewFrom("Dakar");
    setNewTo("Thiès");
    setNewDate("");
    setNewIsDaily(false);
    setNewDepTime("");
    setNewArrTime("");
    setNewPrice("");
    setNewTotalSeats("50");
    setNewCreateInverse(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (trip: any) => {
    setEditingTripId(trip.id);
    setNewFrom(trip.departure_city);
    setNewTo(trip.arrival_city);
    setNewDate(trip.trip_date || "");
    setNewIsDaily(trip.is_daily || false);
    setNewDepTime(trip.departure_time.substring(0, 5));
    setNewArrTime(trip.arrival_time.substring(0, 5));
    setNewPrice(trip.price.toString());
    setNewTotalSeats(trip.total_seats.toString());
    setIsEditModalOpen(true);
  };

  const promptDeleteTrip = (id: string, from: string, to: string) => {
    setTripToDelete({ id, route: `${from} ➔ ${to}` });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return;
    try {
      const { error } = await supabase.from('trips').delete().eq('id', tripToDelete.id);
      if (error) throw error;
      
      setIsDeleteModalOpen(false);
      setTripToDelete(null);
      fetchTrips();
      
      setAlertContent({
        type: 'success',
        title: "Trajet supprimé",
        message: "Le trajet a été retiré de la plateforme avec succès."
      });
    } catch (err: any) {
      console.error(err);
      setIsDeleteModalOpen(false);
      setAlertContent({ type: 'error', title: "Erreur", message: err.message });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setIsSubmitting(true);

    try {
      if (newFrom === newTo) {
        throw new Error("La ville de départ et d'arrivée ne peuvent pas être identiques.");
      }

      if (!newIsDaily && !newDate) {
        throw new Error("Veuillez sélectionner une date, ou cocher 'Tous les jours'.");
      }

      const duration = computeDuration(newDepTime, newArrTime);
      const totalSeatsNum = parseInt(newTotalSeats, 10);

      const tripsToInsert = [{
        company_id: companyId,
        departure_city: newFrom,
        arrival_city: newTo,
        trip_date: newIsDaily ? null : newDate,
        is_daily: newIsDaily,
        departure_time: newDepTime,
        arrival_time: newArrTime,
        duration: duration,
        price: parseInt(newPrice, 10),
        total_seats: totalSeatsNum,
        available_seats: totalSeatsNum, // All seats available initially
        occupied_seats: []
      }];

      if (newCreateInverse) {
        tripsToInsert.push({
          company_id: companyId,
          departure_city: newTo,
          arrival_city: newFrom,
          trip_date: newIsDaily ? null : newDate,
          is_daily: newIsDaily,
          departure_time: newDepTime,
          arrival_time: newArrTime,
          duration: duration,
          price: parseInt(newPrice, 10),
          total_seats: totalSeatsNum,
          available_seats: totalSeatsNum,
          occupied_seats: []
        });
      }

      const { error } = await supabase.from('trips').insert(tripsToInsert);

      if (error) throw error;

      setIsModalOpen(false);
      resetForm();
      fetchTrips();
      
      setAlertContent({
        type: 'success',
        title: "Trajet créé",
        message: "Le nouveau trajet est désormais visible pour les clients."
      });
    } catch (error: any) {
      console.error(error);
      setAlertContent({ type: 'error', title: "Erreur", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (newFrom === newTo) {
        throw new Error("La ville de départ et d'arrivée ne peuvent pas être identiques.");
      }

      if (!newIsDaily && !newDate) {
        throw new Error("Veuillez sélectionner une date, ou cocher 'Tous les jours'.");
      }

      const duration = computeDuration(newDepTime, newArrTime);
      const totalSeatsNum = parseInt(newTotalSeats, 10);

      const currentTrip = trips.find(t => t.id === editingTripId);
      const bookedCount = currentTrip?.bookings?.filter((b:any) => b.status === 'CONFIRMED').length || 0;
      const newAvailable = totalSeatsNum - bookedCount;

      const { error } = await supabase.from('trips').update({
        departure_city: newFrom,
        arrival_city: newTo,
        trip_date: newIsDaily ? null : newDate,
        is_daily: newIsDaily,
        departure_time: newDepTime,
        arrival_time: newArrTime,
        duration: duration,
        price: parseInt(newPrice, 10),
        total_seats: totalSeatsNum,
        available_seats: newAvailable >= 0 ? newAvailable : 0
      }).eq('id', editingTripId);

      if (error) throw error;

      setIsEditModalOpen(false);
      fetchTrips();
      
      setAlertContent({
        type: 'success',
        title: "Trajet modifié",
        message: "Les modifications ont bien été enregistrées."
      });
    } catch (error: any) {
      console.error(error);
      setAlertContent({ type: 'error', title: "Erreur", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTrips = trips.filter(t => 
    t.departure_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.arrival_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderFormContent = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Ville de départ</label>
          <select 
            required 
            value={newFrom} onChange={(e) => setNewFrom(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          >
            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Ville d'arrivée</label>
          <select 
            required 
            value={newTo} onChange={(e) => setNewTo(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          >
            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={newIsDaily}
            onChange={(e) => setNewIsDaily(e.target.checked)}
            className="w-4 h-4 text-brand-green rounded border-gray-300 focus:ring-brand-green"
          />
          <span className="text-sm font-bold text-gray-900">Ce trajet a lieu tous les jours</span>
        </label>
        
        {!newIsDaily && (
          <div className="animate-in fade-in slide-in-from-top-1">
            <label className="block text-sm font-bold text-gray-900 mb-1">Date précise du départ</label>
            <input 
              type="date" required={!newIsDaily}
              value={newDate} onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Heure de départ</label>
          <input 
            type="time" required 
            value={newDepTime} onChange={(e) => setNewDepTime(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Heure d'arrivée</label>
          <input 
            type="time" required 
            value={newArrTime} onChange={(e) => setNewArrTime(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Prix du billet (FCFA)</label>
          <input 
            type="number" required min="500" step="100"
            value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            placeholder="Ex: 5000"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">Nombre de places</label>
          <input 
            type="number" required min="1" max="100"
            value={newTotalSeats} onChange={(e) => setNewTotalSeats(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            placeholder="Ex: 50"
          />
        </div>
      </div>

      {!isEdit && (
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mt-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={newCreateInverse}
              onChange={(e) => setNewCreateInverse(e.target.checked)}
              className="w-4 h-4 text-brand-green rounded border-gray-300 focus:ring-brand-green"
            />
            <span className="text-sm font-bold text-gray-900">
              Créer automatiquement le trajet inverse ({newTo} ➔ {newFrom})
            </span>
          </label>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3 mt-6">
        <button 
          type="button" 
          onClick={() => isEdit ? setIsEditModalOpen(false) : setIsModalOpen(false)}
          className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
        >
          Annuler
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50 ${
            isEdit ? "bg-blue-600 hover:bg-blue-700" : "bg-brand-green hover:bg-brand-green-dark"
          }`}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isEdit ? "Enregistrer" : "Créer le trajet"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestion des Trajets</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Créez et modifiez vos lignes de transport.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-brand-green text-white hover:bg-brand-green-dark px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau trajet</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Rechercher par ville ou identifiant..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Trips List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Trajet & Date</th>
                <th className="p-4">Places (Remplissage)</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Statut</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-green" />
                    Chargement des trajets...
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-400">Aucun trajet trouvé.</p>
                  </td>
                </tr>
              ) : filteredTrips.map((trip) => {
                const bookedCount = trip.bookings?.filter((b:any) => b.status === 'CONFIRMED' || b.payment_status === 'PAID')
                  .reduce((sum: number, b: any) => sum + (b.selected_seats?.length || 1), 0) || 0;
                const isFull = bookedCount >= trip.total_seats;
                
                return (
                <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm">{trip.departure_city} ➔ {trip.arrival_city}</p>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 mt-1">
                          {trip.is_daily ? (
                            <span className="flex items-center px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider">
                              <RotateCcw className="w-3 h-3 mr-1" /> Tous les jours
                            </span>
                          ) : (
                            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-gray-400" /> {trip.trip_date}</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-gray-400" /> 
                            {formatTimeFR(trip.departure_time)} - {formatTimeFR(trip.arrival_time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                        <div 
                          className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-brand-green'}`} 
                          style={{ width: `${Math.min((bookedCount / trip.total_seats) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{bookedCount}/{trip.total_seats}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-black text-gray-900">{trip.price.toLocaleString()} FCFA</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                      isFull ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {isFull ? 'Complet' : 'Disponible'}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(trip)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => promptDeleteTrip(trip.id, trip.departure_city, trip.arrival_city)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout de trajet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">Nouveau Trajet</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-1 border border-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6">
              {renderFormContent(false)}
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">Modifier le Trajet</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-1 border border-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              {renderFormContent(true)}
            </form>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {isDeleteModalOpen && tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Supprimer ce trajet ?</h3>
              <p className="text-sm text-gray-500 font-medium">
                Vous allez supprimer le trajet <strong className="text-gray-900">{tripToDelete.route}</strong>.
                <br /><br />
                <span className="text-red-500 font-bold">Cette action est irréversible</span> et supprimera également les réservations associées s'il y en a.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDeleteTrip}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-red-700 transition-colors"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alerte / Succès */}
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
