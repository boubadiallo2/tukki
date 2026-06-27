"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabaseClient";
import { Trip, OPERATORS } from "../lib/mockData";
import {
  Armchair,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Users
} from "lucide-react";

function BookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Retrieve params
  const tripId = searchParams.get("tripId") || "";


  // States
  const passengersCount = parseInt(searchParams.get("passengers") || "1", 10);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";

  // States
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>(Array(passengersCount).fill(""));
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fixedFee, setFixedFee] = useState(100);

  // Load trip details
  useEffect(() => {
    async function fetchTrip() {
      if (tripId && from && to && date) {
        try {
          const { data, error } = await supabase
            .from('trips')
            .select('*, companies(*), bookings(*)')
            .eq('id', tripId)
            .single();

          if (data && !error) {
            setTrip({
              id: data.id,
              companyName: data.companies.name,
              companyCode: data.companies.code,
              departureCity: data.departure_city,
              arrivalCity: data.arrival_city,
              departureTime: data.departure_time.substring(0, 5),
              arrivalTime: data.arrival_time.substring(0, 5),
              duration: data.duration,
              price: data.price,
              availableSeats: data.total_seats - (data.bookings?.filter((b:any) => b.travel_date === date && (b.status === 'CONFIRMED' || b.payment_status === 'PAID')).reduce((sum: number, b: any) => sum + (b.selected_seats?.length || 1), 0) || 0),
              totalSeats: data.total_seats,
              occupiedSeats: data.bookings?.filter((b:any) => b.travel_date === date && (b.status === 'CONFIRMED' || b.payment_status === 'PAID')).flatMap((b:any) => b.selected_seats || []) || [],
              rating: parseFloat(data.companies.rating),
              amenities: data.companies.amenities || []
            });
          }
        } catch (err) {
          console.error("Failed to fetch trip details", err);
        }
      }
    }
    
    async function fetchSettings() {
      try {
        const { data } = await supabase.from('platform_settings').select('fixed_fee').eq('id', 1).single();
        if (data) setFixedFee(data.fixed_fee);
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    }
    
    fetchTrip();
    fetchSettings();
  }, [tripId, from, to, date]);

  // Handle seat clicks
  const handleSeatClick = (seatId: string, isOccupied: boolean) => {
    if (isOccupied) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
      setError("");
    } else {
      if (selectedSeats.length >= passengersCount) {
        setError(`Vous ne pouvez sélectionner que ${passengersCount} place(s) pour le trajet aller.`);
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const showError = (msg: string) => {
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!trip) {
      showError("Détails du voyage invalides.");
      return;
    }

    if (names.some(n => !n.trim())) {
      showError("Veuillez entrer le nom complet pour chaque passager.");
      return;
    }

    if (names.some(n => n.trim().length < 3)) {
      showError("Le nom complet doit faire au moins 3 caractères pour chaque passager.");
      return;
    }

    if (!phone.trim()) {
      showError("Veuillez entrer un numéro de téléphone de contact.");
      return;
    }

    if (selectedSeats.length < passengersCount) {
      showError(`Veuillez choisir exactement ${passengersCount} place(s) pour le trajet ALLER. Actuel : ${selectedSeats.length}/${passengersCount}`);
      return;
    }


    setIsSubmitting(true);
    
    // Save booking to Supabase
    const submitBooking = async () => {
      try {
        const randomId = `SEN-${Math.floor(100000 + Math.random() * 900000)}`;
        const passengersName = names.map(n => n.trim()).join(", ");
        
        const commissionAmount = fixedFee * passengersCount;
        const netAmount = trip!.price * passengersCount;
        const finalPrice = netAmount + commissionAmount;

        // Insert outbound booking
        const { error: insertError } = await supabase.from('bookings').insert({
          trip_id: trip!.id,
          passenger_name: passengersName,
          passenger_phone: phone,
          passenger_email: email || null,
          selected_seats: selectedSeats,
          total_price: finalPrice,
          booking_number: randomId,
          travel_date: date,
          status: 'CONFIRMED', // Mark as confirmed so it blocks the seat immediately
          commission_amount: commissionAmount,
          net_amount: netAmount
        });

        if (insertError) throw insertError;



        // Redirect to confirmation
        const query = new URLSearchParams({
          bookingNumber: randomId,
          name: passengersName,
          phone,
          email,
          seats: selectedSeats.join(","),
          tripId: trip!.id,
          from: trip!.departureCity,
          to: trip!.arrivalCity,
          date: date,
          departureTime: trip!.departureTime,
          arrivalTime: trip!.arrivalTime,
          operator: trip!.companyName,
          price: finalPrice.toString()
        });
        
        // Generate full confirmation URL for SMS
        const confirmationUrl = `${window.location.origin}/confirmation?${query.toString()}`;

        // Send SMS
        try {
          await fetch('/api/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phone,
              message: `✅ Réservation TUKKI confirmée (${randomId}) !\n\nVoici le lien de votre ticket : ${confirmationUrl}`
            })
          });
        } catch (err) {
          console.error("Erreur lors de l'envoi du SMS :", err);
        }
        
        router.push(`/confirmation?${query.toString()}`);

      } catch (err: any) {
        console.error("Booking Error:", err);
        showError(`Une erreur est survenue lors de la réservation: ${err.message || err.toString()}`);
        setIsSubmitting(false);
      }
    };

    submitBooking();
  };

  // Generate seat map arrays (9 rows, 4 columns)
  const rows = Array.from({ length: 9 }, (_, i) => i + 1);
  const leftCols = [0, 1];
  const rightCols = [2, 3];

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <Header />
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Trajet introuvable</h3>
            <p className="text-sm text-gray-500">
              Les détails de la réservation n'ont pas pu être chargés. Veuillez retourner à l'accueil et choisir un trajet actif.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-brand-green text-white hover:bg-brand-green-dark px-6 py-2.5 rounded-xl font-bold text-sm transition"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const basePrice = trip.price * passengersCount;
  const serviceFee = fixedFee * passengersCount;
  const totalPrice = basePrice + serviceFee;

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Step progress bar */}
        <div className="max-w-3xl mx-auto mb-8 hidden md:block">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
            <div className="flex items-center text-brand-green">
              <span className="w-6 h-6 rounded-full border-2 border-brand-green flex items-center justify-center mr-2 bg-brand-green text-white text-[10px] font-bold">1</span>
              <span>Choix du trajet</span>
            </div>
            <div className="flex-grow h-0.5 bg-brand-green mx-4"></div>
            <div className="flex items-center text-brand-green">
              <span className="w-6 h-6 rounded-full border-2 border-brand-green flex items-center justify-center mr-2 bg-brand-green text-white text-[10px] font-bold">2</span>
              <span>Passagers & Sièges</span>
            </div>
            <div className="flex-grow h-0.5 bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <span className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center mr-2 text-[10px] font-bold">3</span>
              <span>Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Forms & Seat Selector (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Error Alert */}
            {error && (
              <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-3.5 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center space-x-2.5 pb-4 border-b border-gray-100 mb-6">
                <User className="w-5 h-5 text-brand-green" />
                <h2 className="text-lg font-black text-gray-900">Informations Voyageur</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4 mb-4">
                  {Array.from({ length: passengersCount }).map((_, i) => (
                    <div key={`name-${i}`}>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Nom Complet du Passager {passengersCount > 1 ? i + 1 : ""}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Ex: Amadou Diop"
                          value={names[i] || ""}
                          onChange={(e) => {
                            const newNames = [...names];
                            newNames[i] = e.target.value;
                            setNames(newNames);
                            setError("");
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 hover:bg-gray-100/55 focus:bg-white border border-gray-100 focus:border-brand-green focus:outline-hidden text-sm rounded-xl transition"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Numéro de téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="Ex: +221 77 123 45 67"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setError("");
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 hover:bg-gray-100/55 focus:bg-white border border-gray-100 focus:border-brand-green focus:outline-hidden text-sm rounded-xl transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Adresse E-mail (Optionnel)</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Ex: amadou.diop@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 hover:bg-gray-100/55 focus:bg-white border border-gray-100 focus:border-brand-green focus:outline-hidden text-sm rounded-xl transition"
                      />
                    </div>
                  </div>
                </div>
                
                <p className="text-[10px] text-gray-400 font-semibold">
                  Nous vous enverrons vos billets d'embarquement par email si vous le renseignez.
                </p>
              </form>
            </div>

            {/* Interactive Seat Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6 gap-2">
                <div className="flex items-center space-x-2.5">
                  <Armchair className="w-5 h-5 text-brand-green" />
                  <h2 className="text-lg font-black text-gray-900 font-sans">Sélectionnez vos Sièges</h2>
                </div>
                <div className="bg-brand-green/10 text-brand-green font-bold text-xs px-3 py-1 rounded-full">
                  Veuillez choisir {passengersCount} place{passengersCount > 1 ? "s" : ""}
                </div>
              </div>

              {/* Legend keys */}
              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto mb-8 text-center text-xs font-bold text-gray-500">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400">
                    <Armchair className="w-4 h-4" />
                  </div>
                  <span>Disponible</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-400">
                    <Armchair className="w-4 h-4 fill-gray-400/20" />
                  </div>
                  <span>Occupé</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-brand-yellow text-gray-900 flex items-center justify-center shadow-xs">
                    <Armchair className="w-4 h-4 fill-gray-900/10" />
                  </div>
                  <span className="text-brand-green font-bold">Sélectionné</span>
                </div>
              </div>

              {/* Bus Cabin Visual Layout */}
              <div className="max-w-xs mx-auto border-4 border-gray-300 rounded-t-3xl rounded-b-xl bg-gray-50 p-4 relative shadow-inner">
                {/* Windshield & Steering Wheel */}
                <div className="flex justify-between items-center pb-4 mb-4 border-b-2 border-gray-200">
                  <div className="text-[10px] text-gray-400 font-black tracking-wider uppercase">Avant du véhicule</div>
                  <div className="w-8 h-8 rounded-full border-2 border-gray-400 border-dashed flex items-center justify-center text-gray-400" title="Volant">
                    🛞
                  </div>
                </div>

                {/* Seats grid */}
                <div className="space-y-3">
                  {rows.map((rowNum) => (
                    <div key={rowNum} className="flex justify-between items-center">
                      {/* Left Seats (A, B) */}
                      <div className="flex space-x-2">
                        {leftCols.map((colIndex) => {
                          const seatId = ((rowNum - 1) * 4 + colIndex + 1).toString();
                          const isOccupied = trip.occupiedSeats.includes(seatId);
                          const isSelected = selectedSeats.includes(seatId);
                          
                          return (
                            <button
                              key={seatId}
                              type="button"
                              onClick={() => handleSeatClick(seatId, isOccupied)}
                              className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition duration-150 ${
                                isOccupied
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-brand-yellow text-gray-900 border border-brand-yellow shadow-md transform scale-105"
                                  : "bg-white hover:bg-brand-green/5 text-gray-700 hover:text-brand-green border border-gray-200"
                              }`}
                              disabled={isOccupied}
                              title={`Siège ${seatId} ${isOccupied ? "(Occupé)" : ""}`}
                            >
                              <Armchair className="w-4 h-4 shrink-0" />
                              <span>{seatId}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Aisle */}
                      <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest pointer-events-none">Allée</div>

                      {/* Right Seats (C, D) */}
                      <div className="flex space-x-2">
                        {rightCols.map((colIndex) => {
                          const seatId = ((rowNum - 1) * 4 + colIndex + 1).toString();
                          const isOccupied = trip.occupiedSeats.includes(seatId);
                          const isSelected = selectedSeats.includes(seatId);
                          
                          return (
                            <button
                              key={seatId}
                              type="button"
                              onClick={() => handleSeatClick(seatId, isOccupied)}
                              className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition duration-150 ${
                                isOccupied
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-brand-yellow text-gray-900 border border-brand-yellow shadow-md transform scale-105"
                                  : "bg-white hover:bg-brand-green/5 text-gray-700 hover:text-brand-green border border-gray-200"
                              }`}
                              disabled={isOccupied}
                              title={`Siège ${seatId} ${isOccupied ? "(Occupé)" : ""}`}
                            >
                              <Armchair className="w-4 h-4 shrink-0" />
                              <span>{seatId}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


          </div>

          {/* Right Panel: Booking Summary (4 columns) */}
          <div className="lg:col-span-4 space-y-6 sticky top-20">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md">
              {/* Summary Header */}
              <div className="bg-brand-green text-white p-5">
                <h3 className="text-base font-black uppercase tracking-wider">Résumé du voyage</h3>
              </div>

              {/* Trip details */}
              <div className="p-5 space-y-5">
                {/* Route detail */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-50 rounded-xl text-brand-green shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Trajet</p>
                    <p className="text-sm font-black text-gray-900">{trip.departureCity} ➔ {trip.arrivalCity}</p>
                    <p className="text-xs text-gray-500 font-semibold">{trip.companyName}</p>
                  </div>
                </div>

                {/* Date / Time */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-50 rounded-xl text-brand-green shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Planification</p>
                    <p className="text-sm font-black text-gray-900">
                      {date ? new Date(date).toLocaleDateString("fr-FR", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </p>
                    <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-bold">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{trip.departureTime} - {trip.arrivalTime} ({trip.duration})</span>
                    </div>
                  </div>
                </div>

                {/* Seat Detail */}
                <div className="flex items-start space-x-3 border-b border-gray-100 pb-5">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Places demandées</p>
                    <p className="text-sm font-black text-gray-900">
                      {passengersCount} Place{passengersCount > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-brand-green font-bold">
                      {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Aucune"}
                    </p>
                  </div>
                </div>

                {/* Receipt breakdown */}
                <div className="space-y-2 text-xs font-semibold text-gray-500 pt-2">
                  <div className="flex justify-between">
                    <span>Prix des billets ({passengersCount}x Aller simple)</span>
                    <span className="text-gray-900 font-bold">{basePrice.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission</span>
                    <span className="text-gray-900 font-bold">{serviceFee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-4 border-t border-gray-100">
                    <span className="text-sm font-black text-gray-900">Total à payer</span>
                    <span className="text-xl font-black text-brand-green">{totalPrice.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Guarantee check */}
                <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                  <ShieldCheck className="w-4.5 h-4.5 text-brand-green shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-800">
                    Annulation gratuite possible jusqu'à 24h avant.
                  </span>
                </div>

                {/* Big confirmation CTA */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full bg-brand-yellow hover:bg-brand-yellow-dark text-gray-900 font-black p-4 rounded-xl shadow-xs hover:shadow-md transition duration-200 flex items-center justify-center space-x-2 group cursor-pointer ${
                    isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Réservation en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmer la réservation</span>
                      <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1 shrink-0" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <Header />
        <div className="flex-grow flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-500">Chargement du plan des places...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}
