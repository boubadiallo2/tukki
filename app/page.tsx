import Header from "./components/Header";
import Footer from "./components/Footer";
import SearchForm from "./components/SearchForm";
import { ShieldCheck, Leaf, CreditCard, Sparkles, MapPin, Star, Flame, ArrowRight, Compass, Ticket, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const POPULAR_DESTINATIONS = [
  {
    from: "Dakar",
    to: "Saint-Louis",
    price: 5000,
    time: "4h 15m",
    rating: 4.9,
    bgGradient: "from-emerald-600 to-teal-800",
    tag: "Tendance"
  },
  {
    from: "Dakar",
    to: "Touba",
    price: 4000,
    time: "3h 45m",
    rating: 4.8,
    bgGradient: "from-blue-600 to-indigo-800",
    tag: "Populaire"
  },
  {
    from: "Dakar",
    to: "Ziguinchor",
    price: 12000,
    time: "8h 30m",
    rating: 4.7,
    bgGradient: "from-cyan-600 to-blue-800",
    tag: "Long Trajet"
  },
  {
    from: "Thiès",
    to: "Dakar",
    price: 1500,
    time: "1h 15m",
    rating: 4.9,
    bgGradient: "from-orange-500 to-red-700",
    tag: "Navette"
  }
];

export default function Home() {
  return (
    <>
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-[#0d5c31] text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10 space-y-5">
            {/* Top Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[13px] font-medium text-white shadow-sm">
              <span className="text-brand-yellow text-base">✨</span>
              <span>Économisez 20% sur <span className="bg-white/20 px-1 rounded">votre premier voyage</span> avec le code FIRST20</span>
            </div>
            
            {/* Headlines */}
            <h1 className="text-3xl sm:text-4xl lg:text-[54px] font-black tracking-tight leading-[1.1] max-w-5xl mx-auto drop-shadow-sm">
              Réservez Vos Tickets de Bus<br />
              <span className="text-brand-yellow drop-shadow-md">Simplement, Rapidement, Sécurisé.</span>
            </h1>
            
            {/* Subheadline with Ticket icon */}
            <div className="flex items-center justify-center space-x-2.5 text-[13px] sm:text-sm text-emerald-50 max-w-2xl mx-auto font-medium">
               <div className="border-[1.5px] border-brand-yellow text-brand-yellow p-1 rounded-md shadow-xs">
                 <Ticket className="w-5 h-5" />
               </div>
               <p>TUKKI, votre plateforme fiable pour réserver <span className="underline decoration-brand-yellow decoration-2 underline-offset-4">vos tickets</span> de bus<br className="hidden sm:block"/> partout au Sénégal, 24h/24 et 7j/7.</p>
            </div>

            {/* Features Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-[13px] font-semibold text-emerald-100 pt-3 pb-6">
              <div className="flex items-center space-x-1.5 text-brand-yellow">
                <span className="text-base">⚡</span>
                <span>Réservation instantanée</span>
              </div>
              <span className="text-emerald-700/50 hidden sm:block">|</span>
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-yellow" />
                <span>Paiement 100% sécurisé</span>
              </div>
              <span className="text-emerald-700/50 hidden sm:block">|</span>
              <div className="flex items-center space-x-1.5 bg-[#0a4d2e] border border-emerald-500/40 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.25)] text-white">
                <CheckCircle2 className="w-4 h-4 text-brand-yellow" />
                <span>Confirmation immédiate</span>
              </div>
              <span className="text-emerald-700/50 hidden sm:block">|</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-base">🎧</span>
                <span>Support client 7j/7</span>
              </div>
            </div>

            {/* Overlapping Search Form */}
            <div className="max-w-5xl mx-auto text-left text-gray-800 relative z-20">
              <SearchForm />
            </div>
          </div>
        </section>

        {/* Feature Highlights (Why Choose TUKKI) */}
        <section id="features" className="py-20 bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                Conçu pour les Voyageurs Modernes
              </h2>
              <p className="text-gray-600 font-medium">
                Nous associons tarifs abordables, flexibilité et éco-responsabilité. Voici ce qui fait notre force :
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100/60 hover:shadow-md hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center mb-5">
                  <Leaf className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Trajets Éco-responsables</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Choisissez nos navettes 100% électriques ou nos bus de dernière génération pour réduire drastiquement votre impact environnemental.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100/60 hover:shadow-md hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Sécurité Garantie</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Chauffeurs professionnels qualifiés, véhicules assurés et géolocalisés, et assistance téléphonique 24h/24.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100/60 hover:shadow-md hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Paiement Mobile Local</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Payez en toute sécurité via Wave, Orange Money ou carte. Annulation gratuite et remboursement rapide jusqu'à 24h avant.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100/60 hover:shadow-md hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-5">
                  <Star className="w-6 h-6 text-brand-green" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Confort Premium</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Profitez de notre Wi-Fi à bord, de prises USB individuelles pour charger votre téléphone, de la climatisation et de sièges spacieux.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Routes Section */}
        <section id="popular" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Lignes Populaires au Sénégal</h2>
                <p className="text-gray-500 font-medium mt-1">Déplacez-vous confortablement entre nos grandes villes et régions.</p>
              </div>
              <div className="flex items-center space-x-1 text-sm font-bold text-brand-green hover:underline">
                <span>Voir tous les trajets</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {POPULAR_DESTINATIONS.map((dest) => (
                <Link
                  key={`${dest.from}-${dest.to}`}
                  href={`/search?from=${dest.from}&to=${dest.to}&date=2026-06-15`}
                  className="group relative rounded-2xl overflow-hidden aspect-5/4 shadow-sm hover:shadow-lg transition duration-300 cursor-pointer block"
                >
                  {/* Decorative background gradient representing city vibe */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${dest.bgGradient} transition group-hover:scale-105 duration-500`}></div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition duration-300"></div>

                  {/* Absolute Tag */}
                  <div className="absolute top-4 left-4 bg-white/90 text-gray-800 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center space-x-1.5 shadow-xs">
                    <Flame className="w-3.5 h-3.5 text-brand-yellow shrink-0 fill-brand-yellow" />
                    <span>{dest.tag}</span>
                  </div>

                  {/* Rating */}
                  <div className="absolute top-4 right-4 bg-brand-green text-white text-xs font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                    <span>{dest.rating}</span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex flex-col justify-end">
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-200 font-semibold mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>Quotidien • {dest.time}</span>
                    </div>
                    <h3 className="text-lg font-black tracking-tight">{dest.from} ➔ {dest.to}</h3>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                      <span className="text-xs text-white/80">Aller simple dès</span>
                      <span className="text-lg font-black text-brand-yellow">{dest.price.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>


      </main>

      <Footer />
    </>
  );
}
