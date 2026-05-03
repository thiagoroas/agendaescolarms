import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
  loadSessionAndProfile: (silent?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEscolaId, setSelectedEscolaIdState] = useState<string | null>(null);
  
  const isLoadingProfileRef = useRef(false);

  const setSelectedEscolaId = (id: string) => {
    setSelectedEscolaIdState(id);
    localStorage.setItem("agenda_selected_escola_id", id);
  };

  const loadSessionAndProfile = async (silent = false) => {
    if (isLoadingProfileRef.current) return;
    isLoadingProfileRef.current = true;
    
    if (!silent) {
      setLoading(true);
    }
    
    console.log("[AUTH] loadSessionAndProfile start (silent:", silent, ")");
    
    try {
      console.log("[AUTH] getSession start");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("[AUTH] getSession result", session ? "session found" : "no session");

      if (sessionError) throw sessionError;

      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setError(null);
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      console.log("[AUTH] fetch profile start id:", currentUser.id);
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      console.log("[AUTH] fetch profile result", data ? "profile found" : "profile not found");

      if (profileError) {
        console.error("[AUTH] erro ao buscar profile", profileError);
        setError(profileError.message);
        setProfile(null);
      } else if (!data) {
        console.warn("[AUTH] profile não encontrado para", currentUser.email);
        setError("profile_not_found");
        setProfile(null);
      } else {
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
      }
    } catch (err) {
      console.error("[AUTH] loadSessionAndProfile error", err);
      setError("Erro ao carregar sessão");
    } finally {
      isLoadingProfileRef.current = false;
      setLoading(false);
      console.log("[AUTH] loading finalized");
    }
  };

  useEffect(() => {
    console.log("[AUTH] app start");
    
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    loadSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AUTH] event:", event);
      
      if (event === "SIGNED_IN" && session?.user) {
        loadSessionAndProfile();
      } else if (event === "TOKEN_REFRESHED") {
        console.log("[AUTH] token refreshed");
        if (session?.user) setUser(session.user);
      } else if (event === "SIGNED_OUT") {
        console.log("[AUTH] signed out");
        setUser(null);
        setProfile(null);
        setError(null);
        setLoading(false);
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[AUTH] visibility visible");
        // Se já temos usuário e profile, fazemos um refresh silencioso
        if (user && profile) {
          loadSessionAndProfile(true);
        } else {
          // Se não temos, carregamos normalmente (com loading se necessário)
          loadSessionAndProfile();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
      return { success: true };
    }

    return { success: false, error: "Falha ao obter usuário após login" };
  };

  const logout = async () => {
    setLoading(true);
    console.log("[AUTH] iniciando logout completo");
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (err) {
      console.error("[AUTH] logout error", err);
    }

    setUser(null);
    setProfile(null);
    setError(null);
    
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
      updateProfile,
      loadSessionAndProfile
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
