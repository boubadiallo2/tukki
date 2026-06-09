import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight,
  Building2,
  TicketCheck,
  CreditCard,
  Users
} from "lucide-react";

const STATS = [
  {
    title: "Volume d'Affaires Global",
    value: "12,450,000 FCFA",
    change: "+15.2%",
    isPositive: true,
    icon: Wallet,
    color: "text-slate-900",
    bgColor: "bg-slate-100"
  },
  {
    title: "Revenus Plateforme",
    value: "854,000 FCFA",
    change: "+18.5%",
    isPositive: true,
    icon: TrendingUp,
    color: "text-brand-yellow",
    bgColor: "bg-brand-yellow/10"
  },
  {
    title: "Billets Vendus",
    value: "8,540",
    change: "+12.1%",
    isPositive: true,
    icon: TicketCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  {
    title: "Compagnies Actives",
    value: "14",
    change: "+2",
    isPositive: true,
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  }
];

const TOP_COMPANIES = [
  { name: "Tukki Express", revenue: "5,200,000 FCFA", tickets: 3450, growth: "+12%" },
  { name: "Horizon Navette", revenue: "3,150,000 FCFA", tickets: 2100, growth: "+8%" },
  { name: "Volt Transport", revenue: "2,800,000 FCFA", tickets: 1950, growth: "+15%" },
  { name: "Star Lines", revenue: "1,300,000 FCFA", tickets: 1040, growth: "-2%" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vue Globale Plateforme 🌍</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Supervisez l'activité de toutes les compagnies partenaires.</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-hidden focus:border-slate-900 cursor-pointer shadow-xs">
            <option>Ce mois-ci</option>
            <option>Mois dernier</option>
            <option>Cette année</option>
          </select>
          <button className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center space-x-2">
            <span>Télécharger Bilan</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {STATS.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${
                stat.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}>
                <span>{stat.change}</span>
                {stat.isPositive && <ArrowUpRight className="w-3 h-3" />}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.title}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart (Placeholder) */}
        <div className="lg:col-span-2 bg-white p-7 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-lg font-black text-gray-900">Évolution des Commissions</h2>
              <p className="text-xs text-gray-500 font-semibold mt-1">Revenus générés par les frais de service (100 FCFA/billet)</p>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[30, 45, 40, 60, 55, 80, 95].map((height, i) => (
              <div key={i} className="w-full flex flex-col justify-end items-center group">
                <div 
                  className="w-full bg-brand-yellow/30 group-hover:bg-brand-yellow rounded-t-sm transition-colors relative"
                  style={{ height: `${height}%` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(height * 1.5).toFixed(0)}k
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-900">Top Partenaires</h2>
            <button className="text-slate-600 hover:text-slate-900 hover:underline text-xs font-bold">Voir tout</button>
          </div>
          <div className="space-y-4">
            {TOP_COMPANIES.map((company, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center text-sm border border-slate-200">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{company.name}</p>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 mt-0.5">
                      <span className="flex items-center"><TicketCheck className="w-3 h-3 mr-1" /> {company.tickets}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{company.revenue}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold ${
                    company.growth.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {company.growth} ce mois
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
