import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured, isValidUUID } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface HorarioEscola {
  id: string;
  escola_id: string;
  nome: string;
  turno: "manha" | "tarde" | "noite" | "integral";
  ordem: number;
  hora_inicio: string;
  hora_fim: string;
  tipo: "aula" | "intervalo";
  ativo: boolean;
}

export const useHorarios = (escolaId?: string) => {
  const { profile, selectedEscolaId, loading: authLoading } = useAuth();
  const [horarios, setHorarios] = useState<HorarioEscola[]>([]);
  const [loading, setLoading] = useState(true);

  const targetEscolaId = escolaId || selectedEscolaId || profile?.escola_id;

  const fetchHorarios = async () => {
    if (authLoading) return;

    if (isSupabaseConfigured) {
      if (!targetEscolaId || !isValidUUID(targetEscolaId)) {
        setHorarios([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("horarios_escola")
          .select("*")
          .eq("escola_id", targetEscolaId)
          .order("ordem", { ascending: true });

        if (error) throw error;
        setHorarios(data as HorarioEscola[]);
      } catch (err: any) {
        console.error("Erro ao buscar horários:", err.message);
        toast.error("Erro ao carregar horários da escola");
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback para horários fixos no modo protótipo
      const fallbackHorarios: HorarioEscola[] = [
        { id: "h1", escola_id: "demo", nome: "1ª Aula", turno: "manha", ordem: 1, hora_inicio: "07:30", hora_fim: "08:20", tipo: "aula", ativo: true },
        { id: "h2", escola_id: "demo", nome: "2ª Aula", turno: "manha", ordem: 2, hora_inicio: "08:20", hora_fim: "09:10", tipo: "aula", ativo: true },
        { id: "h3", escola_id: "demo", nome: "Intervalo", turno: "manha", ordem: 3, hora_inicio: "09:10", hora_fim: "09:30", tipo: "intervalo", ativo: true },
        { id: "h4", escola_id: "demo", nome: "3ª Aula", turno: "manha", ordem: 4, hora_inicio: "09:30", hora_fim: "10:20", tipo: "aula", ativo: true },
        { id: "h5", escola_id: "demo", nome: "4ª Aula", turno: "manha", ordem: 5, hora_inicio: "10:20", hora_fim: "11:10", tipo: "aula", ativo: true },
        { id: "h6", escola_id: "demo", nome: "5ª Aula", turno: "tarde", ordem: 6, hora_inicio: "13:00", hora_fim: "13:50", tipo: "aula", ativo: true },
        { id: "h7", escola_id: "demo", nome: "6ª Aula", turno: "tarde", ordem: 7, hora_inicio: "13:50", hora_fim: "14:40", tipo: "aula", ativo: true },
        { id: "h8", escola_id: "demo", nome: "Intervalo", turno: "tarde", ordem: 8, hora_inicio: "14:40", hora_fim: "15:00", tipo: "intervalo", ativo: true },
        { id: "h9", escola_id: "demo", nome: "7ª Aula", turno: "tarde", ordem: 9, hora_inicio: "15:00", hora_fim: "15:50", tipo: "aula", ativo: true },
        { id: "h10", escola_id: "demo", nome: "8ª Aula", turno: "tarde", ordem: 10, hora_inicio: "15:50", hora_fim: "16:40", tipo: "aula", ativo: true },
      ];
      setHorarios(fallbackHorarios);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorarios();
  }, [targetEscolaId, authLoading]);

  const upsertHorario = async (horario: Partial<HorarioEscola>) => {
    if (!isSupabaseConfigured) {
      toast.info("Apenas disponível no modo Supabase");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("horarios_escola")
        .upsert({ ...horario, escola_id: targetEscolaId })
        .select()
        .single();

      if (error) throw error;
      fetchHorarios();
      toast.success("Horário salvo com sucesso!");
      return data;
    } catch (err: any) {
      console.error("Erro ao salvar horário:", err.message);
      toast.error("Erro ao salvar horário");
      return null;
    }
  };

  const deleteHorario = async (id: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from("horarios_escola")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setHorarios(prev => prev.filter(h => h.id !== id));
      toast.success("Horário removido com sucesso!");
      return true;
    } catch (err: any) {
      console.error("Erro ao remover horário:", err.message);
      toast.error("Erro ao remover horário");
      return false;
    }
  };

  return {
    horarios,
    loading,
    refresh: fetchHorarios,
    upsertHorario,
    deleteHorario
  };
};
