import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured, isValidUUID } from "@/lib/supabase";
import { Reserva } from "@/data/mockData";
import { getMockReservas, saveMockReservas } from "@/data/storage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useReservas = (escolaId?: string) => {
  const { profile, selectedEscolaId, loading: authLoading } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetEscolaId = escolaId || selectedEscolaId || profile?.escola_id;

  const fetchReservas = async () => {
    // Só busca se auth finalizou e temos uma escola definida
    if (authLoading) return;

    if (!targetEscolaId || (isSupabaseConfigured && !isValidUUID(targetEscolaId))) {
      console.log("[RESERVAS] EscolaId inválido ou ausente, ignorando fetch:", targetEscolaId);
      setReservas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("[LOOP DEBUG] fetch reservas para escola:", targetEscolaId);
    if (isSupabaseConfigured) {
      try {
        console.log("[RESERVAS] escolaId usado:", targetEscolaId);
        const { data, error: supabaseError } = await supabase
          .from("reservas")
          .select("*")
          .eq("escola_id", targetEscolaId);

        if (supabaseError) throw supabaseError;

        // Se o Supabase estiver configurado e o join falhou anteriormente,
        // vamos carregar professor e recurso separadamente para cada reserva
        // para garantir que os dados completos apareçam sem quebrar a query principal.
        const reservasBasicas = data as Reserva[];
        
        try {
          // Buscar profiles (professores)
          const profileIds = [...new Set(reservasBasicas.map(r => r.profile_id))].filter(Boolean);
          const recursoIds = [...new Set(reservasBasicas.map(r => r.recurso_id))].filter(Boolean);

          const [profilesRes, recursosRes] = await Promise.all([
            profileIds.length > 0 
              ? supabase.from("profiles").select("id, nome, email").in("id", profileIds)
              : Promise.resolve({ data: [] }),
            recursoIds.length > 0
              ? supabase.from("recursos").select("id, nome, tipo").in("id", recursoIds)
              : Promise.resolve({ data: [] })
          ]);

          const profilesMap = (profilesRes.data || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
          const recursosMap = (recursosRes.data || []).reduce((acc: any, r: any) => ({ ...acc, [r.id]: r }), {});

          const reservasCompletas = reservasBasicas.map(r => ({
            ...r,
            professor: profilesMap[r.profile_id],
            recurso: recursosMap[r.recurso_id]
          }));

          setReservas(reservasCompletas as Reserva[]);
        } catch (enrichError) {
          console.error("[RESERVAS] Erro ao enriquecer dados:", enrichError);
          setReservas(reservasBasicas);
        }
      } catch (err: any) {
        console.error("[RESERVAS] Error fetching reservas:", err.message, err);
        setError(err.message);
        
        toast.error("Erro ao carregar reservas", {
          id: "erro-carregar-reservas"
        });
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
  }, [targetEscolaId, authLoading]);

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
        console.error("Error creating reserva:", err);
        const errorMessage = err.message || "Erro ao criar reserva";
        const errorDetails = err.details ? ` (${err.details})` : "";
        toast.error(`${errorMessage}${errorDetails}`);
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
