import React, { createContext, useContext, useState, useEffect } from "react";
import { Usuario, usuarios } from "../data/mockData";

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("agenda_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
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
    localStorage.setItem("agenda_user", JSON.stringify(userData));

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
    localStorage.removeItem("agenda_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
