import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Escola } from "@/data/mockData";
import { getMockEscolas, saveMockEscolas } from "@/data/storage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useEscolas = () => {
  const { profile } = useAuth();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEscolas = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from("escolas").select("*").order("nome");
        
        // Se não for admin plataforma, filtrar pela escola do usuário
        // No entanto, a AdminEscolasPage só é acessível para admin_plataforma
        // Mas o TopHeader usa a lista de escolas.
        // Se for admin_lab ou professor, eles geralmente só precisam ver a própria escola
        // Mas para simplificar, o admin_plataforma vê tudo e os outros vêem apenas a sua
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
      } catch (error: any) {
        console.error("Error fetching schools:", error.message);
        toast.error("Erro ao carregar escolas");
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
    // Only fetch if profile is loaded or if we are in mock mode without profile
    if (profile || !isSupabaseConfigured) {
      fetchEscolas();
    }
  }, [profile]);

  const createEscola = async (novaEscola: Omit<Escola, "id" | "status">) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("escolas")
          .insert([{ 
            nome: novaEscola.nome, 
            cidade: novaEscola.cidade, 
            estado: novaEscola.estado,
            status: 'ativa'
          }])
          .select()
          .single();

        if (error) throw error;
        
        const created: Escola = {
          id: data.id,
          nome: data.nome,
          cidade: data.cidade,
          estado: data.estado,
          status: data.status
        };
        
        setEscolas(prev => [created, ...prev]);
        toast.success("Escola cadastrada com sucesso!");
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
    const newStatus = currentStatus === "ativa" ? "inativa" : "ativa";
    return updateEscola(id, { status: newStatus });
  };

  return {
    escolas,
    loading,
    refresh: fetchEscolas,
    createEscola,
    updateEscola,
    toggleEscolaStatus
  };
};
