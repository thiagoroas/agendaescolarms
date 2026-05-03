import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured, isValidUUID } from "@/lib/supabase";
import { Escola, Recurso } from "@/data/mockData";
import { getMockEscolas, saveMockEscolas, getMockUsuarios, getMockRecursos, saveMockRecursos, getMockReservas, getMockAvisos } from "@/data/storage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const FALLBACK_HORARIOS = [
  { nome: "1ª Aula", turno: "manha", ordem: 1, hora_inicio: "07:30", hora_fim: "08:20", tipo: "aula", ativo: true },
  { nome: "2ª Aula", turno: "manha", ordem: 2, hora_inicio: "08:20", hora_fim: "09:10", tipo: "aula", ativo: true },
  { nome: "Intervalo", turno: "manha", ordem: 3, hora_inicio: "09:10", hora_fim: "09:30", tipo: "intervalo", ativo: true },
  { nome: "3ª Aula", turno: "manha", ordem: 4, hora_inicio: "09:30", hora_fim: "10:20", tipo: "aula", ativo: true },
  { nome: "4ª Aula", turno: "manha", ordem: 5, hora_inicio: "10:20", hora_fim: "11:10", tipo: "aula", ativo: true },
  { nome: "5ª Aula", turno: "tarde", ordem: 6, hora_inicio: "13:00", hora_fim: "13:50", tipo: "aula", ativo: true },
  { nome: "6ª Aula", turno: "tarde", ordem: 7, hora_inicio: "13:50", hora_fim: "14:40", tipo: "aula", ativo: true },
  { nome: "Intervalo", turno: "tarde", ordem: 8, hora_inicio: "14:40", hora_fim: "15:00", tipo: "intervalo", ativo: true },
  { nome: "7ª Aula", turno: "tarde", ordem: 9, hora_inicio: "15:00", hora_fim: "15:50", tipo: "aula", ativo: true },
  { nome: "8ª Aula", turno: "tarde", ordem: 10, hora_inicio: "15:50", hora_fim: "16:40", tipo: "aula", ativo: true },
];

const DEFAULT_RESOURCES = [
  { nome: "Laboratório de Informática", tipo: "laboratorio", cor_fundo: "#DBEAFE", cor_texto: "#1E40AF", cor_borda: "#93C5FD", ativo: true },
  { nome: "Projetor", tipo: "projetor", cor_fundo: "#D1FAE5", cor_texto: "#065F46", cor_borda: "#6EE7B7", ativo: true },
];

