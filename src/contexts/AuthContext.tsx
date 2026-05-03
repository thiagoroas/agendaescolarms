import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured, isValidUUID } from "@/lib/supabase";
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

  const legacyCleanedRef = useRef(false);

  // Limpa localStorage de IDs legados se estiver no modo Supabase
  useEffect(() => {
    if (isSupabaseConfigured && !legacyCleanedRef.current) {
      console.log("[LOOP DEBUG] limpar legacy storage");
      const keysToClean = [
        "agenda_selected_escola_id",
        "agenda_active_school",
        "selectedEscolaId",
        "currentSchoolId"
      ];
      
      keysToClean.forEach(key => {
        const val = localStorage.getItem(key);
        if (val && !isValidUUID(val)) {
          console.log(`[AUTH] Limpando ID legado "${val}" da chave "${key}"`);
          localStorage.removeItem(key);
        }
      });
      legacyCleanedRef.current = true;
    }
  }, []);

  const setSelectedEscolaId = (id: string) => {
    if (isSupabaseConfigured && !isValidUUID(id)) {
      console.warn("[AUTH] Ignorando tentativa de salvar escolaId inválido no modo Supabase:", id);
      return;
    }
    
    if (selectedEscolaId !== id) {
      console.log("[LOOP DEBUG] selectedEscolaId mudou:", id);
      setSelectedEscolaIdState(id);
      localStorage.setItem("agenda_selected_escola_id", id);
    }
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
        isLoadingProfileRef.current = false;
        setLoading(false);
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
        
        // Valida se o ID salvo é compatível com o modo atual
        const savedEscolaId = localStorage.getItem("agenda_selected_escola_id");
        if (isSupabaseConfigured && savedEscolaId && !isValidUUID(savedEscolaId)) {
          if (selectedEscolaId !== data.escola_id) {
            setSelectedEscolaIdState(data.escola_id);
          }
          localStorage.removeItem("agenda_selected_escola_id");
        } else if (savedEscolaId && selectedEscolaId !== savedEscolaId) {
          setSelectedEscolaIdState(savedEscolaId);
        } else if (!savedEscolaId && data.escola_id && selectedEscolaId !== data.escola_id) {
          setSelectedEscolaIdState(data.escola_id);
        }
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

    const revalidateSession = async () => {
      // Se já temos usuário e profile, fazemos um refresh silencioso
      if (user && profile) {
        console.log("[AUTH] revalidating session (silent)");
        await loadSessionAndProfile(true);
      } else {
        // Se não temos, carregamos normalmente
        console.log("[AUTH] revalidating session (normal)");
        await loadSessionAndProfile();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[AUTH] visibility visible - Chrome mobile trigger");
        // Se já temos usuário e profile ativo e escola selecionada, não revalidamos para evitar loop
        if (user && profile && isValidUUID(selectedEscolaId)) {
          console.log("[AUTH] app já ativo e saudável, ignorando visibility revalidation");
          return;
        }
        revalidateSession();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      console.log("[AUTH] pageshow event", { persisted: event.persisted });
      if (event.persisted) {
        console.log("[AUTH] page restored from bfcache - revalidating session");
        // Mesma lógica de proteção
        if (user && profile && isValidUUID(selectedEscolaId)) {
          return;
        }
        revalidateSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [user, profile]);

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
