"use client";

import Link from "next/link";
import { useState } from "react";
import { Compass, Menu, X, User, ShieldCheck, HelpCircle } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center text-brand-yellow shadow-md shadow-brand-green/20">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-2xl font-black tracking-wider text-brand-green">
                TUK<span className="text-brand-yellow-dark">KI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            <Link href="/" className="text-gray-700 hover:text-brand-green py-2 px-1 border-b-2 border-transparent hover:border-brand-green transition-all">
              Réserver un trajet
            </Link>
            <Link href="/#popular" className="text-gray-500 hover:text-brand-green py-2 px-1 border-b-2 border-transparent hover:border-brand-green transition-all">
              Destinations
            </Link>
            <Link href="/#features" className="text-gray-500 hover:text-brand-green py-2 px-1 border-b-2 border-transparent hover:border-brand-green transition-all">
              Pourquoi TUKKI
            </Link>
          </nav>

          {/* Desktop Right Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center text-xs text-gray-500 space-x-1 border border-gray-100 bg-gray-50 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
              <span>Garantie Voyage Sécurisé</span>
            </div>
            <button className="flex items-center space-x-1 text-gray-700 hover:text-brand-green font-medium text-sm transition">
              <HelpCircle className="w-4 h-4" />
              <span>Aide</span>
            </button>
            <button className="flex items-center space-x-2 bg-brand-green text-white hover:bg-brand-green-dark px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition duration-200">
              <User className="w-4 h-4" />
              <span>Se connecter</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-brand-green hover:bg-gray-100 focus:outline-hidden transition"
              aria-expanded="false"
            >
              <span className="sr-only">Ouvrir le menu principal</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-medium text-gray-700 hover:text-brand-green hover:bg-gray-50"
            >
              Réserver un trajet
            </Link>
            <Link
              href="/#popular"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-medium text-gray-500 hover:text-brand-green hover:bg-gray-50"
            >
              Destinations
            </Link>
            <Link
              href="/#features"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-medium text-gray-500 hover:text-brand-green hover:bg-gray-50"
            >
              Pourquoi TUKKI
            </Link>
            <div className="pt-4 pb-2 border-t border-gray-100">
              <div className="flex items-center px-3 text-xs text-gray-500 space-x-1.5 mb-3">
                <ShieldCheck className="w-4 h-4 text-brand-green" />
                <span>Garantie Voyage Sécurisé Active</span>
              </div>
              <button className="w-full flex items-center justify-center space-x-2 bg-brand-green text-white hover:bg-brand-green-dark px-4 py-3 rounded-xl text-base font-semibold shadow-xs transition">
                <User className="w-4 h-4" />
                <span>Se connecter / S'inscrire</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
