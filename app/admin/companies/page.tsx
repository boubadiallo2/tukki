"use client";

import { useState } from "react";
import { Search, Building2, MapPin, Bus, CheckCircle, XCircle, MoreVertical, Eye, Plus } from "lucide-react";

const COMPANIES = [
  {
    id: "COMP-001",
    name: "Tukki Express",
    email: "contact@tukkiexpress.sn",
    phone: "+221 77 000 00 01",
    fleetSize: 24,
    activeRoutes: 12,
    revenue: "15,200,000 FCFA",
    joinedDate: "12/01/2026",
    status: "Actif"
  },
  {
    id: "COMP-002",
    name: "Horizon Navette",
    email: "hello@horizon-navette.sn",
    phone: "+221 76 000 00 02",
    fleetSize: 8,
    activeRoutes: 5,
    revenue: "4,150,000 FCFA",
    joinedDate: "05/03/2026",
    status: "Actif"
  },
  {
    id: "COMP-003",
    name: "Volt Transport",
    email: "admin@volt.sn",
    phone: "+221 70 000 00 03",
    fleetSize: 15,
    activeRoutes: 8,
    revenue: "8,800,000 FCFA",
    joinedDate: "10/04/2026",
    status: "Actif"
  },
  {
    id: "COMP-004",
    name: "Star Lines",
    email: "support@starlines.sn",
    phone: "+221 78 000 00 04",
    fleetSize: 5,
    activeRoutes: 2,
    revenue: "1,300,000 FCFA",
    joinedDate: "20/05/2026",
    status: "Suspendu"
  }
];

export default function AdminCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Compagnies Partenaires</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérez les opérateurs de transport inscrits sur TUKKI.</p>
        </div>
        <button className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Ajouter une compagnie</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Rechercher une compagnie..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-hidden focus:border-slate-900 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="flex-1 sm:flex-none bg-white border border-gray-100 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-hidden focus:border-slate-900 cursor-pointer">
            <option>Tous les statuts</option>
            <option>Actif</option>
            <option>Suspendu</option>
          </select>
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Compagnie & Contact</th>
                <th className="p-4">Flotte & Trajets</th>
                <th className="p-4">Volume d'Affaires</th>
                <th className="p-4">Statut</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {COMPANIES.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{company.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{company.email}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{company.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1.5 text-xs font-semibold text-gray-600">
                      <div className="flex items-center">
                        <Bus className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {company.fleetSize} Véhicules
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {company.activeRoutes} Trajets Actifs
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-black text-slate-900">{company.revenue}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Depuis {company.joinedDate}</p>
                  </td>
                  <td className="p-4">
                    {company.status === 'Actif' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        <XCircle className="w-3 h-3 mr-1" />
                        Suspendu
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Voir les détails">
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
