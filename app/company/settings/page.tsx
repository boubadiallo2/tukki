"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Phone, 
  Palette, 
  Wifi, 
  Wind, 
  BatteryCharging, 
  Coffee, 
  MonitorPlay,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

const AVAILABLE_AMENITIES = [
  { id: "Climatisation", icon: Wind, label: "Climatisation" },
  { id: "WiFi", icon: Wifi, label: "WiFi à bord" },
  { id: "Prises USB", icon: BatteryCharging, label: "Prises USB" },
  { id: "Collations", icon: Coffee, label: "Collations" },
  { id: "TV", icon: MonitorPlay, label: "Écrans TV" },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    owner_phone: "",
    color: "#059669",
    logo_url: "",
    amenities: [] as string[]
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();

        if (company) {
          setFormData({
            name: company.name || "",
            owner_phone: company.owner_phone || "",
            color: company.color || "#059669",
            logo_url: company.logo_url || "",
            amenities: company.amenities || []
          });
          setLogoPreview(company.logo_url || null);
        }
      }
      setLoading(false);
    };

    fetchCompanyData();
  }, []);

  const toggleAmenity = (amenityId: string) => {
    setFormData(prev => {
      const current = prev.amenities || [];
      if (current.includes(amenityId)) {
        return { ...prev, amenities: current.filter(a => a !== amenityId) };
      } else {
        return { ...prev, amenities: [...current, amenityId] };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      let finalLogoUrl = formData.logo_url;

      // S'il y a un nouveau fichier logo
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${companyId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, logoFile, { cacheControl: '3600', upsert: true });

        if (uploadError) {
          throw new Error("Erreur lors de l'upload du logo: " + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('company-logos')
          .getPublicUrl(fileName);
          
        finalLogoUrl = publicUrl;
      }

      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          owner_phone: formData.owner_phone,
          color: formData.color,
          logo_url: finalLogoUrl,
          amenities: formData.amenities
        })
        .eq('id', companyId);

      if (error) {
        // Handle RLS silent failure by throwing an error or checking it
        throw error;
      }

      setSuccessMsg("Vos paramètres ont été mis à jour avec succès. Actualisez la page si vous avez modifié la couleur pour la voir s'appliquer au menu.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Une erreur est survenue lors de la sauvegarde. Assurez-vous d'avoir exécuté la politique RLS pour les compagnies.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Paramètres</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Gérez les informations et les préférences de votre compagnie.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-start space-x-3 border border-emerald-100">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-start space-x-3 border border-red-100">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Informations générales */}
          <div>
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-brand-green" />
              Informations générales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nom de la compagnie</label>
                <input 
                  type="text" required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Téléphone de contact</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" required 
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Identité visuelle */}
          <div>
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-brand-green" />
              Identité visuelle
            </h2>
              <div className="flex flex-col sm:flex-row gap-8">
                {/* Couleur */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Couleur principale</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative group">
                      <input 
                        type="color" 
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="w-14 h-14 rounded-2xl cursor-pointer border-2 border-white shadow-md p-0 overflow-hidden"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 uppercase">{formData.color}</span>
                      <span className="text-xs text-gray-500 font-medium">Cliquez pour modifier</span>
                    </div>
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Logo de la compagnie</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*"
                        id="logo-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLogoFile(file);
                            setLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <label 
                        htmlFor="logo-upload"
                        className="cursor-pointer inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Changer le logo</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 font-medium">Format recommandé: PNG, JPG (1:1)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Services à bord */}
          <div>
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center">
              <Wifi className="w-5 h-5 mr-2 text-brand-green" />
              Services à bord standards
            </h2>
            <p className="text-sm text-gray-500 font-medium mb-4">
              Sélectionnez les équipements et services généralement disponibles dans vos bus. Vous pourrez ajuster cela pour des trajets spécifiques si besoin.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AVAILABLE_AMENITIES.map((amenity) => {
                const isSelected = formData.amenities?.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? "border-brand-green bg-brand-green/5 ring-1 ring-brand-green" 
                        : "border-gray-200 bg-white hover:border-brand-green/30 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-brand-green text-white" : "bg-gray-100 text-gray-500"}`}>
                      <amenity.icon className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-bold ${isSelected ? "text-gray-900" : "text-gray-600"}`}>
                      {amenity.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
        
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-brand-green text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-green-dark transition-all flex items-center space-x-2 disabled:opacity-70 active:scale-95"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Enregistrer les modifications</span>
          </button>
        </div>
      </form>
    </div>
  );
}
