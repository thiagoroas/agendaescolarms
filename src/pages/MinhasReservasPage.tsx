import { useState, useEffect } from "react";
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

const MinhasReservasPage = () => {
  const { user, profile } = useAuth();
  const { reservas, cancelReserva } = useReservas();
  const { recursos } = useRecursos();


  const userReservas = reservas
    .filter(r => r.professor_id === user?.id || (profile?.role !== 'professor' && r.escola_id === profile?.escola_id))
    .sort((a, b) => b.data.localeCompare(a.data));

  const today = startOfDay(new Date());
  const upcoming = userReservas.filter(r => !isAfter(today, startOfDay(parseISO(r.data))));
  const past = userReservas.filter(r => isAfter(today, startOfDay(parseISO(r.data))));

  const ReservaCard = ({ r }: { r: Reserva }) => {
    const rec = recursos.find(rec => rec.id === r.recurso_id);
    return (
      <Card key={r.id} className="border-slate-200 shadow-sm overflow-hidden hover:border-blue-200 transition-colors">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-slate-900">{r.disciplina}</h3>
              <p className="text-sm text-slate-500">{r.turma}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge 
                style={{ backgroundColor: rec?.cor_fundo, color: rec?.cor_texto, borderColor: rec?.cor_borda }}
                variant="outline"
              >
                {rec?.nome}
              </Badge>
              {r.status && (
                <Badge variant={
                  r.status === "confirmada" || r.status === "aprovada" ? "default" : 
                  (r.status === "manutencao" || r.status === "bloqueada") ? "secondary" : 
                  r.status === "pendente" ? "outline" : "destructive"
                } className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  r.status === "pendente" && "bg-amber-50 text-amber-700 border-amber-200",
                  (r.status === "manutencao" || r.status === "bloqueada") && "bg-slate-100 text-slate-700 border-slate-300"
                )}>
                  {r.status}
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

          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Funcionalidade de edição em breve.")}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700" 
              onClick={async () => {
                if (window.confirm("Deseja realmente cancelar esta reserva?")) {
                  await cancelReserva(r.id);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map(r => <ReservaCard key={r.id} r={r} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MinhasReservasPage;
