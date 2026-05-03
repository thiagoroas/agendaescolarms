import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHorarios, HorarioEscola } from "@/hooks/useHorarios";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Clock, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUp, 
  ArrowDown,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";

const AdminHorariosPage = () => {
  const { profile, selectedEscolaId } = useAuth();
  const { horarios, loading, upsertHorario, deleteHorario, refresh } = useHorarios();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HorarioEscola>>({});

  const handleEdit = (h: HorarioEscola) => {
    setIsEditing(h.id);
    setEditForm(h);
  };

  const handleCancel = () => {
    setIsEditing(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editForm.nome?.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }
    if (!editForm.hora_inicio || !editForm.hora_fim) {
      toast.error("Horários de início e fim são obrigatórios");
      return;
    }

    const success = await upsertHorario(editForm);
    if (success) {
      setIsEditing(null);
      setEditForm({});
    }
  };

  const handleAdd = () => {
    const nextOrdem = horarios.length > 0 ? Math.max(...horarios.map(h => h.ordem)) + 1 : 1;
    const newHorario: Partial<HorarioEscola> = {
      nome: `Aula ${nextOrdem}`,
      turno: "manha",
      ordem: nextOrdem,
      hora_inicio: "07:00",
      hora_fim: "07:50",
      tipo: "aula",
      ativo: true
    };
    setIsEditing("new");
    setEditForm(newHorario);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este horário?")) {
      await deleteHorario(id);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= horarios.length) return;

    const current = horarios[index];
    const target = horarios[targetIndex];

    // Troca ordens
    const currentOrdem = current.ordem;
    const targetOrdem = target.ordem;

    // Usamos upsert para trocar as ordens (pode precisar de lógica mais robusta se houver restrição unique imediata)
    // Aqui fazemos em sequência
    await upsertHorario({ ...current, ordem: -1 }); // Temporário
    await upsertHorario({ ...target, ordem: currentOrdem });
    await upsertHorario({ ...current, ordem: targetOrdem });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Horários da Escola</h1>
          <p className="text-sm font-medium text-slate-500">Configure os tempos de aula e intervalos da unidade.</p>
        </div>
        <div className="flex gap-2">
           <Button 
            variant="outline" 
            className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 h-12 px-6 rounded-2xl shadow-xl shadow-blue-100 font-black uppercase tracking-widest transition-all hover:scale-105" 
            onClick={handleAdd}
            disabled={isEditing !== null}
          >
            <Plus className="mr-2 h-5 w-5 stroke-[3px]" />
            Adicionar
          </Button>
        </div>
      </header>

      {!isSupabaseConfigured && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Modo Protótipo Ativo:</span> A edição de horários está disponível apenas no ambiente Supabase real. Aqui você visualiza os horários padrão.
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center font-bold text-slate-400">Carregando horários...</div>
        ) : horarios.length === 0 && isEditing === null ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Nenhum horário configurado.</p>
            <Button variant="link" onClick={handleAdd} className="mt-2 text-blue-600 font-bold uppercase tracking-widest text-[10px]">
              Clique para começar a configurar
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {isEditing === "new" && (
              <Card className="border-2 border-blue-500 shadow-xl shadow-blue-50 animate-in zoom-in-95 duration-200 rounded-3xl overflow-hidden">
                <CardHeader className="bg-blue-500 text-white py-4">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Novo Horário</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome</Label>
                      <Input 
                        value={editForm.nome} 
                        onChange={e => setEditForm({...editForm, nome: e.target.value})}
                        className="h-10 font-bold"
                        placeholder="Ex: 1ª Aula"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Turno</Label>
                      <Select value={editForm.turno} onValueChange={(v: any) => setEditForm({...editForm, turno: v})}>
                        <SelectTrigger className="h-10 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manha">Manhã</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noite">Noite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Início</Label>
                        <Input 
                          type="time"
                          value={editForm.hora_inicio} 
                          onChange={e => setEditForm({...editForm, hora_inicio: e.target.value})}
                          className="h-10 font-bold"
                        />
                      </div>
                       <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fim</Label>
                        <Input 
                          type="time"
                          value={editForm.hora_fim} 
                          onChange={e => setEditForm({...editForm, hora_fim: e.target.value})}
                          className="h-10 font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</Label>
                      <Select value={editForm.tipo} onValueChange={(v: any) => setEditForm({...editForm, tipo: v})}>
                        <SelectTrigger className="h-10 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aula">Aula</SelectItem>
                          <SelectItem value="intervalo">Intervalo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                    <Button variant="ghost" onClick={handleCancel} className="font-bold uppercase tracking-widest text-[10px]">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 font-bold uppercase tracking-widest text-[10px]">
                      <Save className="mr-2 h-4 w-4" /> Salvar Horário
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {horarios.map((h, index) => (
              isEditing === h.id ? (
                <Card key={h.id} className="border-2 border-blue-500 shadow-xl shadow-blue-50 rounded-3xl overflow-hidden">
                   <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome</Label>
                        <Input 
                          value={editForm.nome} 
                          onChange={e => setEditForm({...editForm, nome: e.target.value})}
                          className="h-10 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Turno</Label>
                        <Select value={editForm.turno} onValueChange={(v: any) => setEditForm({...editForm, turno: v})}>
                          <SelectTrigger className="h-10 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manha">Manhã</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                            <SelectItem value="noite">Noite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Início</Label>
                          <Input 
                            type="time"
                            value={editForm.hora_inicio} 
                            onChange={e => setEditForm({...editForm, hora_inicio: e.target.value})}
                            className="h-10 font-bold"
                          />
                        </div>
                         <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fim</Label>
                          <Input 
                            type="time"
                            value={editForm.hora_fim} 
                            onChange={e => setEditForm({...editForm, hora_fim: e.target.value})}
                            className="h-10 font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex items-end gap-6 h-full pb-1">
                        <div className="space-y-2 flex-1">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</Label>
                          <Select value={editForm.tipo} onValueChange={(v: any) => setEditForm({...editForm, tipo: v})}>
                            <SelectTrigger className="h-10 font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aula">Aula</SelectItem>
                              <SelectItem value="intervalo">Intervalo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ativo</Label>
                          <Switch 
                            checked={editForm.ativo} 
                            onCheckedChange={v => setEditForm({...editForm, ativo: v})} 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                      <Button variant="ghost" onClick={handleCancel} className="font-bold uppercase tracking-widest text-[10px]">Cancelar</Button>
                      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 font-bold uppercase tracking-widest text-[10px]">
                        <Save className="mr-2 h-4 w-4" /> Atualizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div 
                  key={h.id} 
                  className={cn(
                    "group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 transition-all hover:shadow-md",
                    !h.ativo && "opacity-60 bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 disabled:opacity-0"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0 || !isSupabaseConfigured}
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400">
                        {h.ordem}
                      </div>
                      <Button 
                        variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 disabled:opacity-0"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === horarios.length - 1 || !isSupabaseConfigured}
                      >
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-slate-900 uppercase tracking-tight">{h.nome}</h3>
                        <Badge className={cn(
                          "text-[9px] font-black uppercase tracking-widest border-none",
                          h.tipo === "aula" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {h.tipo}
                        </Badge>
                        {!h.ativo && (
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-slate-200">Inativo</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{h.turno}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-sm font-black text-blue-600 tracking-tight">{h.hora_inicio.substring(0, 5)} – {h.hora_fim.substring(0, 5)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto md:ml-auto md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" size="sm" 
                      className="flex-1 md:w-auto h-9 px-3 rounded-xl font-bold text-slate-400 hover:text-blue-600"
                      onClick={() => handleEdit(h)}
                      disabled={!isSupabaseConfigured}
                    >
                      <Edit2 size={14} className="mr-2" /> Editar
                    </Button>
                    <Button 
                      variant="ghost" size="sm" 
                      className="flex-1 md:w-auto h-9 px-3 rounded-xl font-bold text-slate-400 hover:text-red-600"
                      onClick={() => handleDelete(h.id)}
                      disabled={!isSupabaseConfigured}
                    >
                      <Trash2 size={14} className="mr-2" /> Excluir
                    </Button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Sobre as Configurações</h4>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Os horários definidos aqui serão utilizados na Agenda e no formulário de Nova Reserva.
              Alterar um horário não remove as reservas já existentes, mas elas passarão a exibir o novo nome/período configurado para aquela ordem de aula.
              Intervalos aparecem na agenda mas não permitem reservas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHorariosPage;
