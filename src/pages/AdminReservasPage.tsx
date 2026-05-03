import { useState, useEffect, useMemo } from "react";
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

const AdminReservasPage = () => {
  const { profile, selectedEscolaId } = useAuth();
  const { escolas, loading: loadingEscolas } = useEscolas();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const { reservas, cancelReserva } = useReservas();
  const { recursos } = useRecursos();


  const currentEscolaId = selectedEscolaId || profile?.escola_id;

  const schoolReservas = useMemo(() => {
    if (isSupabaseConfigured && !isValidUUID(currentEscolaId)) {
      return [];
    }
    
    return reservas
      .filter(r => r.escola_id === currentEscolaId)
      .filter(r => 
        r.nome_professor.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.disciplina.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.turma.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [reservas, currentEscolaId, searchTerm]);

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
          Filtros Avançados
        </Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden hidden md:block">
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
                        "text-[9px] font-black uppercase tracking-widest w-fit",
                        r.status === "aprovada" ? "bg-green-50 text-green-700 border-green-200" :
                        r.status === "pendente" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        r.status === "recusada" ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {r.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs">
                    {r.horario} (Aula {r.aula})
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => toast.info("Funcionalidade de edição em breve.")}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" 
                        onClick={async () => {
                          if (window.confirm("Deseja realmente cancelar esta reserva?")) {
                            await cancelReserva(r.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:hidden pb-20">
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
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Funcionalidade de edição em breve.")}>
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-red-600 border-red-100" 
                  onClick={async () => {
                    if (window.confirm("Deseja realmente cancelar esta reserva?")) {
                      await cancelReserva(r.id);
                    }
                  }}
                >
                  Excluir
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminReservasPage;
