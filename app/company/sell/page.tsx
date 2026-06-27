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
  Smartphone,
  Printer
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function SellTicketPage() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");
  
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
    
    setAgentId(session.user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single();
      
    if (profile?.company_id) {
      setCompanyId(profile.company_id);
      const { data, error } = await supabase
        .from('trips')
        .select('*, companies(*)')
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
        .select('selected_seats, status')
        .eq('trip_id', selectedTripId)
        .eq('travel_date', selectedDate);

      let occupied: string[] = [];
      if (bookings) {
        bookings.forEach(b => {
          if (b.status === 'CONFIRMED') {
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
              newBooking.status === 'CONFIRMED' &&
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

  // Custom print stylesheet
  useEffect(() => {
    if (!success) return;
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-ticket, #printable-ticket * {
          visibility: visible;
        }
        #printable-ticket {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 20px;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [success]);

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
        payment_method: paymentMethod,
        agent_id: agentId
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

  const handlePrint = () => {
    window.print();
  };

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
        <div id="printable-ticket" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-8 flex items-start space-x-4 max-w-2xl mx-auto animate-fade-in no-print">
            <div className="w-10 h-10 rounded-full bg-brand-green text-brand-yellow flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 fill-brand-green" />
            </div>
            <div className="space-y-1 text-left">
              <h2 className="text-base font-black text-emerald-950">Vente Réussie !</h2>
              <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                La réservation a été confirmée et payée au guichet.
              </p>
            </div>
          </div>
          
          <div id="printable-ticket" className="flex flex-col gap-16 max-w-2xl mx-auto mb-10">
            {names.map((name, idx) => {
              const seat = selectedSeats[idx] || selectedSeats[0] || "";
              const ticketId = `${bookingRef}-A${idx + 1}`;
              const pricePerTicket = selectedTrip?.price || 0;
              
              return (
                <div key={idx} className="text-center w-full">
                  <div className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 w-full max-w-md mx-auto shadow-sm text-left relative break-inside-avoid">
                    {/* Logo */}
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="text-gray-800">
                        <Bus className="w-8 h-8" />
                      </div>
                      <div className="leading-tight">
                        <span className="text-xl font-black tracking-wider text-gray-900 block uppercase">
                          {selectedTrip?.companies?.name || "TUKKI PARTNER"}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Transport - Aller</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-200 my-6"></div>

                    {/* Depart / Destination */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 mb-1">Ville de départ:</p>
                        <p className="text-[13px] text-gray-600">{selectedTrip?.departure_city}</p>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 mb-1">Ville de destination:</p>
                        <p className="text-[13px] text-gray-600">{selectedTrip?.arrival_city}</p>
                      </div>
                    </div>

                    {/* Date / Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 mb-1">Date du voyage:</p>
                        <p className="text-[13px] text-gray-600">{new Date(selectedDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 mb-1">Heure de départ:</p>
                        <p className="text-[13px] text-gray-600">{selectedTrip?.departure_time?.substring(0, 5)}</p>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-200 my-6"></div>

                    {/* Client */}
                    <div className="mb-5">
                      <p className="text-[13px] font-bold text-gray-900 mb-1">Client:</p>
                      <p className="text-[13px] text-gray-600">{name}</p>
                    </div>

                    {/* Ticket / Price */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 mb-1">Ticket:</p>
                        <p className="text-[13px] text-gray-600">{ticketId.replace('SEN-', '')}{Math.floor(Math.random() * 100000)}</p>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-gray-900 mb-1">Prix payé:</p>
                        <p className="text-[13px] text-gray-600">{pricePerTicket.toLocaleString()} FCFA ({paymentMethod === 'CASH' ? 'Espèces' : paymentMethod === 'WAVE' ? 'Wave' : 'Orange Money'})</p>
                      </div>
                    </div>

                    {/* Seat */}
                    <div className="mb-6">
                      <p className="text-[13px] font-bold text-gray-900 mb-2">Siège:</p>
                      <div className="inline-flex items-center justify-center w-10 h-10 border border-gray-100 rounded-xl shadow-xs">
                        <span className="text-sm font-medium text-gray-800">{seat}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center text-gray-500 space-x-2">
                      <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="text-[13px] italic text-gray-500">Embarquement 1h avant le départ</p>
                    </div>

                    <div className="border-t border-dashed border-gray-200 my-6"></div>

                    {/* QR Code */}
                    <div className="flex justify-center mt-4">
                      <svg className="w-32 h-32" width="128" height="128" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
                        <rect width="100" height="100" fill="white" />
                        <rect x="5" y="5" width="25" height="25" fill="#111827" />
                        <rect x="10" y="10" width="15" height="15" fill="white" />
                        <rect x="13" y="13" width="9" height="9" fill="#111827" />
                        <rect x="70" y="5" width="25" height="25" fill="#111827" />
                        <rect x="75" y="10" width="15" height="15" fill="white" />
                        <rect x="78" y="13" width="9" height="9" fill="#111827" />
                        <rect x="5" y="70" width="25" height="25" fill="#111827" />
                        <rect x="10" y="75" width="15" height="15" fill="white" />
                        <rect x="13" y="78" width="9" height="9" fill="#111827" />
                        <rect x="35" y="5" width="5" height="5" fill="#1a1a1a" />
                        <rect x="45" y="5" width="10" height="5" fill="#1a1a1a" />
                        <rect x="60" y="5" width="5" height="5" fill="#1a1a1a" />
                        <rect x="35" y="15" width="15" height="5" fill="#1a1a1a" />
                        <rect x="55" y="15" width="5" height="10" fill="#1a1a1a" />
                        <rect x="35" y="25" width="5" height="5" fill="#1a1a1a" />
                        <rect x="45" y="25" width="15" height="5" fill="#1a1a1a" />
                        <rect x="5" y="35" width="10" height="5" fill="#1a1a1a" />
                        <rect x="20" y="35" width="10" height="10" fill="#1a1a1a" />
                        <rect x="35" y="35" width="5" height="5" fill="#1a1a1a" />
                        <rect x="45" y="35" width="20" height="5" fill="#1a1a1a" />
                        <rect x="70" y="35" width="10" height="5" fill="#1a1a1a" />
                        <rect x="85" y="35" width="10" height="10" fill="#1a1a1a" />
                        <rect x="5" y="50" width="15" height="5" fill="#1a1a1a" />
                        <rect x="25" y="50" width="5" height="15" fill="#1a1a1a" />
                        <rect x="35" y="45" width="15" height="5" fill="#1a1a1a" />
                        <rect x="55" y="45" width="10" height="10" fill="#1a1a1a" />
                        <rect x="70" y="50" width="5" height="5" fill="#1a1a1a" />
                        <rect x="80" y="50" width="15" height="5" fill="#1a1a1a" />
                        <rect x="35" y="60" width="10" height="5" fill="#1a1a1a" />
                        <rect x="50" y="60" width="5" height="5" fill="#1a1a1a" />
                        <rect x="60" y="60" width="15" height="5" fill="#1a1a1a" />
                        <rect x="80" y="60" width="5" height="10" fill="#1a1a1a" />
                        <rect x="35" y="70" width="5" height="15" fill="#1a1a1a" />
                        <rect x="45" y="75" width="20" height="5" fill="#1a1a1a" />
                        <rect x="70" y="75" width="5" height="5" fill="#1a1a1a" />
                        <rect x="80" y="75" width="15" height="10" fill="#1a1a1a" />
                        <rect x="35" y="90" width="15" height="5" fill="#1a1a1a" />
                        <rect x="55" y="85" width="5" height="10" fill="#1a1a1a" />
                        <rect x="65" y="90" width="20" height="5" fill="#1a1a1a" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 no-print">
            <button 
              onClick={handlePrint}
              className="flex-1 bg-white border-2 border-brand-green text-brand-green px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition flex items-center justify-center space-x-2"
            >
              <Printer className="w-5 h-5" />
              <span>Imprimer le Billet</span>
            </button>
            <button 
              onClick={resetForm}
              className="flex-1 bg-brand-green text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-green-dark transition"
            >
              Vendre un autre billet
            </button>
          </div>
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
