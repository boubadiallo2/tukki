import Header from "./components/Header";
import Footer from "./components/Footer";
import SearchForm from "./components/SearchForm";
import { ShieldCheck, Leaf, CreditCard, Sparkles, MapPin, Star, Flame, ArrowRight, Compass, Ticket, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { supabase } from "./lib/supabaseClient";

const FALLBACK_DESTINATIONS = [
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

export default async function Home() {
  let popularDestinations = [...FALLBACK_DESTINATIONS];

  try {
    const { data: trips, error } = await supabase
      .from('trips')
      .select('departure_city, arrival_city, price, duration, is_daily, companies(rating)')
      .limit(50); // Get enough to find unique ones

    if (!error && trips && trips.length > 0) {
      const uniqueRoutes = new Map();
      trips.forEach(t => {
        const key = `${t.departure_city}-${t.arrival_city}`;
        if (!uniqueRoutes.has(key)) {
          uniqueRoutes.set(key, {
            from: t.departure_city,
            to: t.arrival_city,
            price: t.price,
            time: t.duration,
            rating: parseFloat((t.companies as any)?.rating) || 4.8,
            tag: t.is_daily ? "Quotidien" : "Tendance"
          });
        }
      });

      const uniqueTrips = Array.from(uniqueRoutes.values()).slice(0, 4);
      if (uniqueTrips.length > 0) {
        const bgGradients = [
          "from-emerald-600 to-teal-800",
          "from-blue-600 to-indigo-800",
          "from-cyan-600 to-blue-800",
          "from-orange-500 to-red-700"
        ];
        
        popularDestinations = uniqueTrips.map((dest, i) => ({
          ...dest,
          bgGradient: bgGradients[i % 4]
        }));
      }
    }
  } catch (err) {
    console.error("Failed to fetch popular trips", err);
  }
  return (
    <>
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-[#0d5c31] text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8 z-50">
          <div className="max-w-7xl mx-auto text-center relative z-10 space-y-5">
            {/* Top Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[13px] font-medium text-white shadow-sm">
              <span className="text-brand-yellow"><Ticket className="w-4 h-4" /></span>
              <span>TUKKI, votre plateforme fiable pour réserver <span className="bg-white/20 px-1 rounded">vos tickets</span> de bus partout au Sénégal, 24h/24 et 7j/7.</span>
            </div>

            {/* Headlines */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight leading-[1.1] max-w-5xl mx-auto drop-shadow-sm">
              Réservez votre ticket de voyage partout au Sénégal,<br />
              <span className="text-brand-yellow drop-shadow-md">en quelques clics.</span>
            </h1>

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
              <Link href="/partenaire" className="flex items-center space-x-1.5 bg-brand-yellow hover:bg-yellow-500 border border-yellow-400 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)] text-slate-900 transition-colors cursor-pointer z-30">
                <span className="font-bold">Devenir Partenaire</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
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
                Pourquoi TUKKI ?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100/60 hover:shadow-md hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-green flex items-center justify-center text-2xl mb-5">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Comparez plusieurs compagnies</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Comparez les horaires, les prix et les disponibilités des compagnies de transport sur une seule plateforme.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100/60 hover:shadow-md hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-5">🎫</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Réservation instantanée</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Réservez votre ticket en quelques clics et recevez votre confirmation immédiatement.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100/60 hover:shadow-md hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-5">📱</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Paiement mobile sécurisé</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Payez facilement avec Wave, Orange Money ou Free Money sans vous déplacer.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100/60 hover:shadow-md hover:-translate-y-1 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center text-2xl mb-5">🚍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Plus de destinations</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Accédez aux trajets vers Touba, Saint-Louis, Kaolack, Tambacounda, Kolda et bien d'autres villes.</p>
              </div>
            </div>

            {/* Trust Counter */}
            <div className="bg-brand-green/5 rounded-3xl border border-brand-green/10 p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-black text-brand-green mb-1">+10</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">compagnies partenaires</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-brand-green mb-1">+50</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">destinations</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-brand-green mb-1">+5 000</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">tickets réservés</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-brand-green mb-1">99%</div>
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">satisfaction client</div>
                </div>
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
              <Link href="/search" className="flex items-center space-x-1 text-sm font-bold text-brand-green hover:underline">
                <span>Voir tous les trajets</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularDestinations.map((dest) => (
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
