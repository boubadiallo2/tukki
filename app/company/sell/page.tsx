"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { 
  Bus, 
  Calendar, 
  Users, 
  Armchair, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function SellTicketPage() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  
  // Selection state
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [passengersCount, setPassengersCount] = useState<number>(1);
  
  // Trip details state
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // Form state
  const [names, setNames] = useState<string[]>([""]);
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
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
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('company_id', profile.company_id);
        
      if (data) setTrips(data);
    }
    setLoading(false);
  };

  // Fetch occupied seats when trip or date changes
  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!selectedTripId || !selectedDate) {
        setSelectedTrip(null);
        setOccupiedSeats([]);
        setSelectedSeats([]);
        return;
      }

      const trip = trips.find(t => t.id === selectedTripId);
      setSelectedTrip(trip);
      setSelectedSeats([]);

      const { data: bookings } = await supabase
        .from('bookings')
        .select('selected_seats, status, payment_status')
        .eq('trip_id', selectedTripId)
        .eq('travel_date', selectedDate);

      let occupied: string[] = [];
      if (bookings) {
        bookings.forEach(b => {
          if (b.status === 'CONFIRMED' || b.payment_status === 'PAID') {
            occupied = [...occupied, ...(b.selected_seats || [])];
          }
        });
      }
      setOccupiedSeats(occupied);
    };

    fetchTripDetails();

    // Set up Realtime Subscription for Live Sync
    if (selectedTripId && selectedDate) {
      const channel = supabase
        .channel('pos-sync')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bookings',
            filter: `trip_id=eq.${selectedTripId}`
          },
          (payload: any) => {
            const newBooking = payload.new;
            if (
              newBooking.travel_date === selectedDate && 
              (newBooking.status === 'CONFIRMED' || newBooking.payment_status === 'PAID') &&
              newBooking.selected_seats
            ) {
              setOccupiedSeats(prev => {
                const updated = [...prev, ...newBooking.selected_seats];
                // Remove newly occupied seats from currently selected seats if there is a collision
                setSelectedSeats(currSel => currSel.filter(s => !newBooking.selected_seats.includes(s)));
                return updated;
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTripId, selectedDate, trips]);

  // Adjust names array when passengers count changes
  useEffect(() => {
    setNames(prev => {
      const newNames = [...prev];
      if (passengersCount > prev.length) {
        for (let i = prev.length; i < passengersCount; i++) {
          newNames.push("");
        }
      } else if (passengersCount < prev.length) {
        return newNames.slice(0, passengersCount);
      }
      return newNames;
    });
    
    // Also trim selected seats if needed
    if (selectedSeats.length > passengersCount) {
      setSelectedSeats(prev => prev.slice(0, passengersCount));
    }
  }, [passengersCount]);

  const handleSeatClick = (seatId: string, isOccupied: boolean) => {
    if (isOccupied) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length >= passengersCount) {
        toast.error(`Vous ne pouvez sélectionner que ${passengersCount} place(s).`);
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTripId || !selectedDate) {
      toast.error("Veuillez sélectionner un trajet et une date.");
      return;
    }

    if (selectedSeats.length < passengersCount) {
      toast.error(`Veuillez choisir ${passengersCount} siège(s).`);
      return;
    }

    if (names.some(n => n.trim().length < 3)) {
      toast.error("Veuillez entrer le nom complet de chaque passager (min 3 caractères).");
      return;
    }

    if (!phone.trim()) {
      toast.error("Veuillez entrer un numéro de téléphone.");
      return;
    }

    setIsSubmitting(true);
    try {
      const randomId = `SEN-${Math.floor(100000 + Math.random() * 900000)}`;
      const passengersName = names.map(n => n.trim()).join(", ");
      const totalPrice = selectedTrip.price * passengersCount; // No extra fees for counter sales maybe? Or same fee? Let's keep it simple: just price * count

      const { error } = await supabase.from('bookings').insert({
        trip_id: selectedTripId,
        passenger_name: passengersName,
        passenger_phone: phone,
        selected_seats: selectedSeats,
        total_price: totalPrice,
        booking_number: randomId,
        travel_date: selectedDate,
        status: 'CONFIRMED',
        payment_status: 'PAID',
        payment_method: paymentMethod
      });

      if (error) throw error;

      setBookingRef(randomId);
      setSuccess(true);
      toast.success("Billet vendu avec succès !");
      
      // Reset after 5 seconds or let user click button
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la vente: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedTripId("");
    setSelectedDate("");
    setPassengersCount(1);
    setSelectedSeats([]);
    setNames([""]);
    setPhone("");
    setPaymentMethod("CASH");
    setSuccess(false);
    setBookingRef("");
  };

  const rows = Array.from({ length: 9 }, (_, i) => i + 1);
  const leftCols = [0, 1];
  const rightCols = [2, 3];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto mt-10">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Vente Réussie !</h2>
          <p className="text-gray-500 mb-8">La réservation a été confirmée et payée au guichet.</p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left space-y-4">
            <div className="flex justify-between border-b border-gray-200 pb-4">
              <span className="text-gray-500 font-bold">N° de Billet</span>
              <span className="text-gray-900 font-black">{bookingRef}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-4">
              <span className="text-gray-500 font-bold">Passagers</span>
              <span className="text-gray-900 font-black text-right max-w-[200px] truncate">{names.join(", ")}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-4">
              <span className="text-gray-500 font-bold">Sièges</span>
              <span className="text-brand-green font-black">{selectedSeats.join(", ")}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-4">
              <span className="text-gray-500 font-bold">Méthode</span>
              <span className="text-gray-900 font-black">{paymentMethod === 'CASH' ? 'Espèces' : paymentMethod === 'WAVE' ? 'Wave' : 'Orange Money'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-bold">Total Encaissé</span>
              <span className="text-gray-900 font-black text-lg">{(selectedTrip?.price * passengersCount).toLocaleString()} FCFA</span>
            </div>
          </div>
          
          <button 
            onClick={resetForm}
            className="w-full bg-brand-green text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-green-dark transition"
          >
            Vendre un autre billet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vente au guichet</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Vendez des billets directement aux passagers sur place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 flex items-center mb-6">
              <Bus className="w-5 h-5 mr-2 text-brand-green" /> 1. Sélection du trajet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trajet</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-hidden focus:border-brand-green"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                >
                  <option value="">Sélectionnez un trajet</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.departure_city} ➔ {t.arrival_city} ({t.departure_time.substring(0,5)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date de départ</label>
                <input 
                  type="date"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-hidden focus:border-brand-green"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 flex items-center mb-6">
              <User className="w-5 h-5 mr-2 text-brand-green" /> 2. Informations Passagers
            </h2>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre de passagers</label>
              <select 
                className="w-full md:w-1/3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-hidden focus:border-brand-green"
                value={passengersCount}
                onChange={(e) => setPassengersCount(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} Passager{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {Array.from({ length: passengersCount }).map((_, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nom Complet - Passager {i + 1}</label>
                  <input
                    type="text"
                    placeholder="Ex: Amadou Diop"
                    value={names[i] || ""}
                    onChange={(e) => {
                      const newNames = [...names];
                      newNames[i] = e.target.value;
                      setNames(newNames);
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-hidden focus:border-brand-green"
                  />
                </div>
              ))}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Téléphone</label>
                <input
                  type="tel"
                  placeholder="Ex: +221 77 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-hidden focus:border-brand-green"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 flex items-center mb-6">
              <CreditCard className="w-5 h-5 mr-2 text-brand-green" /> 3. Paiement
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'border-brand-green bg-emerald-50 text-brand-green' : 'border-gray-100 bg-white hover:bg-gray-50 text-gray-500'}`}
              >
                <Banknote className="w-8 h-8" />
                <span className="font-bold text-sm">Espèces</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('WAVE')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'WAVE' ? 'border-[#00aaff] bg-[#00aaff]/10 text-[#00aaff]' : 'border-gray-100 bg-white hover:bg-gray-50 text-gray-500'}`}
              >
                <Smartphone className="w-8 h-8" />
                <span className="font-bold text-sm">Wave</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('ORANGE_MONEY')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'ORANGE_MONEY' ? 'border-[#ff6600] bg-[#ff6600]/10 text-[#ff6600]' : 'border-gray-100 bg-white hover:bg-gray-50 text-gray-500'}`}
              >
                <Smartphone className="w-8 h-8" />
                <span className="font-bold text-sm">Orange Money</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Seats & Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs sticky top-20">
            <h2 className="text-lg font-black text-gray-900 flex items-center mb-6">
              <Armchair className="w-5 h-5 mr-2 text-brand-green" /> Sélection des sièges
            </h2>

            {!selectedTrip || !selectedDate ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Armchair className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">Sélectionnez un trajet et une date pour voir les sièges.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6 px-4 py-2 bg-emerald-50 text-brand-green rounded-xl font-bold text-sm">
                  <span>Sièges restants à choisir :</span>
                  <span className="text-lg">{passengersCount - selectedSeats.length}</span>
                </div>

                {/* Legend keys */}
                <div className="flex justify-center gap-4 mb-6 text-xs font-bold text-gray-500">
                  <div className="flex items-center gap-1"><div className="w-4 h-4 bg-white border border-gray-200 rounded"></div> Libre</div>
                  <div className="flex items-center gap-1"><div className="w-4 h-4 bg-gray-200 rounded"></div> Occupé</div>
                  <div className="flex items-center gap-1"><div className="w-4 h-4 bg-brand-yellow rounded"></div> Choisi</div>
                </div>

                <div className="max-w-[200px] mx-auto border-4 border-gray-300 rounded-t-3xl rounded-b-xl bg-gray-50 p-3 shadow-inner">
                  <div className="text-center pb-2 border-b-2 border-gray-200 mb-3 text-[10px] text-gray-400 font-black tracking-wider uppercase">Avant</div>
                  <div className="space-y-2">
                    {rows.map((rowNum) => (
                      <div key={rowNum} className="flex justify-between items-center">
                        <div className="flex space-x-1.5">
                          {leftCols.map((colIndex) => {
                            const seatId = ((rowNum - 1) * 4 + colIndex + 1).toString();
                            const isOccupied = occupiedSeats.includes(seatId);
                            const isSelected = selectedSeats.includes(seatId);
                            
                            return (
                              <button
                                key={seatId}
                                type="button"
                                onClick={() => handleSeatClick(seatId, isOccupied)}
                                className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold ${
                                  isOccupied ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : isSelected ? "bg-brand-yellow text-gray-900 border border-brand-yellow shadow-sm"
                                  : "bg-white hover:bg-brand-green/10 text-gray-700 hover:text-brand-green border border-gray-200"
                                }`}
                                disabled={isOccupied}
                              >
                                {seatId}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-[8px] font-black text-gray-300 uppercase pointer-events-none w-4 text-center"></div>
                        <div className="flex space-x-1.5">
                          {rightCols.map((colIndex) => {
                            const seatId = ((rowNum - 1) * 4 + colIndex + 1).toString();
                            const isOccupied = occupiedSeats.includes(seatId);
                            const isSelected = selectedSeats.includes(seatId);
                            
                            return (
                              <button
                                key={seatId}
                                type="button"
                                onClick={() => handleSeatClick(seatId, isOccupied)}
                                className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold ${
                                  isOccupied ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : isSelected ? "bg-brand-yellow text-gray-900 border border-brand-yellow shadow-sm"
                                  : "bg-white hover:bg-brand-green/10 text-gray-700 hover:text-brand-green border border-gray-200"
                                }`}
                                disabled={isOccupied}
                              >
                                {seatId}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-sm font-bold text-gray-500 uppercase">Total à encaisser</p>
                      <p className="text-2xl font-black text-brand-green">{(selectedTrip.price * passengersCount).toLocaleString()} FCFA</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSell}
                    disabled={isSubmitting || selectedSeats.length !== passengersCount || names.some(n => !n.trim()) || !phone.trim()}
                    className="w-full bg-brand-green text-white hover:bg-brand-green-dark py-4 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? "Validation..." : "Valider la vente"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
