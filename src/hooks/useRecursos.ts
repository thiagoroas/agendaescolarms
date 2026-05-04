import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured, isValidUUID } from "@/lib/supabase";
import { Recurso } from "@/data/mockData";
import { getMockRecursos, saveMockRecursos, getMockReservas } from "@/data/storage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useRecursos = (escolaId?: string) => {
  const { profile, selectedEscolaId, loading: authLoading } = useAuth();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the provided escolaId or fallback to the context's selectedEscolaId or profile's escola_id
  const targetEscolaId = escolaId || selectedEscolaId || profile?.escola_id;

  const fetchRecursos = async () => {
    // Só busca se auth finalizou e temos uma escola definida
    if (authLoading) return;

    if (!targetEscolaId || (isSupabaseConfigured && !isValidUUID(targetEscolaId))) {
      console.log("[RECURSOS] EscolaId inválido ou ausente, ignorando fetch:", targetEscolaId);
      setRecursos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("[LOOP DEBUG] fetch recursos para escola:", targetEscolaId);
    if (isSupabaseConfigured) {
      try {
        console.log("[RECURSOS] escolaId usado:", targetEscolaId);
        let query = supabase
          .from("recursos")
          .select("*")
          .eq("escola_id", targetEscolaId)
          .order("nome");

        // Se for professor, mostrar apenas ativos
        if (profile?.role === "professor") {
          query = query.eq("ativo", true);
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) throw supabaseError;

        const mappedRecursos: Recurso[] = (data || []).map((r: any) => ({
          id: r.id,
          escola_id: r.escola_id,
          nome: r.nome,
          tipo: r.tipo,
          cor_fundo: r.cor_fundo,
          cor_texto: r.cor_texto,
          cor_borda: r.cor_borda,
          ativo: r.ativo,
        }));

        setRecursos(mappedRecursos);
      } catch (err: any) {
        console.error("[RECURSOS] Error fetching resources:", err.message, err);
        setError(err.message);
        
        toast.error("Erro ao carregar recursos", {
          id: "erro-carregar-recursos"
        });
      } finally {
        setLoading(false);
      }
    } else {
      let allMock = getMockRecursos();
      let filtered = allMock.filter((r) => r.escola_id === targetEscolaId);
      
      if (profile?.role === "professor") {
        filtered = filtered.filter(r => r.ativo);
      }
      
      setRecursos(filtered);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecursos();
  }, [targetEscolaId, profile?.role, authLoading]);

  const createRecurso = async (data: Omit<Recurso, "id">) => {
    if (isSupabaseConfigured) {
      try {
        const { data: createdData, error: supabaseError } = await supabase
          .from("recursos")
          .insert([{
            escola_id: data.escola_id,
            nome: data.nome,
            tipo: data.tipo,
            cor_fundo: data.cor_fundo,
            cor_texto: data.cor_texto,
            cor_borda: data.cor_borda,
            ativo: data.ativo ?? true
          }])
          .select()
          .single();

        if (supabaseError) throw supabaseError;

        const created: Recurso = {
          id: createdData.id,
          escola_id: createdData.escola_id,
          nome: createdData.nome,
          tipo: createdData.tipo,
          cor_fundo: createdData.cor_fundo,
          cor_texto: createdData.cor_texto,
          cor_borda: createdData.cor_borda,
          ativo: createdData.ativo
        };

        setRecursos(prev => [...prev, created]);
        toast.success("Recurso cadastrado com sucesso!");
        return created;
      } catch (err: any) {
        console.error("Error creating resource:", err.message);
        toast.error("Erro ao cadastrar recurso");
        return null;
      }
    } else {
      const created: Recurso = {
        ...data,
        id: "rec-" + Date.now(),
        ativo: data.ativo ?? true
      };
      setRecursos(prev => {
        const allMock = getMockRecursos();
        const updated = [...allMock, created];
        saveMockRecursos(updated);
        // Only return filtered ones for the current school
        return [...prev, created];
      });
      toast.success("Recurso cadastrado com sucesso!");
      return created;
    }
  };

  const updateRecurso = async (id: string, updates: Partial<Recurso>) => {
    if (isSupabaseConfigured) {
      try {
        const { error: supabaseError } = await supabase
          .from("recursos")
          .update(updates)
          .eq("id", id);

        if (supabaseError) throw supabaseError;

        setRecursos(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
        toast.success("Recurso atualizado com sucesso!");
        return true;
      } catch (err: any) {
        console.error("Error updating resource:", err.message);
        toast.error("Erro ao atualizar recurso");
        return false;
      }
    } else {
      const allMock = getMockRecursos();
      const updatedMock = allMock.map(r => r.id === id ? { ...r, ...updates } : r);
      saveMockRecursos(updatedMock);
      
      setRecursos(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast.success("Recurso atualizado com sucesso!");
      return true;
    }
  };

  const toggleRecursoAtivo = async (id: string, currentAtivo: boolean) => {
    return updateRecurso(id, { ativo: !currentAtivo });
  };

  const getRecursoStats = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error: supabaseError } = await supabase
          .from("reservas")
          .select("status, data_reserva")
          .eq("recurso_id", id);

        if (supabaseError) throw supabaseError;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const stats = {
          confirmada: 0,
          cancelada: 0,
          manutencao: 0,
          passadas: 0,
          futuras: 0,
          total: data?.length || 0
        };

        data?.forEach((res: any) => {
          if (res.status === "confirmada") stats.confirmada++;
          if (res.status === "cancelada") stats.cancelada++;
          if (res.status === "manutencao" || res.status === "bloqueio") stats.manutencao++;

          const resDate = new Date(res.data_reserva);
          resDate.setHours(0, 0, 0, 0);

          if (resDate < now) {
            stats.passadas++;
          } else {
            stats.futuras++;
          }
        });

        return stats;
      } catch (err) {
        console.error("Error fetching resource stats:", err);
        return null;
      }
    } else {
      const allMockReservas = getMockReservas();
      const resourceReservations = allMockReservas.filter(res => res.recurso_id === id);
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const stats = {
        confirmada: 0,
        cancelada: 0,
        manutencao: 0,
        passadas: 0,
        futuras: 0,
        total: resourceReservations.length
      };

      resourceReservations.forEach((res: any) => {
        if (res.status === "confirmada") stats.confirmada++;
        if (res.status === "cancelada") stats.cancelada++;
        
        const resDate = new Date(res.data_reserva);
        resDate.setHours(0, 0, 0, 0);

        if (resDate < now) {
          stats.passadas++;
        } else {
          stats.futuras++;
        }
      });

      return stats;
    }
  };

  const deleteRecurso = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        const stats = await getRecursoStats(id);
        
        if (stats && stats.total > 0) {
          // A verificação detalhada agora é feita na UI via getRecursoStats
          // Mas por segurança no hook bloqueamos se houver qualquer reserva
          // A menos que a UI passe um flag de "force" (que não vamos implementar agora por segurança)
          toast.error("Este recurso possui histórico de reservas e não pode ser excluído definitivamente.");
          return false;
        }

        const { error: supabaseError } = await supabase
          .from("recursos")
          .delete()
          .eq("id", id);

        if (supabaseError) throw supabaseError;

        setRecursos(prev => prev.filter(r => r.id !== id));
        toast.success("Recurso excluído com sucesso!");
        return true;
      } catch (err: any) {
        console.error("Error deleting resource:", err.message);
        toast.error("Erro ao excluir recurso");
        return false;
      }
    } else {
      const stats = await getRecursoStats(id);
      if (stats && stats.total > 0) {
        toast.error("Este recurso possui histórico no protótipo. Inative em vez de excluir.");
        return false;
      }

      setRecursos(prev => {
        const allMock = getMockRecursos();
        const updatedMock = allMock.filter(r => r.id !== id);
        saveMockRecursos(updatedMock);
        return prev.filter(r => r.id !== id);
      });
      toast.success("Recurso excluído com sucesso!");
      return true;
    }
  };

  return {
    recursos,
    loading,
    error,
    refresh: fetchRecursos,
    createRecurso,
    updateRecurso,
    toggleRecursoAtivo,
    getRecursoStats,
    deleteRecurso
  };
};