export const useEscolas = () => {
  const { profile, selectedEscolaId, setSelectedEscolaId, loading: authLoading } = useAuth();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const autoSelectedSchoolRef = useRef(false);

  const fetchEscolas = async () => {
    if (authLoading) return;
    
    setLoading(true);
    console.log("[LOOP DEBUG] fetch escolas");
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from("escolas").select("*").order("nome");
        
        if (profile && profile.role !== "admin_plataforma" && profile.escola_id) {
          query = query.eq("id", profile.escola_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        const mappedEscolas: Escola[] = (data || []).map((e: any) => ({
          id: e.id,
          nome: e.nome,
          cidade: e.cidade,
          estado: e.estado,
          status: e.status
        }));
        
        setEscolas(mappedEscolas);

        // Auto-seleção de escola real (apenas se ainda não houve auto-seleção nesta sessão)
        if (isSupabaseConfigured && !authLoading && mappedEscolas.length > 0 && !autoSelectedSchoolRef.current) {
          const currentId = selectedEscolaId || profile?.escola_id;
          if (!currentId || !isValidUUID(currentId)) {
            console.log("[LOOP DEBUG] auto select escola:", mappedEscolas[0].id);
            setSelectedEscolaId(mappedEscolas[0].id);
            autoSelectedSchoolRef.current = true;
          }
        }
      } catch (error: any) {
        console.error("Error fetching schools:", error.message);
        toast.error("Erro ao carregar escolas", { id: "erro-carregar-escolas" });
      } finally {
        setLoading(false);
      }
    } else {
      let allMock = getMockEscolas();
      if (profile && profile.role !== "admin_plataforma" && profile.escola_id) {
        allMock = allMock.filter(e => e.id === profile.escola_id);
      }
      setEscolas(allMock);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchEscolas();
    }
  }, [profile?.id, authLoading]);

  const createEscola = async (novaEscola: Omit<Escola, "id" | "status">, createDefaultResources = false) => {
    if (isSupabaseConfigured) {
      try {
        const { data: escolaData, error: escolaError } = await supabase
          .from("escolas")
          .insert([{ 
            nome: novaEscola.nome, 
            cidade: novaEscola.cidade, 
            estado: novaEscola.estado,
            status: 'ativa'
          }])
          .select()
          .single();

        if (escolaError) throw escolaError;
        
        // Criar horários padrão automaticamente
        const horariosToInsert = FALLBACK_HORARIOS.map(h => ({
          ...h,
          escola_id: escolaData.id
        }));
        
        await supabase.from("horarios_escola").insert(horariosToInsert);

        // Criar recursos padrão se solicitado
        if (createDefaultResources) {
          const recursosToInsert = DEFAULT_RESOURCES.map(r => ({
            ...r,
            escola_id: escolaData.id
          }));
          await supabase.from("recursos").insert(recursosToInsert);
        }
        
        const created: Escola = {
          id: escolaData.id,
          nome: escolaData.nome,
          cidade: escolaData.cidade,
          estado: escolaData.estado,
          status: escolaData.status
        };
        
        setEscolas(prev => [created, ...prev]);
        toast.success("Escola e horários padrão criados!");
        return created;
      } catch (error: any) {
        console.error("Error creating school:", error.message);
        toast.error("Erro ao cadastrar escola");
        return null;
      }
    } else {
      const created: Escola = {
        ...novaEscola,
        id: "escola-" + Date.now(),
        status: "ativa"
      };
      
      // No modo mock não persistimos horários por escola facilmente num hook de escola,
      // mas podemos persistir os recursos se solicitado
      if (createDefaultResources) {
        const mockRecursos = getMockRecursos();
        const newResources: Recurso[] = DEFAULT_RESOURCES.map((r, i) => ({
          ...r,
          id: `rec-${Date.now()}-${i}`,
          escola_id: created.id
        }));
        saveMockRecursos([...mockRecursos, ...newResources]);
      }

      setEscolas(prev => {
        const updated = [created, ...prev];
        saveMockEscolas(updated);
        return updated;
      });
      toast.success("Escola cadastrada com sucesso!");
      return created;
    }
  };

  const updateEscola = async (id: string, updates: Partial<Escola>) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("escolas")
          .update(updates)
          .eq("id", id);

        if (error) throw error;
        
        setEscolas(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
        toast.success("Escola atualizada com sucesso!");
        return true;
      } catch (error: any) {
        console.error("Error updating school:", error.message);
        toast.error("Erro ao atualizar escola");
        return false;
      }
    } else {
      setEscolas(prev => {
        const updated = prev.map(e => e.id === id ? { ...e, ...updates } : e);
        saveMockEscolas(updated);
        return updated;
      });
      toast.success("Escola atualizada com sucesso!");
      return true;
    }
  };

  const toggleEscolaStatus = async (id: string, currentStatus: "ativa" | "inativa") => {
    const nextStatus = currentStatus === "ativa" ? "inativa" : "ativa";
    if (nextStatus === "inativa" && selectedEscolaId === id) {
      const remainingEscolas = escolas.filter(e => e.id !== id && e.status === "ativa");
      if (remainingEscolas.length > 0) {
        setSelectedEscolaId(remainingEscolas[0].id);
      } else {
        setSelectedEscolaId(null);
      }
    }
    return updateEscola(id, { status: nextStatus });
  };

  const deleteEscola = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        // Verificar vínculos no Supabase
        const [usersCheck, resourcesCheck, reservationsCheck, announcementsCheck, schedulesCheck] = await Promise.all([
          supabase.from("profiles").select("id", { count: 'exact', head: true }).eq("escola_id", id),
          supabase.from("recursos").select("id", { count: 'exact', head: true }).eq("escola_id", id),
          supabase.from("reservas").select("id", { count: 'exact', head: true }).eq("escola_id", id),
          supabase.from("avisos_laboratorio").select("id", { count: 'exact', head: true }).eq("escola_id", id),
          supabase.from("horarios_escola").select("id", { count: 'exact', head: true }).eq("escola_id", id)
        ]);

        if ((usersCheck.count && usersCheck.count > 0) || 
            (resourcesCheck.count && resourcesCheck.count > 0) || 
            (reservationsCheck.count && reservationsCheck.count > 0) || 
            (announcementsCheck.count && announcementsCheck.count > 0) ||
            (schedulesCheck.count && schedulesCheck.count > 0)) {
          toast.error("Esta escola possui dados vinculados (professores, recursos, reservas, avisos ou horários). Para preservar o histórico, inative a escola em vez de excluir.");
          return false;
        }

        const { error } = await supabase
          .from("escolas")
          .delete()
          .eq("id", id);

        if (error) throw error;
        
        // Se a escola excluída era a escola ativa, trocar para a primeira disponível
        if (selectedEscolaId === id) {
          const remainingEscolas = escolas.filter(e => e.id !== id && e.status === "ativa");
          if (remainingEscolas.length > 0) {
            setSelectedEscolaId(remainingEscolas[0].id);
          }
        }

        setEscolas(prev => prev.filter(e => e.id !== id));
        toast.success("Escola excluída com sucesso.");
        return true;
      } catch (error: any) {
        console.error("Error deleting school:", error.message);
        toast.error("Erro ao excluir escola");
        return false;
      }
    } else {
      // Verificar vínculos no Mock
      const users = getMockUsuarios();
      const resources = getMockRecursos();
      const reservations = getMockReservas();
      const announcements = getMockAvisos();

      const hasLinks = users.some(u => u.escola_id === id) || 
                       resources.some(r => r.escola_id === id) || 
                       reservations.some(res => res.escola_id === id) || 
                       announcements.some(a => a.escola_id === id);

      if (hasLinks) {
        toast.error("Não é possível excluir esta escola porque existem usuários, recursos, reservas ou avisos vinculados. Inative a escola ou remova os vínculos primeiro.");
        return false;
      }

      // Se a escola excluída era a escola ativa, trocar para a primeira disponível
      if (selectedEscolaId === id) {
        const remainingEscolas = escolas.filter(e => e.id !== id && e.status === "ativa");
        if (remainingEscolas.length > 0) {
          setSelectedEscolaId(remainingEscolas[0].id);
        }
      }

      setEscolas(prev => {
        const updated = prev.filter(e => e.id !== id);
        saveMockEscolas(updated);
        return updated;
      });
      toast.success("Escola excluída com sucesso.");
      return true;
    }
  };

  return {
    escolas,
    loading,
    refresh: fetchEscolas,
    createEscola,
    updateEscola,
    toggleEscolaStatus,
    deleteEscola
  };
};
