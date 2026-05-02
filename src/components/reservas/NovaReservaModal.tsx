import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useAuth } from "../../contexts/AuthContext";
import { recursos, usuarios, Usuario } from "../../data/mockData";
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

const TURMAS_OPCOES = [
  {
    label: "Ensino Fundamental",
    options: ["5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"]
  },
  {
    label: "Ensino Médio",
    options: [
      "1º Ano A", "1º Ano B", "1º Ano C",
      "2º Ano A", "2º Ano B", "2º Ano C",
      "3º Ano A", "3º Ano B", "3º Ano C"
    ]
  }
];

const NovaReservaModal = ({ isOpen, onClose, initialData }: NovaReservaModalProps) => {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    professorId: "",
    disciplina: "",
    turma: "",
    data: "",
    recursoId: "",
    aulas: [] as number[],
    observacao: ""
  });

  const [selectedProfessor, setSelectedProfessor] = useState<Usuario | null>(null);

  useEffect(() => {
    if (isOpen) {
      const isProfessor = profile?.role === 'professor';
      const initialProfessorId = isProfessor ? user?.id : "";
      
      let initialProfessor = null;
      if (isProfessor) {
        initialProfessor = {
          id: user?.id || "",
          nome: profile?.full_name || "",
          email: user?.email || "",
          escola_id: profile?.escola_id || "",
          papel: profile?.role || "professor",
          status: profile?.status || "ativo",
          disciplinas: profile?.disciplinas || []
        } as Usuario;
      }

      const initialDisciplina = (initialProfessor?.disciplinas && initialProfessor.disciplinas.length === 1) 
        ? initialProfessor.disciplinas[0] 
        : "";
      
      setFormData({
        professorId: initialProfessorId || "",
        disciplina: initialDisciplina,
        turma: "",
        data: initialData?.date || "",
        recursoId: "",
        aulas: initialData?.aula ? [initialData.aula] : [],
        observacao: ""
      });
      setSelectedProfessor(initialProfessor);
    }
  }, [isOpen, initialData, user, profile]);

  useEffect(() => {
    if (formData.professorId && profile?.role !== 'professor') {
      const prof = usuarios.find(u => u.id === formData.professorId);
      if (prof) {
        setSelectedProfessor(prof);
        const disciplines = prof.disciplinas || [];
        if (disciplines.length === 1) {
          setFormData(prev => ({ ...prev, disciplina: disciplines[0] }));
        } else if (disciplines.length > 1) {
          if (!disciplines.includes(formData.disciplina)) {
            setFormData(prev => ({ ...prev, disciplina: "" }));
          }
        } else {
          setFormData(prev => ({ ...prev, disciplina: "" }));
        }
      }
    } else if (!formData.professorId && profile?.role !== 'professor') {
      setSelectedProfessor(null);
      setFormData(prev => ({ ...prev, disciplina: "" }));
    }
  }, [formData.professorId, profile?.role]);

  const availableRecursos = recursos.filter(r => r.escola_id === profile?.escola_id);
  // Show ALL non-interval hours in a single section as requested
  const allHorarios = horarios.filter(h => !h.isIntervalo);

  const professoresDaEscola = usuarios.filter(u => 
    u.escola_id === profile?.escola_id && u.papel === 'professor' && u.status === 'ativo'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.professorId) { toast.error("Selecione o professor responsável"); return; }
    if (!formData.disciplina) { toast.error("Informe a disciplina"); return; }
    if (!formData.turma) { toast.error("Selecione a turma"); return; }
    if (!formData.data) { toast.error("Selecione uma data"); return; }
    if (!formData.recursoId) { toast.error("Selecione um recurso"); return; }
    if (formData.aulas.length === 0) { toast.error("Selecione pelo menos uma aula"); return; }
    
    // Check for conflicts (Simplified mock logic - usually handled by backend)
    // Here we'd need to check if any of selected slots are already taken
    
    console.log("Reserva enviada:", { 
      ...formData, 
      nome_professor: selectedProfessor?.nome, 
      escola_id: profile?.escola_id 
    });
    
    toast.success("Reserva realizada com sucesso!");
    onClose();
  };

  const formattedDate = formData.data ? format(parseISO(formData.data), "EEEE · d 'de' MMMM 'de' yyyy", { locale: ptBR }) : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95%] mx-auto overflow-y-auto max-h-[90vh] p-0 border-none rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">Novo Agendamento</DialogTitle>
          </DialogHeader>
          <p className="text-blue-100 text-sm font-medium mt-1 opacity-90">Preencha os detalhes para reservar o recurso.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professor Responsável</Label>
              {profile?.role === 'professor' ? (
                <Input value={profile?.full_name} disabled className="bg-slate-50 border-slate-100 font-bold text-slate-600 rounded-xl" />
              ) : (
                <Select value={formData.professorId} onValueChange={(v) => setFormData({...formData, professorId: v})}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-10 font-medium">
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professoresDaEscola.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disciplina</Label>
              {selectedProfessor?.disciplinas && selectedProfessor.disciplinas.length > 0 ? (
                selectedProfessor.disciplinas.length === 1 ? (
                  <Input 
                    value={selectedProfessor.disciplinas[0]} 
                    disabled 
                    className="bg-slate-50 border-slate-100 font-bold text-slate-600 rounded-xl" 
                  />
                ) : (
                  <Select value={formData.disciplina} onValueChange={(v) => setFormData({...formData, disciplina: v})}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-10 font-medium">
                      <SelectValue placeholder="Escolha a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProfessor.disciplinas.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              ) : (
                <Input 
                  required 
                  value={formData.disciplina} 
                  onChange={e => setFormData({...formData, disciplina: e.target.value})} 
                  placeholder="Ex: Matemática" 
                  className="rounded-xl border-slate-200 h-10 font-medium" 
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Turma</Label>
              <Select value={formData.turma} onValueChange={(v) => setFormData({...formData, turma: v})}>
                <SelectTrigger className="rounded-xl border-slate-200 h-10 font-medium">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {TURMAS_OPCOES.map(group => (
                    <SelectGroup key={group.label}>
                      <SelectLabel className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{group.label}</SelectLabel>
                      {group.options.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
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
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horários das Aulas</Label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allHorarios.map(h => (
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
                  <div className="flex flex-col min-w-0">
                    <Label htmlFor={`aula-${h.aula}`} className="text-[11px] font-black text-slate-900 cursor-pointer truncate">{h.label}</Label>
                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{h.inicio} - {h.fim}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Extras</Label>
            <Textarea value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} placeholder="Ex: Preciso de adaptador HDMI..." className="min-h-[80px] rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium" />
          </div>

          <DialogFooter className="sticky bottom-0 bg-white pt-4 pb-2 flex flex-col sm:flex-row gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</Button>
            <Button type="submit" className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">Salvar Agendamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovaReservaModal;