"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchForm from "../components/SearchForm";
import { supabase } from "../lib/supabaseClient";
import { Trip } from "../lib/mockData";
import {
  Filter,
  ArrowUpDown,
  Clock,
  Briefcase,
  Users,
  Compass,
  ChevronRight,
  TrendingDown,
  Star,
  Info,
  Calendar,
  AlertCircle
} from "lucide-react";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Retrieve query params
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";
  const passengers = searchParams.get("passengers") || "1";
  const tripType = searchParams.get("tripType") || "oneway";
  const returnDate = searchParams.get("returnDate") || "";

  // State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string[]>([]); // "morning", "afternoon", "evening"
  const [sortBy, setSortBy] = useState<string>("cheapest"); // "cheapest", "earliest", "duration"
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Roundtrip specific state
  const [phase, setPhase] = useState<"outbound" | "return">("outbound");
  const [outboundTripId, setOutboundTripId] = useState<string | null>(null);

  // Computed current search parameters based on phase
  const currentFrom = phase === "outbound" ? from : to;
  const currentTo = phase === "outbound" ? to : from;
  const currentDate = phase === "outbound" ? date : returnDate;

  // Load trips when query changes
  useEffect(() => {
    async function fetchTrips() {
      if (currentFrom && currentTo && currentDate) {
        try {
          const { data, error } = await supabase
            .from('trips')
            .select('*, companies(*), bookings(*)')
            .eq('departure_city', currentFrom)
            .eq('arrival_city', currentTo)
            .or(`trip_date.eq.${currentDate},is_daily.eq.true`);

          if (error) {
            console.error("Error fetching trips:", error);
            return;
          }

          if (data) {
            // Map Supabase data to the Trip interface used by the UI
            const formattedTrips: Trip[] = data.map((t: any) => {
              const relevantBookings = t.bookings?.filter((b:any) => 
                b.travel_date === currentDate && (b.status === 'CONFIRMED' || b.payment_status === 'PAID')
              ) || [];
              const bookedSeatsCount = relevantBookings.reduce((sum: number, b: any) => sum + (b.selected_seats?.length || 1), 0);
              const availableSeats = t.total_seats - bookedSeatsCount;

              return {
                id: t.id,
                companyName: t.companies.name,
                companyCode: t.companies.code,
                departureCity: t.departure_city,
                arrivalCity: t.arrival_city,
                departureTime: t.departure_time.substring(0, 5).replace(':', 'h'), // 'HH:MM:SS' -> 'HHhMM'
                arrivalTime: t.arrival_time.substring(0, 5).replace(':', 'h'),
                duration: t.duration,
                price: t.price,
                availableSeats: availableSeats < 0 ? 0 : availableSeats,
                totalSeats: t.total_seats,
                occupiedSeats: [], // Not used here
                rating: parseFloat(t.companies.rating) || 5.0,
                amenities: t.companies.amenities || [],
                companyColor: t.companies.color || '#059669'
              };
            });
            
            setTrips(formattedTrips);
          }
        } catch (err) {
          console.error("Failed to fetch trips:", err);
        }
      }
    }

    fetchTrips();
  }, [currentFrom, currentTo, currentDate, phase]);

  // Handle operator filter toggle
  const handleOperatorToggle = (code: string) => {
    if (selectedOperators.includes(code)) {
      setSelectedOperators(selectedOperators.filter((op) => op !== code));
    } else {
      setSelectedOperators([...selectedOperators, code]);
    }
  };

  // Handle time range filter toggle
  const handleTimeToggle = (range: string) => {
    if (selectedTimeRange.includes(range)) {
      setSelectedTimeRange(selectedTimeRange.filter((r) => r !== range));
    } else {
      setSelectedTimeRange([...selectedTimeRange, range]);
    }
  };

  // Filter & Sort Logic
  const getFilteredAndSortedTrips = () => {
    let result = [...trips];

    // Filter by Operator
    if (selectedOperators.length > 0) {
      result = result.filter((trip) => selectedOperators.includes(trip.companyCode));
    }

    // Filter by Time Range
    if (selectedTimeRange.length > 0) {
      result = result.filter((trip) => {
        const hour = parseInt(trip.departureTime.split(":")[0]);
        if (selectedTimeRange.includes("morning") && hour >= 6 && hour < 12) return true;
        if (selectedTimeRange.includes("afternoon") && hour >= 12 && hour < 18) return true;
        if (selectedTimeRange.includes("evening") && (hour >= 18 || hour < 6)) return true;
        return false;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "cheapest") {
        return a.price - b.price;
      }
      if (sortBy === "earliest") {
        return a.departureTime.localeCompare(b.departureTime);
      }
      if (sortBy === "duration") {
        const getMins = (d: string) => {
          const hours = parseInt(d.split("h")[0]);
          const mins = parseInt(d.split("h")[1].split("m")[0]);
          return hours * 60 + mins;
        };
        return getMins(a.duration) - getMins(b.duration);
      }
      return 0;
    });

    return result;
  };

  const filteredTrips = getFilteredAndSortedTrips();

  const availableOperators = Array.from(new Map(trips.map(t => [
    t.companyCode,
    { code: t.companyCode, name: t.companyName, rating: t.rating }
  ])).values());

  const handleReserve = (tripId: string) => {
    if (tripType === "roundtrip") {
      if (phase === "outbound") {
        setOutboundTripId(tripId);
        setPhase("return");
        
        // Lock the return trip to the same company as the outbound trip
        const outboundTrip = trips.find((t) => t.id === tripId);
        if (outboundTrip) {
          setSelectedOperators([outboundTrip.companyCode]);
        } else {
          setSelectedOperators([]);
        }
        
        setSelectedTimeRange([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        router.push(`/booking?tripId=${outboundTripId}&returnTripId=${tripId}&passengers=${passengers}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&returnDate=${returnDate}`);
      }
    } else {
      router.push(`/booking?tripId=${tripId}&passengers=${passengers}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`);
    }
  };

  // Render search summary
  const renderSearchSummary = () => {
    if (!from || !to) return null;
    return (
      <div className="bg-brand-green text-white py-6 px-4 shadow-sm border-b border-brand-green-dark">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-brand-yellow">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentDate ? new Date(currentDate).toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ""}</span>
              <span>•</span>
              <Users className="w-3.5 h-3.5" />
              <span>{passengers} {parseInt(passengers) === 1 ? "Voyageur" : "Voyageurs"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {currentFrom} <span className="text-brand-yellow font-normal">➔</span> {currentTo}
            </h2>
            {tripType === "roundtrip" && (
              <div className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                {phase === "outbound" ? "Étape 1 : Choix de l'Aller" : "Étape 2 : Choix du Retour"}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 self-start md:self-center">
            {phase === "return" && (
              <button
                onClick={() => {
                  setPhase("outbound");
                  setOutboundTripId(null);
                }}
                className="bg-transparent hover:bg-white/10 text-white border border-white/40 text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                Changer l'Aller
              </button>
            )}
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              Modifier la recherche
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Sort Widget */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-brand-green" />
          <span>Trier Par</span>
        </h3>
        <div className="space-y-2">
          {[
            { id: "cheapest", label: "Prix le plus bas", icon: TrendingDown },
            { id: "earliest", label: "Départ le plus tôt", icon: Clock },
            { id: "duration", label: "Trajet le plus rapide", icon: Compass }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition ${
                sortBy === option.id
                  ? "bg-brand-green/5 border-brand-green text-brand-green"
                  : "bg-gray-50/50 border-gray-100 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <option.icon className="w-4 h-4" />
                <span>{option.label}</span>
              </div>
              {sortBy === option.id && <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Operators Widget */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-brand-green" />
          <span>Opérateurs</span>
        </h3>
        <div className="space-y-3">
          {availableOperators.map((op) => (
            <label key={op.code} className="flex items-center space-x-3 text-xs font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedOperators.includes(op.code)}
                onChange={() => handleOperatorToggle(op.code)}
                className="w-4.5 h-4.5 rounded-md border-gray-200 text-brand-green focus:ring-brand-green transition"
              />
              <span className="flex-grow">{op.name}</span>
              <span className="text-[10px] text-gray-400 font-bold">★ {op.rating}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Time Widget */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-green" />
          <span>Heure de départ</span>
        </h3>
        <div className="space-y-3">
          {[
            { id: "morning", label: "Matin (06:00 - 12:00)" },
            { id: "afternoon", label: "Après-midi (12:00 - 18:00)" },
            { id: "evening", label: "Soir & Nuit (18:00 - 06:00)" }
          ].map((time) => (
            <label key={time.id} className="flex items-center space-x-3 text-xs font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedTimeRange.includes(time.id)}
                onChange={() => handleTimeToggle(time.id)}
                className="w-4.5 h-4.5 rounded-md border-gray-200 text-brand-green focus:ring-brand-green transition"
              />
              <span>{time.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      {renderSearchSummary()}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {!from || !to ? (
          <div className="max-w-3xl mx-auto py-12 space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-brand-yellow mx-auto">
              <Info className="w-8 h-8 text-brand-green" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Commencer votre recherche</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Veuillez saisir votre ville de départ, votre destination et la date du trajet pour voir nos horaires disponibles.
            </p>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 text-left">
              <SearchForm compact={false} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Filters Column */}
            <aside className="hidden lg:block lg:col-span-1 space-y-6">
              <FiltersContent />
            </aside>

            {/* Results Column */}
            <section className="lg:col-span-3 space-y-6">
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-bold text-gray-500">
                  Nous avons trouvé <span className="text-gray-900">{filteredTrips.length}</span> trajets correspondants
                </span>
                
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center space-x-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 transition cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtres</span>
                </button>

                <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold text-gray-400">
                  <span>Trajet le plus rapide :</span>
                  <span className="text-gray-800 font-bold">
                    {trips.length > 0 ? trips.reduce((min, t) => t.duration < min.duration ? t : min, trips[0]).duration : "N/A"}
                  </span>
                </div>
              </div>

              {/* Trips List */}
              {filteredTrips.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-xs text-center space-y-4 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Aucun Trajet Trouvé</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Nous n'avons trouvé aucun voyage correspondant à vos critères actuels. Essayez de réinitialiser vos filtres ou de changer de date.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedOperators([]);
                      setSelectedTimeRange([]);
                    }}
                    className="inline-flex bg-brand-green text-white hover:bg-brand-green-dark px-6 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTrips.map((trip) => {
                    const urgency = trip.availableSeats <= 5;
                    
                    return (
                      <div key={trip.id} className="relative group">
                        <div
                          className="bg-white border border-gray-100 group-hover:border-brand-green/30 rounded-2xl md:rounded-b-none p-5 shadow-xs transition duration-200 flex flex-col md:flex-row items-stretch justify-between gap-6 relative z-10"
                        >
                        {/* Operator & Journey Timeline */}
                        <div className="flex-grow flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          {/* Left: Operator Details */}
                          <div className="space-y-2 md:w-40 shrink-0">
                            <span 
                              className="inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border"
                              style={{ 
                                color: (trip as any).companyColor, 
                                borderColor: `${(trip as any).companyColor}40`, 
                                backgroundColor: `${(trip as any).companyColor}10` 
                              }}
                            >
                              {trip.companyName}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <Star className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow shrink-0" />
                              <span className="text-xs font-bold text-gray-800">{trip.rating}</span>
                              <span className="text-[10px] text-gray-400 font-semibold">(50+ avis)</span>
                            </div>
                          </div>

                          {/* Center: Travel Timeline */}
                          <div className="flex items-center space-x-6 w-full max-w-md">
                            {/* Departure */}
                            <div className="text-left shrink-0">
                              <p className="text-lg font-black text-gray-900">{trip.departureTime}</p>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{trip.departureCity.substring(0, 3)}</p>
                            </div>

                            {/* Timeline Visual line */}
                            <div className="flex-grow flex flex-col items-center relative py-2">
                              <span className="text-[10px] font-bold text-gray-400 mb-1">{trip.duration}</span>
                              <div className="w-full h-0.5 bg-gray-100 relative">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-brand-green bg-white"></div>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-green"></div>
                              </div>
                              <span className="text-[9px] text-emerald-600 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-full">Trajet Direct</span>
                            </div>

                            {/* Arrival */}
                            <div className="text-right shrink-0">
                              <p className="text-lg font-black text-gray-900">{trip.arrivalTime}</p>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{trip.arrivalCity.substring(0, 3)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Right Divider (only on desktop) */}
                        <div className="hidden md:block w-px bg-gray-100 self-stretch"></div>

                        {/* Price & Action Section */}
                        <div className="shrink-0 md:w-48 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-stretch gap-4">
                          <div className="text-left md:text-center space-y-0.5">
                            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Par Personne</span>
                            <div className="flex items-baseline md:justify-center space-x-1">
                              <span className="text-2xl font-black text-brand-green">{trip.price.toLocaleString()} FCFA</span>
                            </div>
                            
                            {/* Urgent Available Seats Indicator */}
                            {urgency ? (
                              <span className="text-[10px] font-bold text-red-600 animate-pulse block">
                                Plus que {trip.availableSeats} places !
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-600 block">
                                {trip.availableSeats} places libres
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleReserve(trip.id)}
                            className="bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm px-6 py-3 rounded-xl shadow-xs hover:shadow-md transition duration-200 flex items-center justify-center space-x-1.5 group cursor-pointer"
                          >
                            <span>Réserver</span>
                            <ChevronRight className="w-4 h-4 transition group-hover:translate-x-1" />
                          </button>
                        </div>

                        {/* Amenities Row (Full Width on mobile, placed below everything) */}
                        {trip.amenities && trip.amenities.length > 0 && (
                          <div className="w-full md:hidden mt-2 pt-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                            {trip.amenities.map(amenity => (
                              <span key={amenity} className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}
                        
                      </div>
                      
                      {/* Amenities Row (Desktop: Absolute or appended at bottom) */}
                      {trip.amenities && trip.amenities.length > 0 && (
                        <div className="hidden md:flex bg-gray-50/50 rounded-b-2xl border-x border-b border-gray-100 -mt-2 px-5 py-2.5 items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Commodités :</span>
                          {trip.amenities.map(amenity => (
                            <span key={amenity} className="text-[10px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-xs">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Mobile Filters Drawer Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setShowMobileFilters(false)}
          ></div>

          {/* Drawer Body */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full flex flex-col shadow-xl overflow-y-auto z-10 animate-in slide-in-from-right duration-300 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-base font-black text-gray-900 uppercase">Filtres</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-400 hover:text-gray-900 text-sm font-bold border border-gray-200 px-3 py-1 rounded-md"
              >
                Fermer
              </button>
            </div>
            
            <FiltersContent />

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-brand-green text-white hover:bg-brand-green-dark py-3 rounded-xl font-bold text-sm shadow-xs transition"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <Header />
        <div className="flex-grow flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-500">Recherche des trajets disponibles...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
