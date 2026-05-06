import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type StatusType = "ok" | "attention" | "error" | "loading" | "unknown";

export interface ServiceStatus {
  name: string;
  status: StatusType;
  message: string;
  lastCheck: Date;
  details?: any;
}

export const useSaudeSistema = () => {
  const { user, profile } = useAuth();
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [services, setServices] = useState<Record<string, ServiceStatus>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState<Array<{ time: Date; service: string; status: StatusType; message: string }>>([]);

  const addEvent = (service: string, status: StatusType, message: string) => {
    setEvents(prev => [{ time: new Date(), service, status, message }, ...prev].slice(0, 50));
  };

  const checkSupabase = async () => {
    const start = Date.now();
    try {
      if (!isSupabaseConfigured) {
        return { status: "attention" as StatusType, message: "Modo Demonstração (Mock)" };
      }
      const { data, error } = await supabase.from("escolas").select("id").limit(1);
      if (error) throw error;
      return { status: "ok" as StatusType, message: "Conexão ativa com banco de dados." };
    } catch (err: any) {
      return { status: "error" as StatusType, message: `Erro de conexão: ${err.message}` };
    }
  };

  const checkTable = async (tableName: string, label: string) => {
    try {
      if (!isSupabaseConfigured) return { status: "ok" as StatusType, message: "Dados mockados disponíveis." };
      const { data, error, count } = await supabase.from(tableName).select("id", { count: 'exact' }).limit(1);
      if (error) {
        if (error.code === "42P17") return { status: "error" as StatusType, message: "Erro 42P17: Possível recursão RLS." };
        if (error.code === "42501") return { status: "error" as StatusType, message: "Erro 42501: Permissão negada via RLS." };
        return { status: "error" as StatusType, message: `Erro ${error.code}: ${error.message}` };
      }
      return { status: "ok" as StatusType, message: `Consulta funcionando. Registros: ${count || 0}` };
    } catch (err: any) {
      return { status: "error" as StatusType, message: `Falha técnica: ${err.message}` };
    }
  };

  const checkAuth = () => {
    if (!user) return { status: "error" as StatusType, message: "Sessão não encontrada." };
    if (!profile) return { status: "error" as StatusType, message: "Perfil não encontrado." };
    if (profile.role !== "admin_plataforma") return { status: "error" as StatusType, message: "Permissão insuficiente." };
    return { status: "ok" as StatusType, message: `Logado como ${profile.role} (${user.email})` };
  };

  const checkFunctions = async () => {
    if (!isSupabaseConfigured) return { status: "ok" as StatusType, message: "Mock: Funções disponíveis." };
    try {
      const { data, error } = await supabase.rpc('has_school_link');
      // Não tratamos erro de "function not found" como crítico aqui, apenas informativo
      if (error) {
         return { status: "attention" as StatusType, message: `RPC has_school_link indisponível ou erro: ${error.message}` };
      }
      return { status: "ok" as StatusType, message: "Funções RPC base detectadas." };
    } catch (err: any) {
      return { status: "attention" as StatusType, message: `Erro ao testar RPC: ${err.message}` };
    }
  };

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    const results: Record<string, ServiceStatus> = {};
    const now = new Date();

    const updateService = (id: string, name: string, res: { status: StatusType; message: string }) => {
      results[id] = { name, ...res, lastCheck: now };
      addEvent(name, res.status, res.message);
    };

    // Run checks
    updateService("supabase", "Supabase / Banco", await checkSupabase());
    updateService("auth", "Autenticação & Sessão", checkAuth());
    updateService("profiles", "Tabela: profiles", await checkTable("profiles", "Perfis"));
    updateService("escolas", "Tabela: escolas", await checkTable("escolas", "Escolas"));
    updateService("profile_escolas", "Tabela: profile_escolas", await checkTable("profile_escolas", "Vínculos"));
    updateService("reservas", "Tabela: reservas", await checkTable("reservas", "Reservas"));
    updateService("recursos", "Tabela: recursos", await checkTable("recursos", "Recursos"));
    updateService("horarios_escola", "Tabela: horarios_escola", await checkTable("horarios_escola", "Horários"));
    updateService("avisos_laboratorio", "Tabela: avisos_laboratorio", await checkTable("avisos_laboratorio", "Avisos"));
    updateService("rpc", "Funções RPC / Sistema", await checkFunctions());

    setServices(results);
    setLastCheck(now);
    setIsRefreshing(false);
  }, [user, profile]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const getGeneralStatus = (): StatusType => {
    const values = Object.values(services);
    if (values.length === 0) return "loading";
    if (values.some(s => s.status === "error")) return "error";
    if (values.some(s => s.status === "attention")) return "attention";
    return "ok";
  };

  return {
    services,
    lastCheck,
    isRefreshing,
    refreshAll,
    generalStatus: getGeneralStatus(),
    events
  };
};
