"use client";

import { useState } from "react";
import { Search, MapPin, Calendar, Clock, CheckCircle, XCircle, MoreVertical, Eye, Download } from "lucide-react";

// Fake bookings data for the back office
const BOOKINGS = [
  {
    id: "SEN-839147",
    customerName: "Bouba Diallo",
    phone: "+221 77 123 45 67",
    route: "Dakar ➔ Mbour",
    date: "08/06/2026",
    time: "14:30",
    seats: "A1, A2",
    amount: 8200,
    status: "Confirmé"
  },
  {
    id: "SEN-102934",
    customerName: "Aissatou Sow",
    phone: "+221 76 987 65 43",
    route: "Dakar ➔ Saint-Louis",
    date: "08/06/2026",
    time: "14:15",
    seats: "B4",
    amount: 5100,
    status: "Confirmé"
  },
  {
    id: "SEN-459201",
    customerName: "Mamadou Ndiaye",
    phone: "+221 70 456 78 90",
    route: "Thiès ➔ Dakar",
    date: "09/06/2026",
    time: "08:00",
    seats: "C1, C2, C3",
    amount: 4800,
    status: "En attente"
  },
  {
    id: "SEN-992384",
    customerName: "Fatou Diop",
    phone: "+221 78 321 09 87",
    route: "Dakar ➔ Touba",
    date: "07/06/2026",
    time: "10:00",
    seats: "A5",
    amount: 4100,
    status: "Annulé"
  }
];

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Réservations Clients</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérez les billets, validez les paiements et consultez les historiques.</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center space-x-2">
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
            placeholder="Rechercher un n° de billet (ex: SEN-1234)..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-hidden focus:border-brand-green focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="flex-1 sm:flex-none bg-white border border-gray-100 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-hidden focus:border-brand-green cursor-pointer">
            <option>Tous les statuts</option>
            <option>Confirmé</option>
            <option>En attente</option>
            <option>Annulé</option>
          </select>
          <select className="flex-1 sm:flex-none bg-white border border-gray-100 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-hidden focus:border-brand-green cursor-pointer">
            <option>Tous les trajets</option>
            <option>Dakar ➔ Saint-Louis</option>
            <option>Dakar ➔ Touba</option>
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
              {BOOKINGS.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div>
                      <p className="font-black text-brand-green text-sm">{booking.id}</p>
                      <p className="font-bold text-gray-900 mt-1">{booking.customerName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{booking.phone}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-900">{booking.route}</p>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 mt-1">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {booking.date}</span>
                      <span>•</span>
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {booking.time}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold tracking-widest border border-amber-100">
                      {booking.seats}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-black text-gray-900">{booking.amount.toLocaleString()} FCFA</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Payé par Wave</p>
                  </td>
                  <td className="p-4">
                    {booking.status === 'Confirmé' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirmé
                      </span>
                    )}
                    {booking.status === 'En attente' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <Clock className="w-3 h-3 mr-1" />
                        En attente
                      </span>
                    )}
                    {booking.status === 'Annulé' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        <XCircle className="w-3 h-3 mr-1" />
                        Annulé
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-400 hover:text-brand-green hover:bg-emerald-50 rounded-lg transition-colors" title="Voir les détails">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Plus d'actions">
                        <MoreVertical className="w-4 h-4" />
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
