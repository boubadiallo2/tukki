import { 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowUpRight,
  Bus,
  Clock,
  MoreVertical
} from "lucide-react";

const STATS = [
  {
    title: "Revenu du Jour",
    value: "450,000 FCFA",
    change: "+12.5%",
    isPositive: true,
    icon: Wallet,
    color: "text-brand-green",
    bgColor: "bg-emerald-50"
  },
  {
    title: "Billets Vendus",
    value: "128",
    change: "+5.2%",
    isPositive: true,
    icon: TicketIcon,
    color: "text-brand-yellow",
    bgColor: "bg-amber-50"
  },
  {
    title: "Passagers Uniques",
    value: "115",
    change: "-2.1%",
    isPositive: false,
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    title: "Taux de Remplissage",
    value: "84%",
    change: "+8.4%",
    isPositive: true,
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  }
];

const DEPARTURES = [
  {
    id: "TR-102",
    route: "Dakar ➔ Saint-Louis",
    time: "14:15",
    bus: "Bus Climatisé - 50 places",
    booked: 45,
    status: "En attente"
  },
  {
    id: "TR-105",
    route: "Dakar ➔ Touba",
    time: "15:30",
    bus: "Minibus VIP - 15 places",
    booked: 15,
    status: "Complet"
  },
  {
    id: "TR-108",
    route: "Thiès ➔ Dakar",
    time: "16:00",
    bus: "Bus Standard - 50 places",
    booked: 28,
    status: "En attente"
  }
];

// Defining TicketIcon since it's used in STATS but we imported other icons.
function TicketIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bonjour, Tukki Express 👋</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Voici le résumé de votre activité aujourd'hui.</p>
        </div>
        <button className="bg-brand-green text-white hover:bg-brand-green-dark px-4 py-2 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center space-x-2">
          <span>Exporter le rapport</span>
        </button>
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
        {/* Main Chart Area (Placeholder) */}
        <div className="lg:col-span-2 bg-white p-7 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-black text-gray-900">Ventes de la semaine</h2>
            <select className="bg-gray-50 border border-gray-100 text-gray-600 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-brand-green">
              <option>Cette semaine</option>
              <option>Semaine dernière</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {/* Simple bar chart mock */}
            {[40, 70, 45, 90, 65, 80, 100].map((height, i) => (
              <div key={i} className="w-full flex flex-col justify-end items-center group">
                <div 
                  className="w-full bg-brand-green/20 group-hover:bg-brand-green rounded-t-sm transition-colors relative"
                  style={{ height: `${height}%` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {height * 10}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-400 mt-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Departures */}
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-900">Prochains départs</h2>
            <button className="text-brand-green hover:underline text-xs font-bold">Voir tout</button>
          </div>
          <div className="space-y-4">
            {DEPARTURES.map((departure) => (
              <div key={departure.id} className="flex items-start justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="bg-emerald-50 text-brand-green p-2 rounded-lg mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{departure.time}</p>
                    <p className="text-xs font-bold text-gray-600 mt-0.5">{departure.route}</p>
                    <div className="flex items-center space-x-1 text-[10px] text-gray-400 mt-1">
                      <Bus className="w-3 h-3" />
                      <span>{departure.bus}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                    departure.status === 'Complet' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {departure.status}
                  </span>
                  <p className="text-xs font-bold text-gray-500 mt-1">{departure.booked} résa.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
