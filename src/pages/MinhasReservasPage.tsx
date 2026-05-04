import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useReservas } from "@/hooks/useReservas";
import { useRecursos } from "@/hooks/useRecursos";
import { Reserva, Recurso } from "../data/mockData";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isAfter, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmCancelModal } from "@/components/reservas/ConfirmCancelModal";

const MinhasReservasPage = () => {
  const { user, profile, selectedEscolaId } = useAuth();
  const { reservas, cancelReserva } = useReservas();
  const { recursos } = useRecursos();
  const [reservaParaCancelar, setReservaParaCancelar] = useState<Reserva | null>(null);
  const [cancelando, setCancelando] = useState(false);


  const currentEscolaId = selectedEscolaId || profile?.escola_id;

  const userReservas = useMemo(() => {
    let filtered;
    if (profile?.role === 'admin_lab' || profile?.role === 'admin_plataforma') {
      filtered = reservas.filter(r => 
        r.escola_id === currentEscolaId && 
        !['manutencao', 'bloqueada'].includes(r.status)
      );
    } else {
      filtered = reservas.filter(r => 
        r.profile_id === user?.id && 
        !['manutencao', 'bloqueada'].includes(r.status)
      );
    }

    // Agrupa para exibição
    const grouped: Record<string, Reserva & { recursosList: string[] }> = {};
    filtered.forEach(res => {
      const key = `${res.data}-${res.aula}-${res.profile_id}-${res.turma}-${res.disciplina}`;
      const recurso = recursos.find(r => r.id === res.recurso_id);
      const recursoNome = recurso?.nome || 'N/A';

      if (grouped[key]) {
        grouped[key].recursosList.push(recursoNome);
      } else {
        grouped[key] = {
          ...res,
          recursosList: [recursoNome]
        };
      }
    });

    return Object.values(grouped);
  }, [reservas, user?.id, profile?.role, currentEscolaId, recursos]);

  const today = startOfDay(new Date());
  
  const upcoming = useMemo(() => userReservas
    .filter(r => r.status !== 'cancelada' && !isAfter(today, startOfDay(parseISO(r.data))))
    .sort((a, b) => a.data.localeCompare(b.data) || a.aula - b.aula), [userReservas, today]);
    
  const past = useMemo(() => userReservas
    .filter(r => r.status !== 'cancelada' && isAfter(today, startOfDay(parseISO(r.data))))
    .sort((a, b) => b.data.localeCompare(a.data)), [userReservas, today]);

  const canceled = useMemo(() => userReservas
    .filter(r => r.status === 'cancelada')
    .sort((a, b) => b.data.localeCompare(a.data)), [userReservas]);

  const ReservaCard = ({ r }: { r: Reserva }) => {
    const recNames = (r as any).recursosList || [];
    const isCanceled = r.status === 'cancelada';
    
    return (
      <Card key={r.id} className={cn(
        "border-slate-200 shadow-sm overflow-hidden transition-all",
        isCanceled ? "opacity-75 grayscale-[0.5] border-red-100 bg-red-50/10" : "hover:border-blue-200"
      )}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className={cn("font-bold text-slate-900", isCanceled && "text-slate-500")}>{r.disciplina}</h3>
              <p className="text-sm text-slate-500">{r.turma}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap justify-end gap-1">
                {recNames.map((name: string, i: number) => (
                  <Badge key={i} variant="outline" className={cn(isCanceled ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                    {name}
                  </Badge>
                ))}
              </div>
              {r.status && (
                <Badge variant={
                  r.status === "confirmada" || r.status === "aprovada" ? "default" : 
                  (r.status === "manutencao" || r.status === "bloqueada") ? "secondary" : 
                  r.status === "pendente" ? "outline" : "destructive"
                } className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  r.status === "pendente" && "bg-amber-50 text-amber-700 border-amber-200",
                  (r.status === "manutencao" || r.status === "bloqueada") && "bg-slate-100 text-slate-700 border-slate-300",
                  r.status === "cancelada" && "bg-red-100 text-red-700 border-red-200"
                )}>
                  {r.status === "confirmada" ? "Confirmada" : 
                   r.status === "aprovada" ? "Aprovada" :
                   r.status === "cancelada" ? "Cancelada" :
                   r.status === "bloqueada" ? "Bloqueada" :
                   r.status === "pendente" ? "Pendente" : r.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(r.data + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{r.horario} (Aula {r.aula})</span>
            </div>
          </div>

          {!isCanceled && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700" 
                onClick={() => setReservaParaCancelar(r)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Cancelar reserva
              </Button>
            </div>
          )}
          
          {isCanceled && (
            <div className="mt-4 pt-4 border-t flex justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reserva Cancelada</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {profile?.role === 'professor' ? 'Minhas Reservas' : 'Gerenciar Reservas'}
        </h1>
        <p className="text-sm text-slate-500">
          {profile?.role === 'professor' ? 'Visualize e gerencie seus agendamentos.' : 'Todas as reservas da escola.'}
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-slate-100 p-1 w-full sm:w-auto">
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">Próximas</TabsTrigger>
          <TabsTrigger value="past" className="flex-1 sm:flex-none">Passadas</TabsTrigger>
          <TabsTrigger value="canceled" className="flex-1 sm:flex-none">Canceladas</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-6">
          {upcoming.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map(r => <ReservaCard key={r.id} r={r} />)}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-slate-400">Nenhuma reserva futura encontrada.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-6">
          {past.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map(r => <ReservaCard key={r.id} r={r} />)}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-slate-400">Nenhuma reserva passada encontrada.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="canceled" className="mt-6">
          {canceled.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {canceled.map(r => <ReservaCard key={r.id} r={r} />)}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-slate-400">Nenhuma reserva cancelada encontrada.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmCancelModal
        isOpen={!!reservaParaCancelar}
        onClose={() => setReservaParaCancelar(null)}
        loading={cancelando}
        onConfirm={async (motivo) => {
          if (reservaParaCancelar) {
            setCancelando(true);
            try {
              // Verifica se existem outras reservas do mesmo professor, mesma data e mesma aula
              const reservasRelacionadas = userReservas.filter(r => 
                r.profile_id === reservaParaCancelar.profile_id &&
                r.data === reservaParaCancelar.data &&
                r.aula === reservaParaCancelar.aula &&
                r.status !== 'cancelada' &&
                r.id !== reservaParaCancelar.id
              );

              if (reservasRelacionadas.length > 0) {
                const confirmAll = window.confirm(
                  `Esta reserva possui outros recursos no mesmo horário. Deseja cancelar TODOS os recursos deste agendamento?\n\nClique em 'OK' para cancelar tudo ou 'Cancelar' para cancelar apenas este recurso.`
                );

                if (confirmAll) {
                  await Promise.all([
                    cancelReserva(reservaParaCancelar.id, motivo),
                    ...reservasRelacionadas.map(r => cancelReserva(r.id, motivo))
                  ]);
                } else {
                  await cancelReserva(reservaParaCancelar.id, motivo);
                }
              } else {
                await cancelReserva(reservaParaCancelar.id, motivo);
              }
            } finally {
              setCancelando(false);
              setReservaParaCancelar(null);
            }
          }
        }}
      />
    </div>
  );
};

export default MinhasReservasPage;
