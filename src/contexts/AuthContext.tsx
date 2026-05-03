import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

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
  loading: boolean;
  error: string | null;
  selectedEscolaId: string | null;
  login: (email: string, senha: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setSelectedEscolaId: (id: string) => void;
  updateProfile: (updatedProfile: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEscolaId, setSelectedEscolaIdState] = useState<string | null>(null);

  const setSelectedEscolaId = (id: string) => {
    setSelectedEscolaIdState(id);
    localStorage.setItem("agenda_selected_escola_id", id);
  };

  const loadProfile = async (u: User) => {
    console.log("[AUTH] fetching profile id:", u.id);
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .maybeSingle();

      if (profileError) {
        console.error("[AUTH] erro ao buscar profile", profileError);
        setError(profileError.message);
        setProfile(null);
        return null;
      }

      if (!data) {
        console.warn("[AUTH] profile não encontrado para", u.email);
        setError("profile_not_found");
        setProfile(null);
        return null;
      }

      console.log("[AUTH] profile found:", data.nome);
      const mappedProfile: Profile = {
        id: data.id,
        full_name: data.nome,
        escola_id: data.escola_id,
        role: data.papel as UserRole,
        status: data.status as "ativo" | "pendente" | "bloqueado",
        disciplinas: data.disciplinas
      };
      
      setProfile(mappedProfile);
      setError(null);
      
      const savedEscolaId = localStorage.getItem("agenda_selected_escola_id");
      setSelectedEscolaIdState(savedEscolaId || data.escola_id);
      return mappedProfile;
    } catch (e) {
      console.error("[AUTH] exception in loadProfile", e);
      setError("Exceção ao carregar perfil");
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    async function initAuth() {
      console.log("[AUTH] init start");
      setLoading(true);

      // Timeout de segurança para não travar o app em loading
      const timeoutId = setTimeout(() => {
        console.warn("[AUTH] init timeout reached, forcing loading false");
        setLoading(false);
      }, 8000);

      if (!isSupabaseConfigured) {
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.log("[AUTH] no session");
          setUser(null);
          setProfile(null);
        } else {
          console.log("[AUTH] session found:", session.user.email);
          setUser(session.user);
          await loadProfile(session.user);
        }
      } catch (err) {
        console.error("[AUTH] init error", err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AUTH] event:", event);
      
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        setLoading(true);
        await loadProfile(session.user);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        console.log("[AUTH] signed out");
        setUser(null);
        setProfile(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, senha: string, remember: boolean): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (loginError) {
      return { success: false, error: loginError.message };
    }

    if (data.user) {
      // O profile será carregado pelo onAuthStateChange (SIGNED_IN)
      return { success: true };
    }

    return { success: false, error: "Falha ao obter usuário após login" };
  };

  const logout = async () => {
    setLoading(true);
    console.log("[AUTH] iniciando logout completo");
    try {
      // Sign out global para invalidar todas as sessões
      await supabase.auth.signOut({ scope: "global" });
    } catch (err) {
      console.error("[AUTH] logout error", err);
    }

    // Limpar estados locais
    setUser(null);
    setProfile(null);
    setError(null);
    
    // Limpar storage de forma agressiva
    Object.keys(localStorage)
      .filter(k => k.startsWith("sb-"))
      .forEach(k => localStorage.removeItem(k));
      
    sessionStorage.clear();
    
    console.log("[AUTH] logout finalizado, redirecionando");
    setLoading(false);
    window.location.href = "/login";
  };

  const updateProfile = (updatedProfile: Partial<Profile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updatedProfile });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      error, 
      selectedEscolaId, 
      login, 
      logout, 
      setSelectedEscolaId, 
      updateProfile 
    }}>
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
