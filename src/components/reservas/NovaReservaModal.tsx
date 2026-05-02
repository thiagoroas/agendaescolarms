import { useState, useEffect, useMemo } from "react";
import { useAvisos } from "@/hooks/useAvisos";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useAuth } from "../../contexts/AuthContext";
import { Usuario, Reserva } from "../../data/mockData";
import { getMockUsuarios, getMockReservas } from "../../data/storage";
import { useRecursos } from "@/hooks/useRecursos";
import { useReservas } from "@/hooks/useReservas";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { horarios } from "../../data/horarios";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { AlertTriangle, Info } from "lucide-react";

interface NovaReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: { date?: string; aula?: number; turno?: "manha" | "tarde" };
}

const TURMAS_OPCOES = [
  {
    label: "Turmas",
    options: [
      "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano",
      "1º Ano A", "1º Ano B", "1º Ano C",
      "2º Ano A", "2º Ano B", "2º Ano C",
      "3º Ano A", "3º Ano B", "3º Ano C"
    ]
  }
];

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const NovaReservaModal = ({ isOpen, onClose, initialData }: NovaReservaModalProps) => {
  const { user, profile } = useAuth();
  const { recursos: availableRecursos } = useRecursos();
  const { createReserva } = useReservas();
  const { avisos: avisosState, loading: loadingAvisos } = useAvisos();

  const [formData, setFormData] = useState({
    professorId: "",
    disciplina: "",
    turma: "",
    data: "",
    recursoId: "",
    aulas: [] as number[],
    objetivo_pedagogico: "",
    observacao: ""
  });

  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [conflictingAulas, setConflictingAulas] = useState<number[]>([]);
  const [avisosConfirmados, setAvisosConfirmados] = useState<Record<string, boolean>>({});

  // avisosState is now loaded via useAvisos hook
  
  const currentSchoolId = profile?.escola_id;

  const avisosAtivos = useMemo(() => {
    if (!formData.data) return [];
    
    const hojeStr = formData.data;
    
    return avisosState.filter(a => {
      if (!a.ativo || a.escola_id !== currentSchoolId || !a.exibir_no_modal_reserva) return false;
      
      const dentroData = hojeStr >= a.data_inicio && hojeStr <= a.data_fim;
      if (!dentroData) return false;

      // Se o aviso é vinculado a um recurso, só mostra se o recurso estiver selecionado
      if (a.recurso_id && a.recurso_id !== formData.recursoId) return false;

      return true;
    }).sort((a, b) => {
      const prioridade = { urgente: 0, atencao: 1, informativo: 2 };
      return prioridade[a.tipo] - prioridade[b.tipo] as any;
    });
  }, [avisosState, currentSchoolId, formData.data, formData.recursoId]);

  const allAvisosConfirmados = useMemo(() => {
    const avisosQueExigemConfirmacao = avisosAtivos.filter(a => a.exigir_confirmacao);
    if (avisosQueExigemConfirmacao.length === 0) return true;
    return avisosQueExigemConfirmacao.every(a => avisosConfirmados[a.id]);
  }, [avisosAtivos, avisosConfirmados]);

  useEffect(() => {
    const fetchExistingReservations = async () => {
      if (!isOpen || !formData.data || !formData.recursoId) return;
      
      setIsCheckingConflicts(true);
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('reservas')
            .select('*')
            .eq('data', formData.data)
            .eq('recurso_id', formData.recursoId)
            .eq('escola_id', profile?.escola_id)
            .neq('status', 'cancelada');
          
          if (error) throw error;
          setExistingReservations(data || []);
        } else {
          // Fallback to mock data
          const allMockReservas = getMockReservas();
          const mockFiltered = allMockReservas.filter(r => 
            r.data === formData.data && 
            r.recurso_id === formData.recursoId && 
            r.escola_id === profile?.escola_id &&
            r.status !== 'cancelada'
          );
          setExistingReservations(mockFiltered);
        }
      } catch (err) {
        console.error("Erro ao buscar reservas para validação:", err);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    fetchExistingReservations();
  }, [isOpen, formData.data, formData.recursoId, profile?.escola_id]);

  useEffect(() => {
    if (existingReservations.length > 0 && formData.aulas.length > 0) {
      const conflicts = formData.aulas.filter(aula => 
        existingReservations.some(r => Number(r.aula) === Number(aula))
      );
      setConflictingAulas(conflicts);
    } else {
      setConflictingAulas([]);
    }
  }, [existingReservations, formData.aulas]);

  const [selectedProfessor, setSelectedProfessor] = useState<Usuario | null>(null);
  const [professoresDaEscola, setProfessoresDaEscola] = useState<Usuario[]>([]);
  const [isLoadingProfessores, setIsLoadingProfessores] = useState(false);

  useEffect(() => {
    const fetchProfessores = async () => {
      if (!isOpen) return;
      
      const targetEscolaId = profile?.role === 'admin_plataforma' 
        ? localStorage.getItem('agenda_selected_escola_id') || profile?.escola_id
        : profile?.escola_id;

      if (!targetEscolaId) return;

      setIsLoadingProfessores(true);
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('escola_id', targetEscolaId)
            .eq('papel', 'professor')
            .eq('status', 'ativo');
          
          if (error) throw error;
          
          const mappedProfessores: Usuario[] = (data || []).map(p => ({
            id: p.id,
            nome: p.nome,
            email: p.email || "",
            escola_id: p.escola_id,
            papel: p.papel,
            status: p.status,
            disciplinas: p.disciplinas || []
          }));
          
          setProfessoresDaEscola(mappedProfessores);
        } else {
          const mockUsuarios = getMockUsuarios();
          const filtered = mockUsuarios.filter(u => 
            u.escola_id === targetEscolaId && u.papel === 'professor' && u.status === 'ativo'
          );
          setProfessoresDaEscola(filtered);
        }
      } catch (err) {
        console.error("Erro ao buscar professores:", err);
        toast.error("Erro ao carregar lista de professores");
      } finally {
        setIsLoadingProfessores(false);
      }
    };

    fetchProfessores();
  }, [isOpen, profile?.escola_id, profile?.role]);

  useEffect(() => {
    if (isOpen) {
      const isProfessor = profile?.role === 'professor';
      const initialProfessorId = isProfessor ? user?.id : "";
      
      let initialProfessor: Usuario | null = null;
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
      
      let initialDate = initialData?.date || "";
      if (!initialDate) {
        initialDate = formatDateLocal(new Date());
      }

      setFormData({
        professorId: initialProfessorId || "",
        disciplina: initialDisciplina,
        turma: "",
        data: initialDate,
        recursoId: "",
        aulas: initialData?.aula ? [initialData.aula] : [],
        objetivo_pedagogico: "",
        observacao: ""
      });
      setSelectedProfessor(initialProfessor);
      setAvisosConfirmados({});
    }
  }, [isOpen, initialData, user, profile]);

  useEffect(() => {
    if (formData.professorId && profile?.role !== 'professor') {
      const prof = professoresDaEscola.find(u => u.id === formData.professorId);
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
  }, [formData.professorId, profile?.role, professoresDaEscola]);

  const allHorarios = horarios.filter(h => !h.isIntervalo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.professorId) { toast.error("Selecione o professor responsável"); return; }
    if (!formData.disciplina) { toast.error("Informe a disciplina"); return; }
    if (!formData.turma) { toast.error("Selecione a turma"); return; }
    if (!formData.data) { toast.error("Selecione uma data"); return; }
    if (!formData.recursoId) { toast.error("Selecione um recurso"); return; }
    if (formData.aulas.length === 0) { toast.error("Selecione pelo menos uma aula"); return; }
    
    if (profile?.role === 'professor' && !formData.objetivo_pedagogico) {
      toast.error("Informe o objetivo pedagógico da aula");
      return;
    }
    
    if (conflictingAulas.length > 0) {
      toast.error(`Este recurso já está reservado nesta data para a(s) aula(s): ${conflictingAulas.join(', ')}.`);
      return;
    }

    const avisoConfirmado = avisosAtivos.find(a => a.exigir_confirmacao);
    
    try {
      for (const aula of formData.aulas) {
        const h = allHorarios.find(hour => hour.aula === aula);
        
        await createReserva({
          escola_id: profile?.escola_id || "",
          recurso_id: formData.recursoId,
          professor_id: formData.professorId,
          nome_professor: selectedProfessor?.nome || profile?.full_name || "",
          disciplina: formData.disciplina,
          turma: formData.turma,
          data: formData.data,
          turno: (aula <= 4 ? "manha" : "tarde") as "manha" | "tarde",
          aula: aula,
          horario: h ? `${h.inicio} – ${h.fim}` : "",
          objetivo_pedagogico: formData.objetivo_pedagogico,
          observacao: formData.observacao,
          status: "confirmada",
          aviso_confirmado_id: avisoConfirmado?.id,
          aviso_confirmado_em: avisoConfirmado ? new Date().toISOString() : undefined
        });
      }
      onClose();
    } catch (err) {
      console.error("Erro ao criar reserva:", err);
    }
  };

  const formattedDate = formData.data ? format(parseISO(formData.data), "EEEE · d 'de' MMMM 'de' yyyy", { locale: ptBR }) : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95%] mx-auto p-0 border-none rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">Novo Agendamento</DialogTitle>
          </DialogHeader>
          <p className="text-blue-100 text-sm font-medium mt-1 opacity-90">Preencha os detalhes para reservar o recurso.</p>
        </div>
        
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6 bg-white overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Seção de Avisos */}
          {avisosAtivos.length > 0 && (
            <div className="space-y-3">
              {avisosAtivos.map(aviso => (
                <div 
                  key={aviso.id}
                  className={cn(
                    "p-4 rounded-2xl border flex flex-col gap-3 shadow-sm animate-in fade-in duration-300",
                    aviso.tipo === "urgente" ? "bg-red-50 border-red-100 text-red-900" :
                    aviso.tipo === "atencao" ? "bg-amber-50 border-amber-100 text-amber-900" :
                    "bg-blue-50 border-blue-100 text-blue-900"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-xl shrink-0",
                      aviso.tipo === "urgente" ? "bg-red-100 text-red-600" :
                      aviso.tipo === "atencao" ? "bg-amber-100 text-amber-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      {aviso.tipo === "urgente" ? <AlertTriangle size={18} /> : <Info size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black uppercase tracking-tight">{aviso.titulo}</h4>
                      <p className="text-xs font-medium opacity-80 mt-0.5">{aviso.mensagem}</p>
                    </div>
                  </div>
                  
                  {aviso.exigir_confirmacao && (
                    <div className="flex items-center gap-2 pt-2 border-t border-current border-opacity-10">
                      <Checkbox 
                        id={`confirm-${aviso.id}`} 
                        checked={!!avisosConfirmados[aviso.id]}
                        onCheckedChange={(checked) => setAvisosConfirmados(prev => ({...prev, [aviso.id]: !!checked}))}
                        className={cn(
                          "border-current",
                          aviso.tipo === "urgente" ? "data-[state=checked]:bg-red-600" :
                          aviso.tipo === "atencao" ? "data-[state=checked]:bg-amber-600" :
                          "data-[state=checked]:bg-blue-600"
                        )}
                      />
                      <Label htmlFor={`confirm-${aviso.id}`} className="text-xs font-bold cursor-pointer">
                        Li e entendi este aviso.
                      </Label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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
              <Input 
                type="date" 
                value={formData.data} 
                onChange={e => setFormData({...formData, data: e.target.value})} 
                className={cn(
                  "rounded-xl border-slate-200 h-10 font-bold",
                  initialData?.date && "bg-blue-50 border-blue-100 text-blue-700"
                )}
                disabled={!!initialData?.date}
              />
              {initialData?.date && (
                <div className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-tight">
                  {formattedDate}
                </div>
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
                    formData.aulas.includes(h.aula) ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-slate-50 hover:bg-slate-50",
                    conflictingAulas.includes(h.aula) && "bg-red-50 border-red-200"
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
                    <Label htmlFor={`aula-${h.aula}`} className={cn("text-[11px] font-black cursor-pointer truncate", conflictingAulas.includes(h.aula) ? "text-red-600" : "text-slate-900")}>{h.label}</Label>
                    <span className={cn("text-[9px] font-bold whitespace-nowrap", conflictingAulas.includes(h.aula) ? "text-red-400" : "text-slate-400")}>
                      {conflictingAulas.includes(h.aula) ? "Indisponível" : `${h.inicio} - ${h.fim}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Objetivo Pedagógico {profile?.role === 'professor' && <span className="text-red-500">*</span>}
            </Label>
            <Input 
              value={formData.objetivo_pedagogico} 
              onChange={e => setFormData({...formData, objetivo_pedagogico: e.target.value})} 
              placeholder="Ex: Aula prática de pesquisa, desenvolvimento de atividade em grupo..." 
              className="rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium h-10" 
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Extras</Label>
            <Textarea value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} placeholder="Ex: Preciso de adaptador HDMI..." className="min-h-[80px] rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium" />
          </div>

          <DialogFooter className="bg-white p-6 flex flex-col sm:flex-row gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</Button>
            <Button 
              type="submit" 
              disabled={conflictingAulas.length > 0 || isCheckingConflicts || !allAvisosConfirmados}
              className={cn(
                "flex-[2] h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all",
                (conflictingAulas.length > 0 || isCheckingConflicts || !allAvisosConfirmados) && "opacity-50 cursor-not-allowed bg-slate-400 hover:bg-slate-400 shadow-none"
              )}
            >
              {isCheckingConflicts ? "Validando..." : conflictingAulas.length > 0 ? "Conflito de Horário" : !allAvisosConfirmados ? "Confirme os avisos" : "Salvar Agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovaReservaModal;