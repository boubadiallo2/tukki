"use client";

import { useState, useEffect } from "react";
import { Search, Building2, MapPin, CheckCircle, Plus, X, Loader2, Trash2, Edit2, Phone, AlertTriangle, Check, Clock, Ban, CheckCircle2 } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

export default function AdminCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'PENDING' | 'APPROVED' | 'SUSPENDED'>('PENDING');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  // Custom Alert & Delete Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<{id: string, name: string} | null>(null);
  const [alertContent, setAlertContent] = useState<{title: string, message: React.ReactNode, type?: 'success' | 'error'} | null>(null);

  // Form states
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newColor, setNewColor] = useState("#059669");
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  
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

  // Auto-generate company code
  useEffect(() => {
    if (!isCodeManuallyEdited && newName) {
      const autoCode = newName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
      setNewCode(autoCode);
    } else if (!newName && !isCodeManuallyEdited) {
      setNewCode("");
    }
  }, [newName, isCodeManuallyEdited]);

  const resetForm = () => {
    setNewName("");
    setNewCode("");
    setNewEmail("");
    setNewOwnerName("");
    setNewOwnerPhone("");
    setNewColor("#059669");
    setIsCodeManuallyEdited(false);
    setErrorMsg("");
  };

  const openEditModal = (company: any) => {
    setEditingCompanyId(company.id);
    setNewName(company.name);
    setNewCode(company.code);
    setNewOwnerName(company.owner_name || "");
    setNewOwnerPhone(company.owner_phone || "");
    setNewColor(company.color || "#059669");
    setIsCodeManuallyEdited(true);
    setIsEditModalOpen(true);
  };

  const promptDeleteCompany = (id: string, name: string) => {
    setCompanyToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      const { error } = await supabase.from('companies').delete().eq('id', companyToDelete.id);
      if (error) throw error;
      
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
      fetchCompanies();
      
      setAlertContent({
        type: 'success',
        title: "Compagnie supprimée",
        message: "La compagnie a été retirée de la plateforme avec succès."
      });
      
    } catch (err: any) {
      console.error(err);
      setIsDeleteModalOpen(false);
      setAlertContent({ 
        type: 'error',
        title: "Erreur de suppression", 
        message: err.message 
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: newName,
          code: newCode,
          color: newColor,
          owner_name: newOwnerName,
          owner_phone: newOwnerPhone
        })
        .eq('id', editingCompanyId);

      if (error) {
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          if (error.message.includes('companies_code_key')) {
            throw new Error("Ce code de compagnie est déjà utilisé. Veuillez en choisir un autre.");
          }
          throw new Error("Cette compagnie existe déjà.");
        }
        throw error;
      }

      setIsEditModalOpen(false);
      resetForm();
      fetchCompanies();
      
      setAlertContent({
        type: 'success',
        title: "Modifications enregistrées",
        message: "Les informations de la compagnie ont été mises à jour avec succès."
      });
      
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          color: newColor,
          owner_name: newOwnerName,
          owner_phone: newOwnerPhone
        })
        .select()
        .single();

      if (companyError) {
        if (companyError.code === '23505' || companyError.message.includes('duplicate key')) {
          if (companyError.message.includes('companies_code_key')) {
            throw new Error("Ce code de compagnie est déjà utilisé. Veuillez en choisir un autre.");
          }
          throw new Error("Cette compagnie existe déjà.");
        }
        throw companyError;
      }

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
        // Rollback
        await supabase.from('companies').delete().eq('id', companyData.id);

        if (authResult.error && authResult.error.toLowerCase().includes("already registered")) {
          throw new Error("Cette adresse email existe déjà. Veuillez utiliser un autre email.");
        } else if (authResult.error && authResult.error.toLowerCase().includes("rate limit")) {
          throw new Error("Limite de sécurité Supabase atteinte (trop d'emails envoyés). Allez dans Supabase > Authentication > Providers > Email, et désactivez 'Confirm email' pour continuer à tester sans limite.");
        }
        throw new Error(authResult.error || "Erreur lors de la création du compte auth");
      }

      // 4. Update the profile with the company_id
      const { data: updatedProfile, error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ company_id: companyData.id })
        .eq('id', authResult.userId)
        .select();

      if (profileUpdateError) throw profileUpdateError;
      if (!updatedProfile || updatedProfile.length === 0) {
        throw new Error("Compte créé mais impossible de lier la compagnie au profil. Veuillez réessayer ou vérifier les permissions (RLS).");
      }

      setIsModalOpen(false);
      resetForm();
      fetchCompanies(); // Refresh list

      // Custom Success Modal instead of native alert
      setAlertContent({
        type: 'success',
        title: "Compagnie ajoutée avec succès ! 🎉",
        message: (
          <div className="space-y-3 mt-4 text-left">
            <p className="text-gray-600 text-sm">Veuillez transmettre ces identifiants sécurisés au gérant de la compagnie pour qu'il puisse se connecter :</p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-mono text-sm space-y-2">
              <p><span className="font-bold text-gray-500 mr-2">Email:</span> <span className="text-slate-900">{newEmail}</span></p>
              <p><span className="font-bold text-gray-500 mr-2">Mot de passe:</span> <span className="text-brand-green font-black">{generatedPassword}</span></p>
            </div>
            <p className="text-xs text-red-500 font-bold mt-2">Attention : Ces identifiants ne s'afficheront qu'une seule fois.</p>
          </div>
        )
      });

    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      fetchCompanies();
      setAlertContent({
        type: 'success',
        title: "Statut mis à jour",
        message: "Le statut de la compagnie a été modifié avec succès."
      });
    } catch (err: any) {
      console.error(err);
      setAlertContent({
        type: 'error',
        title: "Erreur",
        message: err.message
      });
    }
  };

  const filteredCompanies = companies.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (c.status || 'APPROVED') === currentTab
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
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une compagnie</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setCurrentTab('PENDING')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              currentTab === 'PENDING' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setCurrentTab('APPROVED')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              currentTab === 'APPROVED' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Approuvées
          </button>
          <button
            onClick={() => setCurrentTab('SUSPENDED')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              currentTab === 'SUSPENDED' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Suspendues
          </button>
        </div>

        <div className="relative w-full sm:w-[300px]">
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
                <th className="p-4">Contact & Propriétaire</th>
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
                <tr key={company.id} className="hover:bg-gray-50/50 transition-colors group">
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
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-700">
                      {company.profiles && company.profiles.length > 0 
                        ? company.profiles[0].email 
                        : <span className="text-gray-400 italic">Aucun email lié</span>}
                    </div>
                    {company.owner_phone && (
                      <div className="flex items-center text-xs text-gray-500 mt-1 font-semibold">
                        <Phone className="w-3 h-3 mr-1" />
                        {company.owner_phone}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {company.status === 'PENDING' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock className="w-3 h-3 mr-1" />
                        En attente
                      </span>
                    )}
                    {(company.status === 'APPROVED' || !company.status) && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approuvée
                      </span>
                    )}
                    {company.status === 'SUSPENDED' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        <Ban className="w-3 h-3 mr-1" />
                        Suspendue
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(company.status === 'PENDING' || company.status === 'SUSPENDED') && (
                        <button 
                          onClick={() => handleChangeStatus(company.id, 'APPROVED')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                          title="Approuver"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {(company.status === 'APPROVED' || !company.status) && (
                        <button 
                          onClick={() => handleChangeStatus(company.id, 'SUSPENDED')}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                          title="Suspendre"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => openEditModal(company)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => promptDeleteCompany(company.id, company.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">Nouvelle Compagnie</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-1 border border-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCompany} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl border border-red-100 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nom de la compagnie</label>
                <input 
                  type="text" required 
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                  placeholder="Ex: Tukki Express"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Code Compagnie (Généré auto.)</label>
                <input 
                  type="text" required maxLength={5}
                  value={newCode} 
                  onChange={(e) => {
                    setNewCode(e.target.value.toUpperCase());
                    setIsCodeManuallyEdited(true);
                  }}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white uppercase font-bold text-brand-green transition-all"
                  placeholder="Ex: TUKK"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nom du propriétaire</label>
                <input 
                  type="text" required 
                  value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                  placeholder="Ex: M. Diallo"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Téléphone du propriétaire</label>
                <input 
                  type="tel" required 
                  value={newOwnerPhone} onChange={(e) => setNewOwnerPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                  placeholder="Ex: +221 77 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Email (pour la connexion de la compagnie)</label>
                <input 
                  type="email" required 
                  value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                  placeholder="Ex: contact@tukki-express.sn"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Couleur de la marque</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="color" 
                    value={newColor} onChange={(e) => setNewColor(e.target.value)}
                    className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm text-gray-500 font-medium uppercase bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">{newColor}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3 mt-6">
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
                  className="bg-brand-green text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-green-dark transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Créer la compagnie</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Modification */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">Modifier la Compagnie</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-1 border border-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl border border-red-100 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nom de la compagnie</label>
                <input 
                  type="text" required 
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Code Compagnie (3-4 lettres)</label>
                <input 
                  type="text" required maxLength={5}
                  value={newCode} 
                  onChange={(e) => {
                    setNewCode(e.target.value.toUpperCase());
                    setIsCodeManuallyEdited(true);
                  }}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white uppercase font-bold text-brand-green transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nom du propriétaire</label>
                <input 
                  type="text" required 
                  value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Téléphone du propriétaire</label>
                <input 
                  type="tel" required 
                  value={newOwnerPhone} onChange={(e) => setNewOwnerPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Couleur de la marque</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="color" 
                    value={newColor} onChange={(e) => setNewColor(e.target.value)}
                    className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm text-gray-500 font-medium uppercase bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">{newColor}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      {isDeleteModalOpen && companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Supprimer la compagnie ?</h3>
              <p className="text-sm text-gray-500 font-medium">
                Vous êtes sur le point de supprimer définitivement <strong className="text-gray-900">{companyToDelete.name}</strong>.
                <br /><br />
                <span className="text-red-500 font-bold">Cette action est irréversible</span> et supprimera également tous les trajets et réservations associés à cette compagnie.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDeleteCompany}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-red-700 transition-colors"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Success/Alert Message Modal */}
      {alertContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              {alertContent.type === 'error' ? (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              
              <h3 className="text-xl font-black text-gray-900 mb-2">{alertContent.title}</h3>
              <div className="text-sm text-gray-500 font-medium">
                {alertContent.message}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setAlertContent(null)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
