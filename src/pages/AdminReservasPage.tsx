import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { reservas, recursos, Usuario, Recurso } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Search, Filter, Trash2, Edit, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const AdminReservasPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const schoolReservas = reservas
    .filter(r => r.escola_id === user?.escola_id)
    .filter(r => 
      r.nome_professor.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.disciplina.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.turma.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Todas as Reservas</h1>
          <p className="text-sm text-slate-500">Histórico completo de agendamentos da escola.</p>
        </div>
        <div className="flex gap-2">
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

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
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
                    <Badge 
                      style={{ backgroundColor: rec?.cor_fundo, color: rec?.cor_texto, borderColor: rec?.cor_borda }}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {rec?.nome}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs">
                    {r.horario} (Aula {r.aula})
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => toast.error("Reserva excluída")}>
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
    </div>
  );
};

export default AdminReservasPage;
