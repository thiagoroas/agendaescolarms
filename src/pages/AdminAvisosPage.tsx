import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMockAvisos, saveMockAvisos, createMockAviso, updateMockAviso, deleteMockAviso, getMockRecursos } from "../data/storage";
import { useRecursos } from "@/hooks/useRecursos";
import { AvisoLaboratorio, Recurso } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Edit2, Trash2, Power, PowerOff, Filter, Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminAvisosPage = () => {
  const { profile, selectedEscolaId } = useAuth();
  const currentEscolaId = selectedEscolaId || profile?.escola_id;
  
  const [avisos, setAvisos] = useState<AvisoLaboratorio[]>([]);
  const { recursos, loading: loadingRecursos } = useRecursos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAviso, setEditingAviso] = useState<AvisoLaboratorio | null>(null);
  
  // Filtros
  const [filtroAtivo, setFiltroAtivo] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const [formData, setFormData] = useState({
    titulo: "",
    mensagem: "",
    tipo: "informativo" as "informativo" | "atencao" | "urgente",
    recurso_id: "geral",
    data_inicio: format(new Date(), "yyyy-MM-dd"),
    data_fim: format(new Date(), "yyyy-MM-dd"),
    hora_inicio: "",
    hora_fim: "",
    exibir_na_agenda: true,
    exibir_no_modal_reserva: true,
    exibir_no_dashboard: true,
    exigir_confirmacao: false,
    ativo: true
  });

  useEffect(() => {
    setAvisos(getMockAvisos());
    setRecursos(getMockRecursos().filter(r => r.escola_id === currentEscolaId));
  }, [currentEscolaId]);

  const schoolAvisos = avisos.filter(a => a.escola_id === currentEscolaId);
  
  const filteredAvisos = schoolAvisos.filter(a => {
    if (filtroAtivo === "ativo" && !a.ativo) return false;
    if (filtroAtivo === "inativo" && a.ativo) return false;
    if (filtroTipo !== "todos" && a.tipo !== filtroTipo) return false;
    return true;
  });

  const handleOpenModal = (aviso?: AvisoLaboratorio) => {
    if (aviso) {
      setEditingAviso(aviso);
      setFormData({
        titulo: aviso.titulo,
        mensagem: aviso.mensagem,
        tipo: aviso.tipo,
        recurso_id: aviso.recurso_id || "geral",
        data_inicio: aviso.data_inicio,
        data_fim: aviso.data_fim,
        hora_inicio: aviso.hora_inicio || "",
        hora_fim: aviso.hora_fim || "",
        exibir_na_agenda: aviso.exibir_na_agenda,
        exibir_no_modal_reserva: aviso.exibir_no_modal_reserva,
        exibir_no_dashboard: aviso.exibir_no_dashboard,
        exigir_confirmacao: aviso.exigir_confirmacao,
        ativo: aviso.ativo
      });
    } else {
      setEditingAviso(null);
      setFormData({
        titulo: "",
        mensagem: "",
        tipo: "informativo",
        recurso_id: "geral",
        data_inicio: format(new Date(), "yyyy-MM-dd"),
        data_fim: format(new Date(), "yyyy-MM-dd"),
        hora_inicio: "",
        hora_fim: "",
        exibir_na_agenda: true,
        exibir_no_modal_reserva: true,
        exibir_no_dashboard: true,
        exigir_confirmacao: false,
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.mensagem.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }

    const data: Omit<AvisoLaboratorio, "id" | "criado_em"> = {
      ...formData,
      escola_id: currentEscolaId!,
      recurso_id: formData.recurso_id === "geral" ? undefined : formData.recurso_id,
      criado_por: profile?.full_name || "Admin"
    };

    if (editingAviso) {
      updateMockAviso(editingAviso.id, data);
      toast.success("Aviso atualizado com sucesso!");
    } else {
      createMockAviso(data);
      toast.success("Aviso criado com sucesso!");
    }

    setAvisos(getMockAvisos());
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja realmente excluir este aviso?")) {
      deleteMockAviso(id);
      setAvisos(getMockAvisos());
      toast.success("Aviso excluído");
    }
  };

  const toggleAtivo = (id: string, currentStatus: boolean) => {
    updateMockAviso(id, { ativo: !currentStatus });
    setAvisos(getMockAvisos());
    toast.success(currentStatus ? "Aviso desativado" : "Aviso ativado");
  };

  const getTipoInfo = (tipo: string) => {
    switch (tipo) {
      case "urgente": return { color: "bg-red-500", icon: AlertTriangle, label: "Urgente" };
      case "atencao": return { color: "bg-amber-500", icon: Info, label: "Atenção" };
      default: return { color: "bg-blue-500", icon: CheckCircle2, label: "Informativo" };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Avisos do Laboratório</h1>
          <p className="text-sm font-medium text-slate-500">Crie comunicados e regras para os professores.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-6 rounded-2xl shadow-xl shadow-blue-100 font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95" onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-5 w-5 stroke-[3px]" />
          Novo Aviso
        </Button>
      </header>

      <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filtros:</span>
            </div>
            <Select value={filtroAtivo} onValueChange={setFiltroAtivo}>
              <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs font-bold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs font-bold">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Tipos</SelectItem>
                <SelectItem value="informativo">Informativo</SelectItem>
                <SelectItem value="atencao">Atenção</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Título</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Período</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Recurso</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAvisos.length > 0 ? (
                  filteredAvisos.map((a) => {
                    const tipo = getTipoInfo(a.tipo);
                    const recurso = recursos.find(r => r.id === a.recurso_id);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{a.titulo}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{a.mensagem}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={cn("text-[9px] font-black uppercase tracking-widest border-none", tipo.color + " text-white")}>
                            {tipo.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[10px] font-bold text-slate-600">
                            {format(parseISO(a.data_inicio), "dd/MM")} até {format(parseISO(a.data_fim), "dd/MM")}
                          </div>
                          {(a.hora_inicio || a.hora_fim) && (
                            <div className="text-[9px] text-slate-400 uppercase tracking-tighter">
                              {a.hora_inicio || "--:--"} às {a.hora_fim || "--:--"}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {recurso ? recurso.nome : "Geral da Escola"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={a.ativo ? "default" : "secondary"} className={cn("text-[9px] font-black uppercase tracking-widest", a.ativo ? "bg-emerald-500" : "bg-slate-200 text-slate-500")}>
                            {a.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenModal(a)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg", a.ativo ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50")} onClick={() => toggleAtivo(a.id, a.ativo)}>
                              {a.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(a.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Nenhum aviso encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl p-0 border-none rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">{editingAviso ? "Editar Aviso" : "Novo Aviso"}</DialogTitle>
            </DialogHeader>
            <p className="text-blue-100 text-sm font-medium mt-1 opacity-90">Defina as regras e informações para exibição.</p>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6 bg-white overflow-y-auto max-h-[70vh]">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título do Aviso</Label>
                <Input value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} placeholder="Ex: Manutenção no Laboratório 01" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold" required />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensagem</Label>
                <Textarea value={formData.mensagem} onChange={e => setFormData({...formData, mensagem: e.target.value})} placeholder="Escreva o comunicado aqui..." className="min-h-[100px] rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium" required />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Alerta</Label>
                <Select value={formData.tipo} onValueChange={(v: any) => setFormData({...formData, tipo: v})}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="informativo">Informativo (Azul)</SelectItem>
                    <SelectItem value="atencao">Atenção (Amarelo)</SelectItem>
                    <SelectItem value="urgente">Urgente (Vermelho)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recurso Vinculado</Label>
                <Select value={formData.recurso_id} onValueChange={(v) => setFormData({...formData, recurso_id: v})}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold">
                    <SelectValue placeholder="Geral da Escola" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="geral">Geral (Toda a Escola)</SelectItem>
                    {recursos.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Início</Label>
                <Input type="date" value={formData.data_inicio} onChange={e => setFormData({...formData, data_inicio: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" required />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Fim</Label>
                <Input type="date" value={formData.data_fim} onChange={e => setFormData({...formData, data_fim: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" required />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hora de Início (Opcional)</Label>
                <Input type="time" value={formData.hora_inicio} onChange={e => setFormData({...formData, hora_inicio: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hora de Fim (Opcional)</Label>
                <Input type="time" value={formData.hora_fim} onChange={e => setFormData({...formData, hora_fim: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locais de Exibição e Regras</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <Checkbox id="view-agenda" checked={formData.exibir_na_agenda} onCheckedChange={(v: boolean) => setFormData({...formData, exibir_na_agenda: v})} />
                  <Label htmlFor="view-agenda" className="text-xs font-bold text-slate-600 cursor-pointer">Exibir na Agenda</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <Checkbox id="view-modal" checked={formData.exibir_no_modal_reserva} onCheckedChange={(v: boolean) => setFormData({...formData, exibir_no_modal_reserva: v})} />
                  <Label htmlFor="view-modal" className="text-xs font-bold text-slate-600 cursor-pointer">Exibir no Modal de Reserva</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <Checkbox id="view-dash" checked={formData.exibir_no_dashboard} onCheckedChange={(v: boolean) => setFormData({...formData, exibir_no_dashboard: v})} />
                  <Label htmlFor="view-dash" className="text-xs font-bold text-slate-600 cursor-pointer">Exibir no Dashboard</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100/50 transition-colors">
                  <Checkbox id="req-conf" checked={formData.exigir_confirmacao} onCheckedChange={(v: boolean) => setFormData({...formData, exigir_confirmacao: v})} />
                  <Label htmlFor="req-conf" className="text-xs font-black text-amber-700 cursor-pointer flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" /> Exigir Confirmação
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl font-black uppercase tracking-widest text-slate-400">Cancelar</Button>
              <Button type="submit" className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">
                {editingAviso ? "Salvar Alterações" : "Criar Aviso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAvisosPage;