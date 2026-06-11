import Header from "../components/Header";
import Footer from "../components/Footer";
import { Mail, Phone, Building2, ShieldCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

export default async function PartenairePage() {
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('support_phone, support_email')
    .eq('id', 1)
    .single();

  const phone = settings?.support_phone || "+221 33 824 00 00";
  const email = settings?.support_email || "partenaires@tukki.sn";
  return (
    <>
      <Header />
      <main className="flex-grow bg-gray-50 pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 tracking-tight">Devenez Partenaire TUKKI</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">Rejoignez la plateforme leader de réservation de bus au Sénégal et digitalisez votre entreprise de transport.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 mb-12">
            <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">Pourquoi nous rejoindre ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Plus de visibilité</h3>
                <p className="text-sm text-gray-500 font-medium">Touchez des milliers de voyageurs à travers tout le pays.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Gestion simplifiée</h3>
                <p className="text-sm text-gray-500 font-medium">Un tableau de bord complet pour gérer vos bus et réservations.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Paiements sécurisés</h3>
                <p className="text-sm text-gray-500 font-medium">Recevez vos revenus directement de manière transparente.</p>
              </div>
            </div>

            <hr className="border-gray-100 mb-12" />

            <div className="bg-[#0F172A] rounded-2xl p-8 sm:p-10 text-white text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">Prêt à moderniser votre compagnie ?</h2>
                <p className="text-gray-300 font-medium mb-8 max-w-xl mx-auto">Contactez notre équipe commerciale pour configurer votre compte partenaire et commencer à vendre vos billets en ligne dès aujourd'hui.</p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-brand-yellow bg-white/5 p-6 rounded-xl border border-white/10 max-w-2xl mx-auto backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-brand-yellow/20 p-2 rounded-lg">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">{phone}</span>
                  </div>
                  <div className="hidden sm:block text-gray-600">|</div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-brand-yellow/20 p-2 rounded-lg">
                      <Mail className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">{email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
