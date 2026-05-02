import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMockReservas, saveMockReservas, getMockRecursos } from "../data/storage";
import { Reserva, Recurso } from "../data/mockData";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  User, 
  Monitor, 
  Calendar, 
  Info,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Printer,
  FileText,
  Wrench,
  ArrowRight
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { horarios } from "../data/horarios";

const AprovacoesPage = () => {
  const { profile, selectedEscolaId } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isManutencaoModalOpen, setIsManutencaoModalOpen] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  
  // Form para bloqueio de manutenção
  const [manutencaoData, setManutencaoData] = useState({
    recursoId: "",
    data: format(new Date(), "yyyy-MM-dd"),
    aula: "1",
    motivo: ""
  });
  
  const currentEscolaId = selectedEscolaId || profile?.escola_id;

  useEffect(() => {
    setReservas(getMockReservas());
    setRecursos(getMockRecursos());
  }, []);
  
  const hojeStr = format(new Date(), "yyyy-MM-dd");

  const reservasEscola = useMemo(() => {
    return reservas.filter(r => r.escola_id === currentEscolaId);
  }, [reservas, currentEscolaId]);

  const reservasHoje = useMemo(() => {
    return reservasEscola
      .filter(r => r.data === hojeStr && (r.status === "confirmada" || r.status === "aprovada"))
      .sort((a, b) => a.aula - b.aula);
  }, [reservasEscola, hojeStr]);

  const proximasReservas = useMemo(() => {
    return reservasEscola
      .filter(r => r.data >= hojeStr && (r.status === "confirmada" || r.status === "aprovada"))
      .filter(r => 
        r.nome_professor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.disciplina.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.turma.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.data.localeCompare(b.data) || a.aula - b.aula);
  }, [reservasEscola, hojeStr, searchTerm]);

  const handleCancelarReserva = (id: string) => {
    if (window.confirm("Deseja realmente cancelar esta reserva?")) {
      const novasReservas = reservas.map(r => 
        r.id === id ? { ...r, status: "cancelada" as any } : r
      );
      setReservas(novasReservas);
      saveMockReservas(novasReservas);
      toast.success("Reserva cancelada com sucesso!");
    }
  };

  const handleBloquearHorario = () => {
    if (!manutencaoData.recursoId || !manutencaoData.data || !manutencaoData.aula || !manutencaoData.motivo) {
      toast.error("Preencha todos os campos para o bloqueio.");
      return;
    }

    const h = horarios.find(hour => hour.aula === Number(manutencaoData.aula));
    const novaManutencao: Reserva = {
      id: `mnt-${Date.now()}`,
      escola_id: currentEscolaId || "",
      recurso_id: manutencaoData.recursoId,
      profile_id: "admin",
      nome_professor: "Manutenção",
      disciplina: "Bloqueio",
      turma: "N/A",
      data: manutencaoData.data,
      turno: (Number(manutencaoData.aula) <= 4 ? "manha" : "tarde") as "manha" | "tarde",
      aula: Number(manutencaoData.aula),
      horario: h ? `${h.inicio} – ${h.fim}` : "",
      observacao: manutencaoData.motivo,
      status: "manutencao" as any,
      criado_em: new Date().toISOString()
    };

    const novasReservas = [...reservas, novaManutencao];
    setReservas(novasReservas);
    saveMockReservas(novasReservas);
    toast.success("Horário bloqueado para manutenção!");
    setIsManutencaoModalOpen(false);
    setManutencaoData(prev => ({ ...prev, motivo: "" }));
  };

  const recursosEscola = recursos.filter(r => r.escola_id === currentEscolaId);

  return (
    <div className="space-y-8 pb-20 md:pb-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Central do Laboratório</h1>
          <p className="text-sm font-medium text-slate-500">Gestão e acompanhamento das reservas da escola.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100"
            onClick={() => setIsManutencaoModalOpen(true)}
          >
            <Wrench className="mr-2 h-4 w-4" /> Bloquear Horário
          </Button>
          <Button 
            variant="outline"
            className="h-10 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px]"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Reservas de Hoje e Próximas */}
        <div className="lg:col-span-2 space-y-8">
          {/* Reservas de Hoje */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              <Clock className="text-blue-500" size={16} /> Reservas de Hoje
            </h2>
            <div className="grid gap-4">
              {reservasHoje.length > 0 ? (
                reservasHoje.map((r) => {
                  const rec = recursos.find(rec => rec.id === r.recurso_id);
                  return (
                    <div key={r.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 transition-all hover:shadow-md">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Aula</span>
                        <span className="text-lg font-black text-slate-900 leading-none">{r.aula}</span>
                      </div>
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                          <h3 className="font-black text-slate-900 truncate">{r.nome_professor}</h3>
                          <Badge className="w-fit mx-auto sm:mx-0 bg-blue-50 text-blue-700 border-none font-bold text-[9px] uppercase tracking-widest">{r.turma}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                          <Monitor size={12} className="text-slate-300" /> {rec?.nome} · <Clock size={12} className="text-slate-300" /> {r.horario}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl font-bold text-slate-400 hover:text-blue-600" onClick={() => navigate("/agenda")}>
                          <Eye className="h-4 w-4 mr-2" /> Detalhes
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl font-bold text-slate-400 hover:text-red-600" onClick={() => handleCancelarReserva(r.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nenhuma reserva para hoje</p>
                </div>
              )}
            </div>
          </div>

          {/* Próximas Reservas - Tabela */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
              <Calendar className="text-blue-500" size={16} /> Acompanhamento de Reservas
            </h2>
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  className="pl-10 h-11 rounded-2xl bg-white border-slate-200 focus:ring-blue-500 transition-all font-medium" 
                  placeholder="Filtrar próximas reservas..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professor/Turma</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recurso</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proximasReservas.slice(0, 10).map((r) => {
                      const rec = recursos.find(rec => rec.id === r.recurso_id);
                      return (
                        <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                          <TableCell className="py-4">
                            <span className="font-black text-slate-900">{format(parseISO(r.data), "dd/MM")}</span>
                            <span className="text-[10px] font-bold text-slate-400 block tracking-tight">Aula {r.aula}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-black text-slate-900 block">{r.nome_professor}</span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{r.turma}</span>
                          </TableCell>
                          <TableCell>
                             <Badge 
                              style={{ backgroundColor: rec?.cor_fundo, color: rec?.cor_texto, borderColor: rec?.cor_borda }}
                              variant="outline"
                              className="text-[9px] font-black border-none"
                            >
                              {rec?.nome}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600" onClick={() => handleCancelarReserva(r.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Alertas e Ações Rápidas */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2">Ações Rápidas</h2>
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-3">
              <Button variant="outline" className="w-full justify-between h-12 rounded-2xl border-slate-100 hover:bg-slate-50 group transition-all" onClick={() => navigate("/agenda")}>
                <span className="flex items-center gap-3 font-bold text-slate-700">
                  <Calendar className="text-blue-500" size={18} /> Ir para Agenda
                </span>
                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" className="w-full justify-between h-12 rounded-2xl border-slate-100 hover:bg-slate-50 group transition-all" onClick={() => navigate("/admin/reservas")}>
                <span className="flex items-center gap-3 font-bold text-slate-700">
                  <FileText className="text-emerald-500" size={18} /> Gerar Relatório
                </span>
                <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2">Alertas e Status</h2>
            <Card className="rounded-3xl border-none bg-blue-600 text-white overflow-hidden relative shadow-xl shadow-blue-100">
              <CardContent className="p-6 relative z-10">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Info size={20} className="text-white" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest mb-2">Dica de Gestão</h4>
                <p className="text-xs text-blue-100 font-medium leading-relaxed opacity-90">
                  Utilize o botão de "Bloquear Horário" para períodos de manutenção ou eventos internos, evitando conflitos com agendamentos de professores.
                </p>
              </CardContent>
            </Card>
            
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Reservas de hoje:</span>
                <span className="text-xs font-black text-slate-900">{reservasHoje.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Bloqueios ativos:</span>
                <span className="text-xs font-black text-amber-600">{reservasEscola.filter(r => r.status === "manutencao").length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Manutenção / Bloqueio */}
      <Dialog open={isManutencaoModalOpen} onOpenChange={setIsManutencaoModalOpen}>
        <DialogContent className="max-w-md p-0 border-none rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-3">
                <Wrench className="text-blue-500" /> Bloquear Horário
              </DialogTitle>
            </DialogHeader>
            <p className="text-slate-400 text-sm font-medium mt-1 opacity-90">Impedir agendamentos por manutenção ou evento.</p>
          </div>
          
          <div className="p-8 space-y-6 bg-white">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recurso</Label>
                <Select value={manutencaoData.recursoId} onValueChange={v => setManutencaoData(prev => ({ ...prev, recursoId: v }))}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Escolha o recurso" />
                  </SelectTrigger>
                  <SelectContent>
                    {recursosEscola.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data</Label>
                  <Input type="date" value={manutencaoData.data} onChange={e => setManutencaoData(prev => ({ ...prev, data: e.target.value }))} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aula/Horário</Label>
                  <Select value={manutencaoData.aula} onValueChange={v => setManutencaoData(prev => ({ ...prev, aula: v }))}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Aula" />
                    </SelectTrigger>
                    <SelectContent>
                      {horarios.filter(h => !h.isIntervalo).map(h => (
                        <SelectItem key={h.aula} value={h.aula.toString()}>Aula {h.aula} ({h.inicio})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo do Bloqueio</Label>
                <Textarea 
                  value={manutencaoData.motivo} 
                  onChange={e => setManutencaoData(prev => ({ ...prev, motivo: e.target.value }))} 
                  placeholder="Ex: Manutenção preventiva, limpeza, troca de equipamentos..." 
                  className="min-h-[100px] rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium" 
                />
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsManutencaoModalOpen(false)} className="flex-1 rounded-xl font-black uppercase tracking-widest text-slate-400">Cancelar</Button>
              <Button type="button" className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all" onClick={handleBloquearHorario}>Confirmar Bloqueio</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AprovacoesPage;