import React, { createContext, useContext, useState, useEffect } from "react";
import { Usuario, usuarios } from "../data/mockData";

interface AuthContextType {
  user: Usuario | null;
  selectedEscolaId: string | null;
  loading: boolean;
  login: (email: string, senha: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setSelectedEscolaId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [selectedEscolaId, setSelectedEscolaIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setSelectedEscolaId = (id: string) => {
    setSelectedEscolaIdState(id);
    localStorage.setItem("agenda_selected_escola_id", id);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("agenda_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      const savedEscolaId = localStorage.getItem("agenda_selected_escola_id");
      setSelectedEscolaIdState(savedEscolaId || parsedUser.escola_id);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string, remember: boolean): Promise<{ success: boolean; error?: string }> => {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 800));

    const foundUser = usuarios.find((u) => u.email === email && u.senha === senha);

    if (!foundUser) {
      return { success: false, error: "E-mail ou senha incorretos." };
    }

    if (foundUser.status === "pendente") {
      return { success: false, error: "Seu acesso ainda está aguardando aprovação." };
    }

    if (foundUser.status === "bloqueado") {
      return { success: false, error: "Seu acesso está bloqueado." };
    }

    const { senha: _, ...userData } = foundUser;
    
    setUser(userData);
    setSelectedEscolaIdState(userData.escola_id);
    localStorage.setItem("agenda_user", JSON.stringify(userData));
    localStorage.setItem("agenda_selected_escola_id", userData.escola_id);

    if (remember) {
      localStorage.setItem("agenda_remembered_email", email);
      localStorage.setItem("agenda_remembered_password", senha);
    } else {
      localStorage.removeItem("agenda_remembered_email");
      localStorage.removeItem("agenda_remembered_password");
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setSelectedEscolaIdState(null);
    localStorage.removeItem("agenda_user");
    localStorage.removeItem("agenda_selected_escola_id");
  };

  return (
    <AuthContext.Provider value={{ user, selectedEscolaId, loading, login, logout, setSelectedEscolaId }}>
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
