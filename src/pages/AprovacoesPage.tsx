import React, { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMockReservas, saveMockReservas, getMockRecursos, getMockUsuarios } from "../data/storage";
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
  AlertCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AprovacoesPage = () => {
  const { profile, selectedEscolaId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecusaModalOpen, setIsRecusaModalOpen] = useState(false);
  const [reservaParaRecusar, setReservaParaRecusar] = useState<string | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  
  const currentEscolaId = selectedEscolaId || profile?.escola_id;
  const reservas = getMockReservas();
  const recursos = getMockRecursos();
  
  const pendencias = useMemo(() => {
    return reservas
      .filter(r => r.escola_id === currentEscolaId && r.status === "pendente")
      .filter(r => 
        r.nome_professor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.disciplina.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.turma.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.data.localeCompare(b.data) || a.aula - b.aula);
  }, [reservas, currentEscolaId, searchTerm]);

  const handleAprovar = (id: string) => {
    const novasReservas = reservas.map(r => 
      r.id === id ? { ...r, status: "aprovada" as any } : r
    );
    saveMockReservas(novasReservas);
    toast.success("Reserva aprovada com sucesso!");
    window.location.reload(); // Refresh to update view in prototype mode
  };

  const handleRecusarClick = (id: string) => {
    setReservaParaRecusar(id);
    setMotivoRecusa("");
    setIsRecusaModalOpen(true);
  };

  const handleConfirmarRecusa = () => {
    if (!motivoRecusa.trim()) {
      toast.error("Por favor, informe o motivo da recusa.");
      return;
    }
    
    const novasReservas = reservas.map(r => 
      r.id === reservaParaRecusar ? { ...r, status: "recusada" as any, motivo_recusa: motivoRecusa } : r
    );
    saveMockReservas(novasReservas);
    toast.success("Reserva recusada.");
    setIsRecusaModalOpen(false);
    window.location.reload();
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Aprovações Pendentes</h1>
          <p className="text-sm font-medium text-slate-500">Gerencie as solicitações de reserva da sua escola.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px]">
            {pendencias.length} Aguardando
          </Badge>
        </div>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            className="pl-10 h-12 rounded-2xl bg-white border-slate-200 focus:ring-blue-500 transition-all font-medium" 
            placeholder="Buscar por professor, disciplina ou turma..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Data/Horário</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professor/Turma</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recurso/Disciplina</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendencias.length > 0 ? (
              pendencias.map((r) => {
                const rec = recursos.find(rec => rec.id === r.recurso_id);
                return (
                  <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900">{format(parseISO(r.data), "dd/MM/yyyy")}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Aula {r.aula} • {r.horario}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900">{r.nome_professor}</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{r.turma}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge 
                          style={{ backgroundColor: rec?.cor_fundo, color: rec?.cor_texto, borderColor: rec?.cor_borda }}
                          variant="outline"
                          className="text-[10px] font-black w-fit border-none"
                        >
                          {rec?.nome}
                        </Badge>
                        <span className="text-[11px] font-bold text-slate-500 italic">"{r.disciplina}"</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 rounded-xl font-bold text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleRecusarClick(r.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Recusar
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-9 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-100"
                          onClick={() => handleAprovar(r.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle size={40} className="mb-2 opacity-20" />
                    <p className="font-bold">Nenhuma aprovação pendente</p>
                    <p className="text-xs">Tudo em dia na sua escola!</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="grid gap-4 md:hidden pb-20">
        {pendencias.map((r) => {
          const rec = recursos.find(rec => rec.id === r.recurso_id);
          return (
            <div key={r.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professor</span>
                  <h3 className="font-black text-slate-900">{r.nome_professor}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data</span>
                  <p className="font-black text-blue-600">{format(parseISO(r.data), "dd/MM")}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Recurso</span>
                  <span className="text-xs font-bold text-slate-700">{rec?.nome}</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Horário</span>
                  <span className="text-xs font-bold text-slate-700">Aula {r.aula}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Objetivo Pedagógico</span>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{r.objetivo_pedagogico || 'Não informado'}"</p>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 h-11 rounded-xl font-bold text-red-500 border-red-100" onClick={() => handleRecusarClick(r.id)}>
                  Recusar
                </Button>
                <Button size="sm" className="flex-1 h-11 rounded-xl font-bold bg-emerald-500" onClick={() => handleAprovar(r.id)}>
                  Aprovar
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Recusa */}
      <Dialog open={isRecusaModalOpen} onOpenChange={setIsRecusaModalOpen}>
        <DialogContent className="max-w-md p-0 border-none rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-red-600 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">Recusar Reserva</DialogTitle>
            </DialogHeader>
            <p className="text-red-100 text-sm font-medium mt-1 opacity-90">Informe ao professor por que a reserva não foi aceita.</p>
          </div>
          
          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo da Recusa</Label>
              <Textarea 
                id="motivo" 
                value={motivoRecusa} 
                onChange={e => setMotivoRecusa(e.target.value)} 
                placeholder="Ex: Laboratório em manutenção, conflito com evento escolar..." 
                className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium" 
                required 
              />
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsRecusaModalOpen(false)} className="flex-1 rounded-xl font-black uppercase tracking-widest text-slate-400">Cancelar</Button>
              <Button type="button" className="flex-[2] h-12 bg-red-600 hover:bg-red-700 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all" onClick={handleConfirmarRecusa}>Confirmar Recusa</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AprovacoesPage;