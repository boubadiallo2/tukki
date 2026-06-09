"use client";

import { useState } from "react";
import { Plus, Search, MapPin, Calendar, Clock, Edit2, Trash2, Users, MoreVertical } from "lucide-react";

// Fake trips data for the back office
const TRIPS = [
  {
    id: "TR-102",
    from: "Dakar",
    to: "Saint-Louis",
    date: "2026-06-15",
    time: "14:15",
    bus: "Bus Climatisé",
    capacity: 50,
    booked: 45,
    price: 5000,
    status: "Actif"
  },
  {
    id: "TR-105",
    from: "Dakar",
    to: "Touba",
    date: "2026-06-15",
    time: "15:30",
    bus: "Minibus VIP",
    capacity: 15,
    booked: 15,
    price: 4000,
    status: "Complet"
  },
  {
    id: "TR-108",
    from: "Thiès",
    to: "Dakar",
    date: "2026-06-15",
    time: "16:00",
    bus: "Bus Standard",
    capacity: 50,
    booked: 28,
    price: 1500,
    status: "Actif"
  },
  {
    id: "TR-110",
    from: "Dakar",
    to: "Ziguinchor",
    date: "2026-06-16",
    time: "07:00",
    bus: "Bus Climatisé VIP",
    capacity: 40,
    booked: 12,
    price: 12000,
    status: "Actif"
  }
];

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestion des Trajets</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Créez et modifiez vos lignes de transport.</p>
        </div>
        <button className="bg-brand-green text-white hover:bg-brand-green-dark px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nouveau trajet</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Rechercher par ville ou numéro..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-hidden focus:border-brand-green focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="flex-1 sm:flex-none bg-white border border-gray-100 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-hidden focus:border-brand-green cursor-pointer">
            <option>Tous les statuts</option>
            <option>Actif</option>
            <option>Complet</option>
          </select>
          <select className="flex-1 sm:flex-none bg-white border border-gray-100 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-hidden focus:border-brand-green cursor-pointer">
            <option>Toutes les dates</option>
            <option>Aujourd'hui</option>
            <option>Demain</option>
          </select>
        </div>
      </div>

      {/* Trips List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Trajet & Date</th>
                <th className="p-4">Véhicule</th>
                <th className="p-4">Remplissage</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Statut</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TRIPS.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm">{trip.from} ➔ {trip.to}</p>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 mt-1">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {trip.date}</span>
                          <span>•</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {trip.time}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-900">{trip.bus}</p>
                    <p className="text-xs text-gray-500">{trip.capacity} places</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                        <div 
                          className={`h-full rounded-full ${trip.booked >= trip.capacity ? 'bg-red-500' : 'bg-brand-green'}`} 
                          style={{ width: `${(trip.booked / trip.capacity) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-gray-700">{trip.booked}/{trip.capacity}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-black text-gray-900">{trip.price.toLocaleString()} FCFA</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                      trip.status === 'Complet' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-400 hover:text-brand-green hover:bg-emerald-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
