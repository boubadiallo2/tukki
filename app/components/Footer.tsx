"use client";

import Link from "next/link";
import { Compass, Mail, Phone, MapPin, Globe, CreditCard } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      {/* Top Newsletter & Promo Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-gray-800">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-2">Abonnez-vous à notre newsletter de voyage</h3>
            <p className="text-gray-400 text-sm">Recevez des codes promos exclusifs, des réductions et des idées de voyage directement dans votre boîte mail.</p>
          </div>
          <div>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="bg-gray-800 text-white placeholder-gray-500 text-sm rounded-xl px-4 py-3 border border-gray-700 focus:outline-hidden focus:border-brand-green w-full"
                required
              />
              <button
                type="submit"
                className="bg-brand-green text-white hover:bg-brand-green-dark px-4 py-3 rounded-xl font-semibold text-sm transition shrink-0"
              >
                S'abonner
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-brand-yellow">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-wider text-white">
                TUK<span className="text-brand-yellow">KI</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              TUKKI est la plateforme de transport de nouvelle génération connectant les voyageurs à des trajets écologiques, rapides et sécurisés au Sénégal. Réservez des bus confortables et des navettes en quelques clics.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Globe className="w-4 h-4 text-brand-green" />
              <span>Disponible en Français & Wolof</span>
            </div>
          </div>

          {/* Popular Routes */}
          <div>
            <h4 className="text-sm font-semibold uppercase text-white tracking-wider mb-4">Lignes Populaires</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search?from=Dakar&to=Saint-Louis&date=2026-06-15" className="hover:text-white transition">Dakar ➔ Saint-Louis</Link>
              </li>
              <li>
                <Link href="/search?from=Dakar&to=Touba&date=2026-06-15" className="hover:text-white transition">Dakar ➔ Touba</Link>
              </li>
              <li>
                <Link href="/search?from=Dakar&to=Ziguinchor&date=2026-06-15" className="hover:text-white transition">Dakar ➔ Ziguinchor</Link>
              </li>
              <li>
                <Link href="/search?from=Thi%C3%A8s&to=Dakar&date=2026-06-15" className="hover:text-white transition">Thiès ➔ Dakar</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase text-white tracking-wider mb-4">Entreprise</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition">À propos</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">Carrières</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">Devenir Partenaire</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">Espace Presse</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase text-white tracking-wider mb-4">Contact & Assistance</h4>
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="w-4 h-4 text-brand-yellow shrink-0" />
              <span>+221 33 824 00 00</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-brand-yellow shrink-0" />
              <span>support@tukki.sn</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <MapPin className="w-4 h-4 text-brand-yellow shrink-0" />
              <span>Avenue Cheikh Anta Diop, Dakar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal bar */}
      <div className="bg-gray-950 text-gray-500 py-6 border-t border-gray-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} TUKKI Sénégal. Tous droits réservés.
          </div>
          <div className="flex space-x-6">
            <Link href="#" className="hover:text-gray-300 transition">Conditions d'utilisation</Link>
            <Link href="#" className="hover:text-gray-300 transition">Politique de confidentialité</Link>
            <Link href="#" className="hover:text-gray-300 transition">Gestion des Cookies</Link>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <CreditCard className="w-4 h-4 text-brand-green" />
            <span>Paiement sécurisé crypté SSL (Wave, Orange Money)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
