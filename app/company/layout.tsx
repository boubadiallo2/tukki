"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Map, 
  Ticket, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bus,
  Bell
} from "lucide-react";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Tableau de bord", href: "/company/dashboard", icon: LayoutDashboard },
    { name: "Trajets", href: "/company/trips", icon: Map },
    { name: "Réservations", href: "/company/bookings", icon: Ticket },
    { name: "Paramètres", href: "/company/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay & Menu */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex-1 max-w-[280px] w-full bg-white flex flex-col h-full transform transition-transform duration-300 ease-in-out">
            <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <Bus className="w-6 h-6 text-brand-green" />
                <span className="text-xl font-black text-gray-900 tracking-tight">
                  TUKKI <span className="text-brand-green text-xs uppercase tracking-widest block font-bold">Partner</span>
                </span>
              </Link>
              <button 
                className="ml-auto text-gray-500 hover:bg-gray-50 p-2 rounded-lg"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      isActive 
                        ? "bg-brand-green text-white shadow-sm" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-100 shrink-0">
              <button className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-white border-r border-gray-100 z-40 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <Bus className="w-6 h-6 text-brand-green" />
            <span className="text-xl font-black text-gray-900 tracking-tight">
              TUKKI <span className="text-brand-green text-xs uppercase tracking-widest block font-bold">Partner</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  isActive 
                    ? "bg-brand-green text-white shadow-sm" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 z-30 shrink-0 shadow-sm">
          <button 
            className="lg:hidden text-gray-500 hover:bg-gray-50 p-2 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <button className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-brand-yellow/20 flex items-center justify-center border border-brand-yellow/30 text-brand-yellow font-bold text-sm">
              TE
            </div>
            <div className="hidden sm:block text-sm">
              <p className="font-bold text-gray-900">Tukki Express</p>
              <p className="text-xs text-gray-500">Administrateur</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f4f7f6]">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
