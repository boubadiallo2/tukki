"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { 
  Settings2, 
  CreditCard, 
  PhoneCall, 
  ShieldAlert, 
  Save, 
  Loader2, 
  CheckCircle2,
  Percent,
  Coins
} from "lucide-react";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    commissionRate: 0,
    fixedFee: 100,
    supportEmail: "support@tukki.sn",
    supportPhone: "+221 33 824 00 00",
    supportAddress: "Avenue Cheikh Anta Diop, Dakar",
    maintenanceMode: false,
    paydunyaApiKey: "tk_live_*********************",
    waveApiKey: "wv_live_*********************"
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          commissionRate: data.commission_rate,
          fixedFee: data.fixed_fee,
          supportEmail: data.support_email,
          supportPhone: data.support_phone,
          supportAddress: data.support_address,
          maintenanceMode: data.maintenance_mode
        }));
      }
    } catch (err) {
      console.error("Erreur lors du chargement des paramètres:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({
          commission_rate: 0, // No percentage commission anymore
          fixed_fee: formData.fixedFee,
          support_email: formData.supportEmail,
          support_phone: formData.supportPhone,
          support_address: formData.supportAddress,
          maintenance_mode: formData.maintenanceMode,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;
      
      setSuccessMsg("Paramètres de la plateforme mis à jour avec succès.");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      alert("Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Paramètres Plateforme</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Configurez les frais, les contacts de support et les intégrations globales.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-start space-x-3 border border-emerald-100">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Frais & Commissions */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center">
              <Settings2 className="w-5 h-5 mr-2 text-brand-yellow" />
              Frais & Commissions
            </h2>
            
            <div className="max-w-md">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Commission par ticket vendu (FCFA)</label>
                <p className="text-xs text-slate-500 mb-3">Montant fixe prélevé comme commission sur chaque billet vendu.</p>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" required 
                    value={formData.fixedFee}
                    onChange={(e) => setFormData({...formData, fixedFee: parseInt(e.target.value) || 0})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Client */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center">
              <PhoneCall className="w-5 h-5 mr-2 text-brand-yellow" />
              Contact & Support Technique
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Email du support public</label>
                <input 
                  type="email" required 
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({...formData, supportEmail: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Téléphone de contact</label>
                <input 
                  type="tel" required 
                  value={formData.supportPhone}
                  onChange={(e) => setFormData({...formData, supportPhone: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-900 mb-1">Adresse physique</label>
                <input 
                  type="text" required 
                  value={formData.supportAddress}
                  onChange={(e) => setFormData({...formData, supportAddress: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Passerelles de paiement */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-brand-yellow" />
              Intégrations de Paiement
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Clé API PayDunya (Live)</label>
                <input 
                  type="password" required 
                  value={formData.paydunyaApiKey}
                  onChange={(e) => setFormData({...formData, paydunyaApiKey: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1">Clé API Wave (Live)</label>
                <input 
                  type="password" required 
                  value={formData.waveApiKey}
                  onChange={(e) => setFormData({...formData, waveApiKey: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-3xl border border-red-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-black text-red-600 mb-2 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2" />
              Mode Maintenance & Sécurité
            </h2>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Bloquez temporairement l'accès à la plateforme client (app et site web) en cas de mise à jour critique.
            </p>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.maintenanceMode}
                  onChange={(e) => setFormData({...formData, maintenanceMode: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </div>
              <span className="text-sm font-bold text-slate-900">Activer le mode maintenance</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-all flex items-center space-x-2 disabled:opacity-70 active:scale-95"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Enregistrer la configuration globale</span>
          </button>
        </div>
      </form>
    </div>
  );
}
