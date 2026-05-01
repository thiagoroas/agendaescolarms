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
      <DialogContent className="max-w-lg w-full mx-auto md:mx-0 overflow-y-auto max-h-[95vh] sm:max-h-[90vh] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Nova reserva</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Professor</Label>
            <Input value={user?.nome} disabled className="bg-slate-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Input required value={formData.disciplina} onChange={e => setFormData({...formData, disciplina: e.target.value})} placeholder="Ex: Matemática" className="h-12 md:h-10" />
            </div>
            <div className="space-y-2">
              <Label>Turma</Label>
              <Input required placeholder="Ex: 3º A" value={formData.turma} onChange={e => setFormData({...formData, turma: e.target.value})} className="h-12 md:h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            {initialData?.date ? (
              <div className="p-3 border rounded-md bg-blue-50 text-blue-800 font-medium text-sm capitalize">
                {formattedDate}
              </div>
            ) : (
              <Input type="date" required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="h-12 md:h-10" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Recurso</Label>
            <RadioGroup value={formData.recursoId} onValueChange={v => setFormData({...formData, recursoId: v})} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {availableRecursos.map(r => (
                <div key={r.id} className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <RadioGroupItem value={r.id} id={`rec-${r.id}`} />
                  <Label htmlFor={`rec-${r.id}`} className="cursor-pointer flex-1 text-sm font-medium">{r.nome}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Turno</Label>
            <RadioGroup value={formData.turno} onValueChange={v => setFormData({...formData, turno: v as any, aulas: []})} className="flex space-x-6 mt-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="manha" id="manha" /><Label htmlFor="manha" className="text-base sm:text-sm">Manhã</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="tarde" id="tarde" /><Label htmlFor="tarde" className="text-base sm:text-sm">Tarde</Label></div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Aulas</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {availableHorarios.map(h => (
                <div key={h.aula} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50">
                  <Checkbox 
                    id={`aula-${h.aula}`}
                    checked={formData.aulas.includes(h.aula)}
                    className="h-5 w-5"
                    onCheckedChange={(checked) => {
                      const newAulas = checked 
                        ? [...formData.aulas, h.aula] 
                        : formData.aulas.filter(a => a !== h.aula);
                      setFormData({...formData, aulas: newAulas});
                    }}
                  />
                  <Label htmlFor={`aula-${h.aula}`} className="text-sm cursor-pointer font-medium">{h.label} ({h.inicio} - {h.fim})</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações (Opcional)</Label>
            <Textarea value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} placeholder="Alguma observação importante..." className="min-h-[80px]" />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base">Confirmar agendamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovaReservaModal;