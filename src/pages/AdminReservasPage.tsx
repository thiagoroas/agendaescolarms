import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEscolas } from "@/hooks/useEscolas";
import { useReservas } from "@/hooks/useReservas";
import { useRecursos } from "@/hooks/useRecursos";
import { Reserva, Recurso, Escola } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Search, Filter, Trash2, Edit, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isValidUUID, isSupabaseConfigured } from "@/lib/supabase";
import { ConfirmCancelModal } from "@/components/reservas/ConfirmCancelModal";

const AdminReservasPage = () => {
  const { profile, selectedEscolaId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { escolas, loading: loadingEscolas } = useEscolas();
  const [searchTerm, setSearchTerm] = useState("");
  const initialStatus = searchParams.get("status") || "todas";
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const { reservas, cancelReserva } = useReservas();
  const [reservaParaCancelar, setReservaParaCancelar] = useState<Reserva | null>(null);
  const [cancelando, setCancelando] = useState(false);

  // Update URL when filter changes
  useEffect(() => {
    const currentStatus = searchParams.get("status");
    if (statusFilter !== "todas") {
      if (currentStatus !== statusFilter) {
        setSearchParams({ status: statusFilter });
      }
    } else {
      if (currentStatus) {
        setSearchParams({});
      }
    }
  }, [statusFilter, setSearchParams, searchParams]);
  const { recursos } = useRecursos();


  const currentEscolaId = selectedEscolaId || profile?.escola_id;

  const schoolReservas = useMemo(() => {
    if (isSupabaseConfigured && !isValidUUID(currentEscolaId)) {
      return [];
    }
    
    return reservas
      .filter(r => r.escola_id === currentEscolaId)
      .filter(r => {
        if (statusFilter === "todas") return true;
        if (statusFilter === "confirmadas") return r.status === "confirmada" || r.status === "aprovada" || r.status === "pendente";
        if (statusFilter === "manutencao") return r.status === "manutencao" || r.status === "bloqueada";
        if (statusFilter === "canceladas") return r.status === "cancelada";
        return true;
      })
      .filter(r => 
        r.nome_professor.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.disciplina.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.turma.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.data.localeCompare(a.data) || a.aula - b.aula);
  }, [reservas, currentEscolaId, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Todas as Reservas</h1>
          <p className="text-sm text-slate-500">Histórico completo de agendamentos da escola.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const escolaNome = escolas.find(e => e.id === (selectedEscolaId || profile?.escola_id))?.nome;
            toast.success(`Gerando relatório PDF para ${escolaNome}...`);
            setTimeout(() => window.print(), 500);
          }}>
            Gerar PDF
          </Button>
          <Button variant="outline" onClick={() => toast.info("Exportando...")}>
            Exportar CSV
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={statusFilter === "todas" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("todas")}
            className="rounded-full px-4 h-9 font-bold uppercase tracking-widest text-[10px]"
          >
            Todas
          </Button>
          <Button 
            variant={statusFilter === "confirmadas" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("confirmadas")}
            className="rounded-full px-4 h-9 font-bold uppercase tracking-widest text-[10px]"
          >
            Confirmadas
          </Button>
          <Button 
            variant={statusFilter === "manutencao" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("manutencao")}
            className="rounded-full px-4 h-9 font-bold uppercase tracking-widest text-[10px]"
          >
            Manutenção/Bloqueios
          </Button>
          <Button 
            variant={statusFilter === "canceladas" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("canceladas")}
            className="rounded-full px-4 h-9 font-bold uppercase tracking-widest text-[10px]"
          >
            Canceladas
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              className="pl-10" 
              placeholder="Filtrar por professor, disciplina ou turma..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Mais Filtros
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden hidden xl:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Data</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead>Disciplina / Turma</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schoolReservas.map((r) => {
              const rec = recursos.find(rec => rec.id === r.recurso_id);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-slate-900">
                    {format(new Date(r.data + 'T12:00:00'), "dd/MM/yy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-slate-700">{r.nome_professor}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{r.disciplina}</span>
                      <span className="text-xs text-slate-500">{r.turma}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge 
                        style={{ backgroundColor: rec?.cor_fundo, color: rec?.cor_texto, borderColor: rec?.cor_borda }}
                        variant="outline"
                        className="text-[10px] w-fit"
                      >
                        {rec?.nome}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase tracking-widest w-fit border-none shadow-sm",
                        (r.status === "confirmada" || r.status === "aprovada") ? "bg-green-100 text-green-700 ring-1 ring-green-200" :
                        r.status === "pendente" ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" :
                        r.status === "cancelada" ? "bg-red-100 text-red-700 ring-1 ring-red-200" :
                        (r.status === "manutencao" || r.status === "bloqueada") ? "bg-slate-800 text-slate-100 ring-1 ring-slate-900" :
                        "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                      )}>
                        {r.status === "manutencao" ? "Manutenção" : 
                         r.status === "confirmada" ? "Confirmada" :
                         r.status === "aprovada" ? "Aprovada" :
                         r.status === "cancelada" ? "Cancelada" :
                         r.status === "bloqueada" ? "Bloqueada" :
                         r.status === "pendente" ? "Pendente" : r.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs">
                    {r.horario} (Aula {r.aula})
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {r.status !== "cancelada" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" 
                          onClick={() => setReservaParaCancelar(r)}
                          title="Cancelar reserva"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 xl:hidden pb-20">
        {schoolReservas.map((r) => {
          const rec = recursos.find(rec => rec.id === r.recurso_id);
          return (
            <div key={r.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{r.nome_professor}</h3>
                  <p className="text-xs text-slate-500">{r.disciplina} • {r.turma}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{format(new Date(r.data + 'T12:00:00'), "dd/MM/yy")}</p>
                  <p className="text-[10px] text-slate-400">Aula {r.aula}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  style={{ backgroundColor: rec?.cor_fundo, color: rec?.cor_texto, borderColor: rec?.cor_borda }}
                  variant="outline"
                  className="text-[10px]"
                >
                  {rec?.nome}
                </Badge>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                {r.status !== "cancelada" ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-red-600 border-red-100" 
                    onClick={() => setReservaParaCancelar(r)}
                  >
                    Cancelar reserva
                  </Button>
                ) : (
                  <div className="flex-1 text-center py-1">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 uppercase tracking-widest text-[9px] font-black">
                      Cancelada
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmCancelModal
        isOpen={!!reservaParaCancelar}
        onClose={() => setReservaParaCancelar(null)}
        loading={cancelando}
        onConfirm={async (motivo) => {
          if (reservaParaCancelar) {
            setCancelando(true);
            try {
              await cancelReserva(reservaParaCancelar.id, motivo);
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

export default AdminReservasPage;
