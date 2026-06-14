"use client";

import { BusFront, WifiOff } from "lucide-react";

export default function Offline() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <BusFront className="w-10 h-10 text-[#0B6B3A]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
            <WifiOff className="w-4 h-4 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vous êtes hors ligne</h1>
        <p className="text-gray-500 mb-8">
          Vérifiez votre connexion internet pour continuer à réserver vos tickets de bus TUKKI.
        </p>

        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-[#0B6B3A] text-white py-3 rounded-xl font-medium hover:bg-[#095a31] transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
