/* AUTH INIT: iniciando */
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { usuarios } from "@/data/mockData";
import { getMockUsuarios } from "@/data/storage";

export type UserRole = "admin_plataforma" | "admin_lab" | "professor";

export interface Profile {
  id: string;
  full_name: string;
  escola_id: string | null;
  role: UserRole;
  status: "ativo" | "pendente" | "bloqueado";
  disciplinas?: string[];
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  selectedEscolaId: string | null;
  loading: boolean;
  profileLoading: boolean; // Novo: separa loading de profile
  login: (email: string, senha: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setSelectedEscolaId: (id: string) => void;
  updateProfile: (updatedProfile: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { useRef } from "react";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedEscolaId, setSelectedEscolaIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const setSelectedEscolaId = (id: string) => {
    setSelectedEscolaIdState(id);
    localStorage.setItem("agenda_selected_escola_id", id);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const savedUser = localStorage.getItem("agenda_mock_user");
      const savedProfile = localStorage.getItem("agenda_mock_profile");
      
      if (savedUser && savedProfile) {
        setUser(JSON.parse(savedUser));
        setProfile(JSON.parse(savedProfile));
        
        const savedEscolaId = localStorage.getItem("agenda_selected_escola_id");
        if (savedEscolaId) setSelectedEscolaIdState(savedEscolaId);
      }
      
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AUTH] getSession result:", session ? "Session found" : "No session");
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        console.log("[AUTH] no session, showing login");
        setUser(null);
        setProfile(null);
        setLoading(false);
        setProfileLoading(false);
      }
    }).catch(err => {
      console.error("[AUTH] Supabase session error:", err);
      setLoading(false);
      setProfileLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AUTH] onAuthStateChange event:", event, session ? "Session found" : "No session");
      
      if (session?.user) {
        // Evitar loop: só buscar se o usuário mudou ou se é um evento explícito de login
        if (lastFetchedUserIdRef.current !== session.user.id || event === 'SIGNED_IN') {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } else {
        lastFetchedUserIdRef.current = null;
        setUser(null);
        setProfile(null);
        setSelectedEscolaIdState(null);
        setLoading(false);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      console.log("[AUTH] Iniciando fetchProfile para ID:", userId);

      // First try real profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[AUTH] Erro ao buscar perfil no Supabase:", error.message, "Código:", error.code);
        
        // APENAS se o Supabase real NÃO estiver configurado, verificamos mock
        if (!isSupabaseConfigured) {
          console.log("[AUTH] Supabase não configurado, tentando fallback mock...");
          const savedProfile = localStorage.getItem("agenda_mock_profile");
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            if (parsed.id === userId) {
              console.log("[AUTH] Perfil mock encontrado:", parsed.full_name);
              setProfile(parsed);
              const savedEscolaId = localStorage.getItem("agenda_selected_escola_id");
              setSelectedEscolaIdState(savedEscolaId || parsed.escola_id);
              return;
            }
          }
        }
        
        console.warn("[AUTH] Perfil não encontrado no banco ou mock.");
        setProfile(null);
        // Não lançamos erro aqui para não quebrar o fluxo do finally
      }

      if (data) {
        console.log("[AUTH] Perfil encontrado no banco:", data.nome, "Status:", data.status, "Papel:", data.papel);
        
        // Map real profile to App's Profile interface
        const mappedProfile: Profile = {
          id: data.id,
          full_name: data.nome,
          escola_id: data.escola_id,
          role: data.papel as UserRole,
          status: data.status as "ativo" | "pendente" | "bloqueado",
          disciplinas: data.disciplinas
        };

        setProfile(mappedProfile);
        
        const savedEscolaId = localStorage.getItem("agenda_selected_escola_id");
        setSelectedEscolaIdState(savedEscolaId || data.escola_id);
      } else if (!isSupabaseConfigured) {
        // Já tratado no erro, mas por segurança
      } else {
        console.warn("[AUTH] Perfil retornado como null/undefined");
        setProfile(null);
      }
    } catch (error) {
      console.error("[AUTH] Exceção crítica no fetchProfile:", error);
      setProfile(null);
    } finally {
      console.log("[AUTH] Finalizando loadings...");
      setProfileLoading(false);
      setLoading(false);
    }
  };

  const login = async (email: string, senha: string, remember: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = senha.trim();
      
      const mockUsuarios = getMockUsuarios();
      console.log("AuthContext: Tentando login com", normalizedEmail, "Total usuários no storage:", mockUsuarios.length);
      const foundUser = mockUsuarios.find(
        (u) => u.email.trim().toLowerCase() === normalizedEmail
      );
      
      if (!foundUser || foundUser.senha.trim() !== normalizedPassword) {
        return { success: false, error: "E-mail ou senha incorretos." };
      }

      if (foundUser.status === "pendente") {
        return { success: false, error: "Seu acesso ainda está aguardando aprovação." };
      }

      if (foundUser.status === "bloqueado") {
        return { success: false, error: "Seu acesso está bloqueado." };
      }

      const safeUser = {
        id: foundUser.id,
        nome: foundUser.nome,
        email: foundUser.email,
        escola_id: foundUser.escola_id,
        papel: foundUser.papel,
        status: foundUser.status,
        disciplinas: foundUser.disciplinas || []
      };

      // Mock objects for state
      const mockUser: User = {
        id: safeUser.id,
        email: safeUser.email,
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {},
        user_metadata: { full_name: safeUser.nome },
        created_at: new Date().toISOString()
      } as User;

      const mockProfile: Profile = {
        id: safeUser.id,
        full_name: safeUser.nome,
        escola_id: safeUser.escola_id,
        role: safeUser.papel as UserRole,
        status: safeUser.status as "ativo" | "pendente" | "bloqueado",
        disciplinas: safeUser.disciplinas
      };

      setUser(mockUser);
      setProfile(mockProfile);
      
      // Determine currentSchoolId logic
      let currentSchoolId = safeUser.escola_id;
      if (safeUser.papel === "admin_plataforma") {
        currentSchoolId = localStorage.getItem("agenda_selected_escola_id") || "escola-1";
      }
      setSelectedEscolaIdState(currentSchoolId);

      localStorage.setItem("agenda_mock_user", JSON.stringify(mockUser));
      localStorage.setItem("agenda_mock_profile", JSON.stringify(mockProfile));
      localStorage.setItem("agenda_selected_escola_id", currentSchoolId);
      
      if (remember) {
        localStorage.setItem("agenda_remembered_email", normalizedEmail);
        localStorage.setItem("agenda_remembered_password", normalizedPassword);
      } else {
        localStorage.removeItem("agenda_remembered_email");
        localStorage.removeItem("agenda_remembered_password");
      }

      return { success: true };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Fetch the profile immediately to check status before allowing navigation
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Erro ao buscar perfil após login:", profileError);
        // We let it pass if it's just a profile fetch error, the onAuthStateChange will handle it
      } else if (profileData) {
        if (profileData.status === "pendente") {
          await supabase.auth.signOut();
          return { success: false, error: "Seu acesso ainda está aguardando aprovação." };
        }
        if (profileData.status === "bloqueado") {
          await supabase.auth.signOut();
          return { success: false, error: "Seu acesso está bloqueado." };
        }
      }
    }

    return { success: true };
  };

  const logout = async () => {
    console.log("[AUTH] Iniciando logout seguro...");
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("[AUTH] Erro ao deslogar do Supabase:", err);
    }
    
    // Limpar estados locais
    setUser(null);
    setProfile(null);
    setSelectedEscolaIdState(null);
    setLoading(false);
    setProfileLoading(false);
    
    // Limpar apenas chaves de sessão específicas do Supabase no localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase.auth.token"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Limpar dados de sessão mock se existirem
    localStorage.removeItem("agenda_mock_user");
    localStorage.removeItem("agenda_mock_profile");
    
    console.log("[AUTH] Logout concluído.");
  };

  const updateProfile = (updatedProfile: Partial<Profile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updatedProfile };
    setProfile(newProfile);
    localStorage.setItem("agenda_mock_profile", JSON.stringify(newProfile));
  };

  return (
    <AuthContext.Provider value={{ user, profile, selectedEscolaId, loading, profileLoading, login, logout, setSelectedEscolaId, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
