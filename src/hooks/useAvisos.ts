import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured, isValidUUID } from "@/lib/supabase";
import { AvisoLaboratorio } from "@/data/mockData";
import { getMockAvisos, createMockAviso, updateMockAviso, deleteMockAviso } from "@/data/storage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useAvisos = (escolaId?: string) => {
  const { profile, selectedEscolaId, loading: authLoading } = useAuth();
  const [avisos, setAvisos] = useState<AvisoLaboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetEscolaId = escolaId || selectedEscolaId || profile?.escola_id;

  const fetchAvisos = async () => {
    // Só busca se auth finalizou e temos uma escola definida
    if (authLoading) return;

    if (!targetEscolaId || (isSupabaseConfigured && !isValidUUID(targetEscolaId))) {
      console.log("[AVISOS] EscolaId inválido ou ausente, ignorando fetch:", targetEscolaId);
      setAvisos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (isSupabaseConfigured) {
      try {
        console.log("[AVISOS] escolaId usado:", targetEscolaId);
        const { data, error: supabaseError } = await supabase
          .from("avisos_laboratorio")
          .select("*")
          .eq("escola_id", targetEscolaId)
          .order("created_at", { ascending: false });

        if (supabaseError) throw supabaseError;

        setAvisos(data as AvisoLaboratorio[]);
      } catch (err: any) {
        console.error("[AVISOS] Error fetching avisos:", err.message, err);
        setError(err.message);
        
        // Evitar múltiplos toasts usando um ID fixo
        toast.error("Erro ao carregar avisos", {
          id: "erro-carregar-avisos"
        });
      } finally {
        setLoading(false);
      }
    } else {
      const allMock = getMockAvisos();
      setAvisos(allMock.filter(a => a.escola_id === targetEscolaId));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvisos();
  }, [targetEscolaId, authLoading]);

  const createAviso = async (data: Omit<AvisoLaboratorio, "id" | "criado_em">) => {
    if (isSupabaseConfigured) {
      try {
        const { data: createdData, error: supabaseError } = await supabase
          .from("avisos_laboratorio")
          .insert([data])
          .select()
          .single();

        if (supabaseError) throw supabaseError;

        setAvisos(prev => [createdData as AvisoLaboratorio, ...prev]);
        toast.success("Aviso criado com sucesso!");
        return createdData as AvisoLaboratorio;
      } catch (err: any) {
        console.error("Error creating aviso:", err.message);
        toast.error("Erro ao criar aviso");
        return null;
      }
    } else {
      const newAviso = createMockAviso(data);
      setAvisos(prev => [newAviso, ...prev]);
      toast.success("Aviso criado com sucesso!");
      return newAviso;
    }
  };

  const updateAviso = async (id: string, updates: Partial<AvisoLaboratorio>) => {
    if (isSupabaseConfigured) {
      try {
        const { error: supabaseError } = await supabase
          .from("avisos_laboratorio")
          .update(updates)
          .eq("id", id);

        if (supabaseError) throw supabaseError;

        setAvisos(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        toast.success("Aviso atualizado com sucesso!");
        return true;
      } catch (err: any) {
        console.error("Error updating aviso:", err.message);
        toast.error("Erro ao atualizar aviso");
        return false;
      }
    } else {
      updateMockAviso(id, updates);
      setAvisos(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      toast.success("Aviso atualizado com sucesso!");
      return true;
    }
  };

  const toggleAvisoAtivo = async (id: string, currentAtivo: boolean) => {
    return updateAviso(id, { ativo: !currentAtivo });
  };

  const deleteAviso = async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        const { error: supabaseError } = await supabase
          .from("avisos_laboratorio")
          .delete()
          .eq("id", id);

        if (supabaseError) throw supabaseError;

        setAvisos(prev => prev.filter(a => a.id !== id));
        toast.success("Aviso excluído com sucesso!");
        return true;
      } catch (err: any) {
        console.error("Error deleting aviso:", err.message);
        toast.error("Erro ao excluir aviso");
        return false;
      }
    } else {
      deleteMockAviso(id);
      setAvisos(prev => prev.filter(a => a.id !== id));
      toast.success("Aviso excluído com sucesso!");
      return true;
    }
  };

  return {
    avisos,
    loading,
    error,
    refresh: fetchAvisos,
    createAviso,
    updateAviso,
    toggleAvisoAtivo,
    deleteAviso
  };
};
