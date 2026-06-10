"use client";

import { useState, useEffect } from "react";
import { Search, Building2, MapPin, Bus, CheckCircle, XCircle, MoreVertical, Eye, Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

export default function AdminCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newColor, setNewColor] = useState("#059669");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*, trips(id), profiles(email, role)')
      .order('created_at', { ascending: false });
    
    if (data) {
      setCompanies(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Insert Company into Supabase
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: newName,
          code: newCode,
          color: newColor
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Generate a random secure password
      const generatedPassword = `Tukki2026!${Math.floor(Math.random() * 1000)}`;

      // 3. Create Auth User via API
      const response = await fetch('/api/create-company-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: generatedPassword
        })
      });

      const authResult = await response.json();
      
      if (!response.ok) {
        throw new Error(authResult.error || "Erreur lors de la création du compte auth");
      }

      // 4. Update the profile with the company_id
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ company_id: companyData.id })
        .eq('id', authResult.userId);

      if (profileUpdateError) throw profileUpdateError;

      alert(`Compagnie ajoutée avec succès !\n\nEmail: ${newEmail}\nMot de passe par défaut: ${generatedPassword}\n\nVeuillez transmettre ces identifiants à la compagnie.`);
      
      setIsModalOpen(false);
      fetchCompanies(); // Refresh list
      
      // Reset form
      setNewName("");
      setNewCode("");
      setNewEmail("");

    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Compagnies Partenaires</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérez les opérateurs de transport inscrits sur TUKKI.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une compagnie</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Rechercher une compagnie..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Compagnie & Code</th>
                <th className="p-4">Statistiques</th>
                <th className="p-4">Contact (Email Admin)</th>
                <th className="p-4">Statut</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-green" />
                    Chargement des compagnies...
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">
                    Aucune compagnie trouvée.
                  </td>
                </tr>
              ) : filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: company.color || '#059669', color: 'white' }}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{company.name}</p>
                        <p className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-bold mt-1 inline-block border border-slate-200">
                          {company.code}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1.5 text-xs font-semibold text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {company.trips?.length || 0} Trajets enregistrés
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-700">
                    {company.profiles && company.profiles.length > 0 
                      ? company.profiles[0].email 
                      : <span className="text-gray-400 italic">Aucun compte lié</span>}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Actif
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Plus d'actions">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout de compagnie */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">Nouvelle Compagnie</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-1 border border-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCompany} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl border border-red-100">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nom de la compagnie</label>
                <input 
                  type="text" required 
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:bg-white"
                  placeholder="Ex: Tukki Express"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Code Compagnie (3-4 lettres)</label>
                <input 
                  type="text" required maxLength={5}
                  value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:bg-white uppercase"
                  placeholder="Ex: TUK"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Email (pour la connexion de la compagnie)</label>
                <input 
                  type="email" required 
                  value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:bg-white"
                  placeholder="Ex: contact@tukki-express.sn"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Couleur de la marque</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    value={newColor} onChange={(e) => setNewColor(e.target.value)}
                    className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm text-gray-500 font-medium uppercase">{newColor}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-brand-green text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-green-dark transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Créer la compagnie</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
