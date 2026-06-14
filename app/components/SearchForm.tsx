"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Users, ArrowRightLeft, Search, AlertCircle } from "lucide-react";
import { CITIES } from "../lib/mockData";

interface SearchFormProps {
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
  initialPassengers?: string;
  compact?: boolean;
}

export default function SearchForm({
  initialFrom = "",
  initialTo = "",
  initialDate = "",
  initialPassengers = "1",
  compact = false
}: SearchFormProps) {
  const router = useRouter();
  
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [date, setDate] = useState(initialDate);
  const [passengers, setPassengers] = useState(initialPassengers);
  
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [error, setError] = useState("");

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Set default date to today if not provided
  useEffect(() => {
    if (!date) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [date]);

  // Click outside listener to close suggestion popups
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setShowFromSuggestions(false);
      }
      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setShowToSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFromCities = CITIES.filter(city =>
    city.toLowerCase().includes(from.toLowerCase()) && city.toLowerCase() !== to.toLowerCase()
  );

  const filteredToCities = CITIES.filter(city =>
    city.toLowerCase().includes(to.toLowerCase()) && city.toLowerCase() !== from.toLowerCase()
  );

  // Min date selector (today)
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!from || !to) {
      setError("Veuillez sélectionner à la fois la ville de départ et la ville de destination.");
      return;
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      setError("La ville de départ et la ville de destination ne peuvent pas être identiques.");
      return;
    }

    if (!date) {
      setError("Veuillez choisir une date pour votre voyage.");
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError("La date de voyage ne peut pas être dans le passé.");
      return;
    }

    // Navigate to search results page
    let url = `/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&passengers=${passengers}`;
    router.push(url);
  };

  return (
    <div className={`w-full ${compact ? "" : "bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6"}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className={`grid grid-cols-1 ${compact ? "lg:grid-cols-12" : "lg:grid-cols-11"} gap-4 items-end`}>
          {/* Departure City */}
          <div className={`${compact ? "lg:col-span-3" : "lg:col-span-3"} relative`} ref={fromRef}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Départ</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-brand-green transition" />
              <input
                type="text"
                placeholder="Ville de départ"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setShowFromSuggestions(true);
                  setError("");
                }}
                onFocus={() => setShowFromSuggestions(true)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white rounded-xl border border-gray-100 focus:border-brand-green focus:outline-hidden text-sm font-medium text-gray-800 transition"
              />
              
              {showFromSuggestions && filteredFromCities.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-[300px] overflow-y-auto overflow-x-hidden py-1">
                  {filteredFromCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setFrom(city);
                        setShowFromSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-brand-green/5 hover:text-brand-green text-sm font-medium text-gray-700 border-b last:border-0 border-gray-50 transition"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center lg:col-span-1 lg:pb-2">
            <button
              type="button"
              onClick={handleSwap}
              className="bg-brand-yellow hover:bg-brand-yellow-dark text-gray-800 p-2.5 rounded-full shadow-md hover:scale-105 hover:rotate-180 transition duration-300"
              title="Inverser les villes"
            >
              <ArrowRightLeft className="w-4 h-4 shrink-0 lg:rotate-90" />
            </button>
          </div>

          {/* Arrival City */}
          <div className={`${compact ? "lg:col-span-3" : "lg:col-span-3"} relative`} ref={toRef}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Destination</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-brand-green transition" />
              <input
                type="text"
                placeholder="Ville d'arrivée"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setShowToSuggestions(true);
                  setError("");
                }}
                onFocus={() => setShowToSuggestions(true)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white rounded-xl border border-gray-100 focus:border-brand-green focus:outline-hidden text-sm font-medium text-gray-800 transition"
              />
              
              {showToSuggestions && filteredToCities.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-[300px] overflow-y-auto overflow-x-hidden py-1">
                  {filteredToCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setTo(city);
                        setShowToSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-brand-green/5 hover:text-brand-green text-sm font-medium text-gray-700 border-b last:border-0 border-gray-50 transition"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date Picker */}
          <div className={`${compact ? "lg:col-span-2" : "lg:col-span-2"} min-w-0`}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Départ</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-brand-green pointer-events-none" />
              <input
                type="date"
                min={getTodayDateString()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError("");
                }}
                className="w-full min-w-0 appearance-none pl-12 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white rounded-xl border border-gray-100 focus:border-brand-green focus:outline-hidden text-sm font-medium text-gray-800 transition"
              />
            </div>
          </div>


          {/* Passengers Selector */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Places</label>
            <div className="relative group">
              <Users className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-brand-green pointer-events-none" />
              <select
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
                className="w-full pl-10 pr-2 py-3.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white rounded-xl border border-gray-100 focus:border-brand-green focus:outline-hidden text-sm font-medium text-gray-800 transition appearance-none cursor-pointer"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className={`${compact ? "lg:col-span-2" : "lg:col-span-1"} w-full`}>
            <button
              type="submit"
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white p-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-md hover:shadow-brand-green/20 transition cursor-pointer"
            >
              <Search className="w-5 h-5 text-brand-yellow shrink-0" />
              <span className={compact ? "inline" : "lg:hidden"}>Rechercher</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
