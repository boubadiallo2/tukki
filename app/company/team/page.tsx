"use client";

import { useState, useEffect } from "react";
import { Users, Plus, X, Loader2, AlertTriangle, Check, ShieldCheck, Mail, Phone } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

const AVAILABLE_MODULES = [
  "Tableau de bord",
  "Trajets",
  "Réservations",
  "Vente au guichet",
  "Paramètres"
];

export default function CompanyTeamPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertContent, setAlertContent] = useState<{title: string, message: React.ReactNode, type?: 'success' | 'error'} | null>(null);

  // Form states
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newModules, setNewModules] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchTeam = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', session.user.id)
      .single();

    if (profile?.company_id) {
      setCompanyId(profile.company_id);
      
      // Fetch only company_agents for this company
      const { data: teamMembers } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('role', 'company_agent')
        .order('created_at', { ascending: false });
        
      if (teamMembers) {
        setAgents(teamMembers);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const resetForm = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPassword("");
    setNewPhone("");
    setNewModules([]);
    setErrorMsg("");
  };

  const toggleModule = (mod: string) => {
    if (newModules.includes(mod)) {
      setNewModules(newModules.filter(m => m !== mod));
    } else {
      setNewModules([...newModules, mod]);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    if (newModules.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins un module autorisé.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Create Auth User via API
      const response = await fetch('/api/create-employee-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword
        })
      });

      const authResult = await response.json();
      
      if (!response.ok) {
        if (authResult.error && authResult.error.toLowerCase().includes("already registered")) {
          throw new Error("Cette adresse email existe déjà. Veuillez utiliser un autre email.");
        }
        throw new Error(authResult.error || "Erreur lors de la création du compte agent");
      }

      // 2. Assign role and info via RPC function
      const { error: rpcError } = await supabase.rpc('assign_company_agent_role', {
        new_user_id: authResult.userId,
        target_company_id: companyId,
        agent_first_name: newFirstName,
        agent_last_name: newLastName,
        agent_phone: newPhone,
        agent_modules: newModules
      });

      if (rpcError) {
        throw new Error("Erreur lors de l'attribution des droits: " + rpcError.message);
      }

      setIsModalOpen(false);
      resetForm();
      fetchTeam(); // Refresh list

      // Custom Success Modal
      setAlertContent({
        type: 'success',
        title: "Agent ajouté avec succès ! 🎉",
        message: (
          <div className="space-y-3 mt-4 text-left">
            <p className="text-gray-600 text-sm">Le compte de votre agent a été créé avec succès. Il peut maintenant se connecter avec son email et le mot de passe que vous avez défini.</p>
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mon Équipe</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérez les accès de vos agents de guichet.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-brand-green text-white hover:bg-brand-green-dark px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un agent</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-bold mb-1">Rôles et Permissions</p>
          <p className="opacity-90">Vous pouvez maintenant définir précisément quels modules sont accessibles pour chaque agent. Un agent ne verra que les menus que vous lui avez autorisés.</p>
        </div>
      </div>

      {/* Agents List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Employé</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Modules Autorisés</th>
                <th className="p-4 text-right pr-6">Date d'ajout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-green" />
                    Chargement de l'équipe...
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">
                    Vous n'avez pas encore ajouté d'agent.
                  </td>
                </tr>
              ) : agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                        <Users className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">
                          {agent.first_name} {agent.last_name}
                        </p>
                        <p className="text-xs text-brand-green font-bold bg-brand-green/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          Agent
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      {agent.email}
                    </div>
                    {agent.phone && (
                      <div className="flex items-center font-medium">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {agent.phone}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {agent.allowed_modules && agent.allowed_modules.length > 0 ? (
                        agent.allowed_modules.map((mod: string) => (
                          <span key={mod} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            {mod}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-red-500 font-medium italic">Aucun module</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6 text-sm text-gray-500 font-medium">
                    {new Date(agent.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout d'agent */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="text-xl font-black text-gray-900">Nouvel Agent</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-1 border border-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddAgent} className="p-6 space-y-5">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl border border-red-100 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Prénom</label>
                  <input 
                    type="text" required 
                    value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                    placeholder="Ex: Amadou"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">Nom</label>
                  <input 
                    type="text" required 
                    value={newLastName} onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                    placeholder="Ex: Diallo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Email de l'agent</label>
                <input 
                  type="email" required 
                  value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                  placeholder="Ex: agent@compagnie.sn"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Numéro de téléphone</label>
                <input 
                  type="tel" required 
                  value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                  placeholder="Ex: +221 77 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Mot de passe</label>
                <input 
                  type="text" required minLength={6}
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                  placeholder="Créez un mot de passe (min. 6 caractères)"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Modules Autorisés</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  {AVAILABLE_MODULES.map((mod) => (
                    <label key={mod} className="flex items-center space-x-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        newModules.includes(mod) 
                          ? 'bg-brand-green border-brand-green text-white' 
                          : 'bg-white border-gray-300 group-hover:border-brand-green'
                      }`}>
                        {newModules.includes(mod) && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={newModules.includes(mod)}
                        onChange={() => toggleModule(mod)}
                      />
                      <span className="text-sm font-medium text-gray-700 select-none group-hover:text-gray-900">{mod}</span>
                    </label>
                  ))}
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
                  <span>Créer l'agent</span>
                </button>
              </div>
            </form>
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
