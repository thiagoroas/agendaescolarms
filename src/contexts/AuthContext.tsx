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
  login: (email: string, senha: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setSelectedEscolaId: (id: string) => void;
  updateProfile: (updatedProfile: Partial<Profile>) => void;
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
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = senha.trim();
      
      console.log("LOGIN_DEBUG: Intentando login", normalizedEmail, normalizedPassword);
      
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
    
    // Clear all session storage
    localStorage.removeItem("agenda_mock_user");
    localStorage.removeItem("agenda_mock_profile");
    localStorage.removeItem("agenda_selected_escola_id");
    localStorage.removeItem("agenda_remembered_email");
    localStorage.removeItem("agenda_remembered_password");
    
    // Also clear any other related session items but NOT the mock database
    const sessionKeys = [
      "agenda_mock_user",
      "agenda_mock_profile",
      "agenda_selected_escola_id",
      "agenda_remembered_email",
      "agenda_remembered_password"
    ];
    
    sessionKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear Supabase keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-")) {
        localStorage.removeItem(key);
      }
    }
  };

  const updateProfile = (updatedProfile: Partial<Profile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updatedProfile };
    setProfile(newProfile);
    localStorage.setItem("agenda_mock_profile", JSON.stringify(newProfile));
  };

  return (
    <AuthContext.Provider value={{ user, profile, selectedEscolaId, loading, login, logout, setSelectedEscolaId, updateProfile }}>
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
