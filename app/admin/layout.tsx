"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import {
  LayoutDashboard,
  Building2,
  Ticket,
  Settings,
  LogOut,
  Menu,
  X,
  Compass,
  Bell,
  BarChart3,
  Users
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navigation = [
    { name: "Vue Globale", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Compagnies", href: "/admin/companies", icon: Building2 },
    { name: "Réservations", href: "/admin/bookings", icon: Ticket },
    { name: "Rapports & Finances", href: "/admin/reports", icon: BarChart3 },
    { name: "Utilisateurs", href: "/admin/users", icon: Users },
    { name: "Paramètres Plateforme", href: "/admin/settings", icon: Settings },
  ];

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay & Menu */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex-1 max-w-[280px] w-full bg-[#0F172A] text-slate-300 flex flex-col h-full transform transition-transform duration-300 ease-in-out">
            <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2 text-white cursor-default">
                <Compass className="w-6 h-6 text-brand-yellow" />
                <span className="text-xl font-black tracking-tight">
                  TUKKI <span className="text-brand-yellow text-[10px] uppercase tracking-widest block font-bold">Super Admin</span>
                </span>
              </div>
              <button
                className="ml-auto text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg"
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
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive
                        ? "bg-brand-yellow text-slate-900 shadow-sm"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-slate-900" : "text-slate-500"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              <button 
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-xl font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors mt-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (Dark Theme for Super Admin) */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-[#0F172A] text-slate-300 z-40 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2 text-white cursor-default transition-colors">
            <Compass className="w-6 h-6 text-brand-yellow" />
            <span className="text-xl font-black tracking-tight">
              TUKKI <span className="text-brand-yellow text-[10px] uppercase tracking-widest block font-bold leading-tight">Super Admin</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${isActive
                    ? "bg-brand-yellow text-slate-900 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-slate-900" : "text-slate-500"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-xl font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </nav>
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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-yellow rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 text-white font-bold text-sm">
              AD
            </div>
            <div className="hidden sm:block text-sm">
              <p className="font-bold text-gray-900">Admin TUKKI</p>
              <p className="text-xs text-gray-500">Super Administrateur</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8f9fa]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
