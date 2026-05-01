import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../../contexts/AuthContext";
import { recursos } from "../../data/mockData";
import { horarios } from "../../data/horarios";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NovaReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: { date?: string; aula?: number; turno?: "manha" | "tarde" };
}

const NovaReservaModal = ({ isOpen, onClose, initialData }: NovaReservaModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    disciplina: "",
    turma: "",
    data: "",
    turno: "manha" as "manha" | "tarde",
    recursoId: "",
    aulas: [] as number[],
    observacao: ""
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        disciplina: "",
        turma: "",
        data: initialData?.date || "",
        turno: initialData?.turno || "manha",
        recursoId: "",
        aulas: initialData?.aula ? [initialData.aula] : [],
        observacao: ""
      });
    }
  }, [isOpen, initialData]);

  const availableRecursos = recursos.filter(r => r.escola_id === user?.escola_id);
  const availableHorarios = horarios.filter(h => h.turno === formData.turno && !h.isIntervalo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.data) { toast.error("Selecione uma data"); return; }
    if (!formData.recursoId) { toast.error("Selecione um recurso"); return; }
    if (formData.aulas.length === 0) { toast.error("Selecione pelo menos uma aula"); return; }
    
    console.log("Reserva enviada:", { ...formData, professor: user?.nome, escola_id: user?.escola_id });
    toast.success("Reserva realizada com sucesso!");
    onClose();
  };

  const formattedDate = formData.data ? format(parseISO(formData.data), "EEEE · d 'de' MMMM 'de' yyyy", { locale: ptBR }) : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95%] mx-auto overflow-y-auto max-h-[90vh] p-0 border-none rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">Novo Agendamento</DialogTitle>
          </DialogHeader>
          <p className="text-blue-100 text-sm font-medium mt-1 opacity-90">Preencha os detalhes para reservar o recurso.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professor Responsável</Label>
              <Input value={user?.nome} disabled className="bg-slate-50 border-slate-100 font-bold text-slate-600 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data da Reserva</Label>
              {initialData?.date ? (
                <div className="h-10 px-3 flex items-center border border-blue-100 rounded-xl bg-blue-50 text-blue-700 font-black text-xs uppercase tracking-tight">
                  {formattedDate}
                </div>
              ) : (
                <Input type="date" required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="rounded-xl border-slate-200 h-10" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disciplina</Label>
              <Input required value={formData.disciplina} onChange={e => setFormData({...formData, disciplina: e.target.value})} placeholder="Ex: Matemática" className="rounded-xl border-slate-200 h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Turma</Label>
              <Input required placeholder="Ex: 3º Ano A" value={formData.turma} onChange={e => setFormData({...formData, turma: e.target.value})} className="rounded-xl border-slate-200 h-10" />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecione o Recurso</Label>
            <RadioGroup value={formData.recursoId} onValueChange={v => setFormData({...formData, recursoId: v})} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableRecursos.map(r => (
                <div key={r.id} className="relative">
                  <RadioGroupItem value={r.id} id={`rec-${r.id}`} className="peer sr-only" />
                  <Label 
                    htmlFor={`rec-${r.id}`} 
                    style={{ 
                      borderColor: formData.recursoId === r.id ? r.cor_borda : '#f1f5f9',
                      backgroundColor: formData.recursoId === r.id ? `${r.cor_fundo}40` : 'white'
                    }}
                    className={cn(
                      "flex flex-col p-3 rounded-2xl border-2 cursor-pointer transition-all hover:bg-slate-50 peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-blue-500",
                      formData.recursoId === r.id ? "shadow-md scale-[1.02]" : "shadow-sm border-slate-100"
                    )}
                  >
                    <span className="text-xs font-black text-slate-900">{r.nome}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{r.tipo}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horários das Aulas</Label>
              <RadioGroup value={formData.turno} onValueChange={v => setFormData({...formData, turno: v as any, aulas: []})} className="flex gap-4">
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="manha" id="manha" className="h-4 w-4" />
                  <Label htmlFor="manha" className="text-xs font-bold text-slate-600 uppercase">Manhã</Label>
                </div>
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="tarde" id="tarde" className="h-4 w-4" />
                  <Label htmlFor="tarde" className="text-xs font-bold text-slate-600 uppercase">Tarde</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {availableHorarios.map(h => (
                <div 
                  key={h.aula} 
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-xl border-2 transition-all",
                    formData.aulas.includes(h.aula) ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-slate-50 hover:bg-slate-50"
                  )}
                >
                  <Checkbox 
                    id={`aula-${h.aula}`}
                    checked={formData.aulas.includes(h.aula)}
                    onCheckedChange={(checked) => {
                      const newAulas = checked 
                        ? [...formData.aulas, h.aula] 
                        : formData.aulas.filter(a => a !== h.aula);
                      setFormData({...formData, aulas: newAulas});
                    }}
                  />
                  <div className="flex flex-col">
                    <Label htmlFor={`aula-${h.aula}`} className="text-[11px] font-black text-slate-900 cursor-pointer">{h.label}</Label>
                    <span className="text-[9px] font-bold text-slate-400">{h.inicio} - {h.fim}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Extras</Label>
            <Textarea value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} placeholder="Ex: Preciso de adaptador HDMI..." className="min-h-[80px] rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all" />
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-xl font-bold text-slate-400 hover:text-slate-600">Cancelar</Button>
            <Button type="submit" className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">Confirmar Agendamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovaReservaModal;