import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Reserva } from "@/data/mockData";
import { getMockReservas, saveMockReservas } from "@/data/storage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useReservas = (escolaId?: string) => {
  const { profile, selectedEscolaId } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetEscolaId = escolaId || selectedEscolaId || profile?.escola_id;

  const fetchReservas = async () => {
    if (!targetEscolaId) {
      setReservas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (isSupabaseConfigured) {
      try {
        const { data, error: supabaseError } = await supabase
          .from("reservas")
          .select("*")
          .eq("escola_id", targetEscolaId);

        if (supabaseError) throw supabaseError;

        setReservas(data as Reserva[]);
      } catch (err: any) {
        console.error("Error fetching reservas:", err.message);
        setError(err.message);
        toast.error("Erro ao carregar reservas");
      } finally {
        setLoading(false);
      }
    } else {
      const allMock = getMockReservas();
      setReservas(allMock.filter(r => r.escola_id === targetEscolaId));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, [targetEscolaId]);

  const createReserva = async (data: Omit<Reserva, "id" | "criado_em">) => {
    if (isSupabaseConfigured) {
      try {
        const { data: createdData, error: supabaseError } = await supabase
          .from("reservas")
          .insert([data])
          .select()
          .single();

        if (supabaseError) {
          if (supabaseError.code === "23505") { // Unique constraint violation
             toast.error("Este recurso já está reservado neste dia e aula.");
          } else {
             throw supabaseError;
          }
          return null;
        }

        setReservas(prev => [...prev, createdData as Reserva]);
        toast.success("Reserva realizada com sucesso!");
        return createdData as Reserva;
      } catch (err: any) {
        console.error("Error creating reserva:", err.message);
        toast.error("Erro ao criar reserva");
        return null;
      }
    } else {
      const allMock = getMockReservas();
      const newReserva: Reserva = {
        ...data,
        id: `res-${Date.now()}`,
        criado_em: new Date().toISOString()
      };
      const updated = [...allMock, newReserva];
      saveMockReservas(updated);
      setReservas(prev => [...prev, newReserva]);
      toast.success("Reserva realizada com sucesso!");
      return newReserva;
    }
  };

  const cancelReserva = async (id: string, motivo?: string) => {
    if (isSupabaseConfigured) {
      try {
        const { error: supabaseError } = await supabase
          .from("reservas")
          .update({ status: "cancelada", motivo_cancelamento: motivo })
          .eq("id", id);

        if (supabaseError) throw supabaseError;

        setReservas(prev => prev.map(r => r.id === id ? { ...r, status: "cancelada" as const, motivo_cancelamento: motivo } : r));
        toast.success("Reserva cancelada com sucesso!");
        return true;
      } catch (err: any) {
        console.error("Error canceling reserva:", err.message);
        toast.error("Erro ao cancelar reserva");
        return false;
      }
    } else {
      const allMock = getMockReservas();
      const updated = allMock.map(r => r.id === id ? { ...r, status: "cancelada" as const, motivo_cancelamento: motivo } : r);
      saveMockReservas(updated);
      setReservas(prev => prev.map(r => r.id === id ? { ...r, status: "cancelada" as const, motivo_cancelamento: motivo } : r));
      toast.success("Reserva cancelada com sucesso!");
      return true;
    }
  };

  return {
    reservas,
    loading,
    error,
    refresh: fetchReservas,
    createReserva,
    cancelReserva
  };
};
