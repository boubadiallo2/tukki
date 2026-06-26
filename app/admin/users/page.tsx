"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  Building2, 
  UserCircle,
  Loader2,
  MoreVertical
} from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL, client, company_admin, super_admin

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = profiles;

    if (roleFilter !== "ALL") {
      result = result.filter(p => p.role === roleFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.full_name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.companies?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredProfiles(result);
  }, [searchQuery, roleFilter, profiles]);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch profiles and join with companies table to get company name if applicable
    const { data } = await supabase
      .from('profiles')
      .select('*, companies(name, color, owner_name)')
      .order('created_at', { ascending: false });

    setProfiles(data || []);
    setLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ["Nom Complet", "Email", "Rôle", "Compagnie", "Date d'inscription"];
    
    const rows = filteredProfiles.map(p => {
      const displayName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.full_name || p.companies?.owner_name || 'Sans nom';
      const roleName = p.role === 'super_admin' ? 'Super Admin' : 
                       p.role === 'company' ? 'Partenaire' : 
                       p.role === 'company_agent' ? 'Agent' : 'Client';
      return [
        `"${displayName}"`,
        p.email,
        roleName,
        `"${p.companies?.name || '-'}"`,
        new Date(p.created_at).toLocaleDateString('fr-FR')
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Utilisateurs_Tukki_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3 h-3 mr-1" /> Super Admin
          </span>
        );
      case 'company':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30">
            <Building2 className="w-3 h-3 mr-1" /> Partenaire
          </span>
        );
      case 'company_agent':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-emerald-50 text-brand-green border border-emerald-200">
            <Users className="w-3 h-3 mr-1" /> Agent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-blue-50 text-blue-600 border border-blue-200">
            <UserCircle className="w-3 h-3 mr-1" /> Client
          </span>
        );
    }
  };

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState("company");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      setIsRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification du rôle.");
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression de l'utilisateur.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Gérez tous les comptes inscrits sur la plateforme TUKKI.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            disabled={loading || filteredProfiles.length === 0}
            className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {[
            { id: "ALL", label: "Tous" },
            { id: "client", label: "Clients" },
            { id: "company", label: "Partenaires" },
            { id: "company_agent", label: "Agents" },
            { id: "super_admin", label: "Super Admins" }
          ].map(role => (
            <button
              key={role.id}
              onClick={() => setRoleFilter(role.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
                roleFilter === role.id 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher (nom, email, compagnie)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 font-medium"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Utilisateur</th>
                <th className="p-4">Rôle</th>
                <th className="p-4">Compagnie Associée</th>
                <th className="p-4">Date d'inscription</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow mx-auto" />
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                    Aucun utilisateur trouvé pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors relative">
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          <Users className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">
                            {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.full_name || profile.companies?.owner_name || 'Sans nom'}
                          </p>
                          <p className="text-xs font-medium text-slate-500">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getRoleBadge(profile.role)}
                    </td>
                    <td className="p-4">
                      {profile.companies ? (
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                            style={{ backgroundColor: profile.companies.color || '#059669' }}
                          >
                            <Building2 className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">
                            {profile.companies.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-slate-700">
                        {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="p-4 text-center relative">
                      <button 
                        onClick={() => {
                          const dropdown = document.getElementById(`dropdown-${profile.id}`);
                          if (dropdown) {
                            dropdown.classList.toggle('hidden');
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            const dropdown = document.getElementById(`dropdown-${profile.id}`);
                            if (dropdown) dropdown.classList.add('hidden');
                          }, 200);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div 
                        id={`dropdown-${profile.id}`} 
                        className="hidden absolute right-8 top-10 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden"
                      >
                        <div className="py-1 flex flex-col items-start">
                          <button 
                            onMouseDown={() => {
                              setSelectedUser(profile);
                              setNewRole(profile.role);
                              setIsRoleModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-yellow font-medium transition-colors"
                          >
                            Modifier le rôle
                          </button>
                          <div className="w-full h-px bg-slate-100 my-1"></div>
                          <button 
                            onMouseDown={() => {
                              setSelectedUser(profile);
                              setIsDeleteModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                          >
                            Supprimer l'accès
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Modifier le rôle</h2>
            <p className="text-slate-500 font-medium mb-6 text-sm leading-relaxed">
              Choisissez le nouveau rôle pour <span className="text-slate-900 font-bold">{selectedUser.email}</span>.
            </p>
            
            <div className="space-y-4 mb-8">
              <label className="flex items-center p-4 border border-slate-200 rounded-2xl cursor-pointer hover:border-brand-yellow hover:bg-brand-yellow/5 transition-colors">
                <input type="radio" name="role" value="super_admin" checked={newRole === 'super_admin'} onChange={(e) => setNewRole(e.target.value)} className="w-4 h-4 text-brand-yellow focus:ring-brand-yellow border-slate-300" />
                <span className="ml-3 font-bold text-slate-900">Super Admin</span>
              </label>
              <label className="flex items-center p-4 border border-slate-200 rounded-2xl cursor-pointer hover:border-brand-yellow hover:bg-brand-yellow/5 transition-colors">
                <input type="radio" name="role" value="company" checked={newRole === 'company'} onChange={(e) => setNewRole(e.target.value)} className="w-4 h-4 text-brand-yellow focus:ring-brand-yellow border-slate-300" />
                <span className="ml-3 font-bold text-slate-900">Partenaire</span>
              </label>
              <label className="flex items-center p-4 border border-slate-200 rounded-2xl cursor-pointer hover:border-brand-yellow hover:bg-brand-yellow/5 transition-colors">
                <input type="radio" name="role" value="client" checked={newRole === 'client'} onChange={(e) => setNewRole(e.target.value)} className="w-4 h-4 text-brand-yellow focus:ring-brand-yellow border-slate-300" />
                <span className="ml-3 font-bold text-slate-900">Client</span>
              </label>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsRoleModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleUpdateRole}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-900 bg-brand-yellow hover:bg-[#F2B000] shadow-sm transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black text-red-600 mb-2 tracking-tight">Supprimer l'utilisateur</h2>
            <p className="text-slate-500 font-medium mb-6 text-sm leading-relaxed">
              Êtes-vous sûr de vouloir supprimer l'accès pour <span className="text-slate-900 font-bold">{selectedUser.email}</span> ? Cette action désactivera son profil.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteUser}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
