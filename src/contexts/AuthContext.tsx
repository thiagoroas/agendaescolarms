import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { usuarios } from "@/data/mockData";

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
  login: (email: string, senha: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setSelectedEscolaId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedEscolaId, setSelectedEscolaIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error("Supabase session error:", err);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setSelectedEscolaIdState(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setProfile(data);
      
      const savedEscolaId = localStorage.getItem("agenda_selected_escola_id");
      setSelectedEscolaIdState(savedEscolaId || data.escola_id);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, senha: string, remember: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      const foundUser = usuarios.find(u => u.email === email && u.senha === senha);
      
      if (foundUser) {
        const mockUser: User = {
          id: foundUser.id,
          email: foundUser.email,
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: { full_name: foundUser.nome },
          created_at: new Date().toISOString()
        } as User;

        const mockProfile: Profile = {
          id: foundUser.id,
          full_name: foundUser.nome,
          escola_id: foundUser.escola_id,
          role: foundUser.papel as UserRole,
          status: foundUser.status as "ativo" | "pendente" | "bloqueado",
          disciplinas: foundUser.disciplinas
        };

        setUser(mockUser);
        setProfile(mockProfile);
        setSelectedEscolaIdState(foundUser.escola_id);
        
        if (remember) {
          localStorage.setItem("agenda_mock_user", JSON.stringify(mockUser));
          localStorage.setItem("agenda_mock_profile", JSON.stringify(mockProfile));
          localStorage.setItem("agenda_selected_escola_id", foundUser.escola_id);
        }
        
        return { success: true };
      }
      
      return { success: false, error: "E-mail ou senha incorretos (Modo Protótipo)" };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Profile will be fetched by the onAuthStateChange listener
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    
    setUser(null);
    setProfile(null);
    setSelectedEscolaIdState(null);
    
    localStorage.removeItem("agenda_mock_user");
    localStorage.removeItem("agenda_mock_profile");
    localStorage.removeItem("agenda_selected_escola_id");
  };

  return (
    <AuthContext.Provider value={{ user, profile, selectedEscolaId, loading, login, logout, setSelectedEscolaId }}>
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
