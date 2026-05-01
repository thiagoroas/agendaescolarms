import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../../contexts/AuthContext";
import { recursos } from "../../data/mockData";
import { horarios } from "../../data/horarios";

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
    data: initialData?.date || "",
    turno: initialData?.turno || "manha",
    recursoId: "",
    aulas: initialData?.aula ? [initialData.aula] : [],
    observacao: ""
  });

  const availableRecursos = recursos.filter(r => r.escola_id === user?.escola_id);
  const availableHorarios = horarios.filter(h => h.turno === formData.turno && !h.isIntervalo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Reserva enviada:", { ...formData, professor: user?.nome });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova reserva</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Professor</Label>
            <Input value={user?.nome} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Disciplina</Label>
              <Input required value={formData.disciplina} onChange={e => setFormData({...formData, disciplina: e.target.value})} />
            </div>
            <div>
              <Label>Turma</Label>
              <Input required placeholder="Ex: 3º A" value={formData.turma} onChange={e => setFormData({...formData, turma: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
          </div>
          <div>
            <Label>Recurso</Label>
            <RadioGroup value={formData.recursoId} onValueChange={v => setFormData({...formData, recursoId: v})} className="grid grid-cols-2 gap-2 mt-2">
              {availableRecursos.map(r => (
                <div key={r.id} className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer hover:bg-slate-50">
                  <RadioGroupItem value={r.id} id={r.id} />
                  <Label htmlFor={r.id} className="cursor-pointer">{r.nome}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label>Turno</Label>
            <RadioGroup value={formData.turno} onValueChange={v => setFormData({...formData, turno: v as any, aulas: []})} className="flex space-x-4 mt-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="manha" id="manha" /><Label htmlFor="manha">Manhã</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="tarde" id="tarde" /><Label htmlFor="tarde">Tarde</Label></div>
            </RadioGroup>
          </div>
          <div>
            <Label>Aulas</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {availableHorarios.map(h => (
                <div key={h.aula} className="flex items-center space-x-2">
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
                  <Label htmlFor={`aula-${h.aula}`}>{h.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">Confirmar agendamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovaReservaModal;
