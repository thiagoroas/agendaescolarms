import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "../../contexts/AuthContext";
import { Reserva } from "../../data/mockData";
import { useRecursos } from "@/hooks/useRecursos";
import { useReservas } from "@/hooks/useReservas";
import { useHorarios } from "@/hooks/useHorarios";
import { format } from "date-fns";
import { toast } from "sonner";
import { Wrench, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface BloqueioHorarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: { date?: string; aula?: number };
}

const BloqueioHorarioModal = ({ isOpen, onClose, onSuccess, initialData }: BloqueioHorarioModalProps) => {
  const { user, profile, selectedEscolaId } = useAuth();
  const { recursos: allRecursos } = useRecursos();
  const { createReserva, reservas: allReservas } = useReservas();
  const { horarios: escolaHorarios } = useHorarios();

  const currentEscolaId = selectedEscolaId || profile?.escola_id;

  const [formData, setFormData] = useState({
    recursoId: "",
    data: initialData?.date || format(new Date(), "yyyy-MM-dd"),
    aula: initialData?.aula?.toString() || "",
    tipo: "manutencao",
    motivo: "",
    observacao: ""
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        recursoId: "",
        data: initialData?.date || format(new Date(), "yyyy-MM-dd"),
        aula: initialData?.aula?.toString() || "",
        tipo: "manutencao",
        motivo: "",
        observacao: ""
      });
    }
  }, [isOpen, initialData]);

  const recursosEscola = allRecursos.filter(r => r.escola_id === currentEscolaId && r.ativo);
  const horariosAula = escolaHorarios.filter(h => h.tipo === 'aula' && h.ativo).sort((a, b) => a.ordem - b.ordem);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.recursoId || !formData.data || !formData.aula || !formData.motivo) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    // Verificar conflitos com reservas existentes
    const conflito = allReservas.find(r => 
      r.escola_id === currentEscolaId &&
      r.recurso_id === formData.recursoId &&
      r.data === formData.data &&
      Number(r.aula) === Number(formData.aula) &&
      r.status !== 'cancelada'
    );

    if (conflito) {
      toast.error("Já existe uma reserva neste horário. Cancele ou remaneje antes de bloquear.");
      return;
    }

    const h = horariosAula.find(hour => hour.ordem === Number(formData.aula));
    const tipoLabel = {
      manutencao: "Manutenção",
      evento: "Evento Interno",
      indisponivel: "Indisponível",
      outro: "Outro"
    }[formData.tipo] || "Bloqueio";

    const payload: Omit<Reserva, "id" | "criado_em"> = {
      escola_id: currentEscolaId || "",
      recurso_id: formData.recursoId,
      profile_id: user?.id || "admin",
      nome_professor: tipoLabel,
      disciplina: "Bloqueio",
      turma: "N/A",
      data: formData.data,
      turno: h ? (h.turno as "manha" | "tarde") : (Number(formData.aula) <= 4 ? "manha" : "tarde"),
      aula: Number(formData.aula),
      horario: h ? `${h.hora_inicio.substring(0, 5)} – ${h.hora_fim.substring(0, 5)}` : "",
      observacao: formData.motivo + (formData.observacao ? ` - ${formData.observacao}` : ""),
      status: "manutencao" as any
    };

    const result = await createReserva(payload);
    if (result) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95%] p-0 border-none rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
              <Wrench size={24} /> Bloquear Horário
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-300 text-sm font-medium mt-1 opacity-90">Impedir reservas para manutenção ou eventos.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Recurso *</Label>
              <Select value={formData.recursoId} onValueChange={(val) => setFormData(prev => ({ ...prev, recursoId: val }))}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-blue-500">
                  <SelectValue placeholder="Selecione o recurso" />
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
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Data *</Label>
                <Input 
                  type="date" 
                  value={formData.data} 
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  className="h-12 rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Aula *</Label>
                <Select value={formData.aula} onValueChange={(val) => setFormData(prev => ({ ...prev, aula: val }))}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosAula.map(h => (
                      <SelectItem key={h.ordem} value={h.ordem.toString()}>{h.ordem}ª Aula ({h.turno})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Tipo de Bloqueio *</Label>
              <Select value={formData.tipo} onValueChange={(val) => setFormData(prev => ({ ...prev, tipo: val }))}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="evento">Evento Interno</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Motivo *</Label>
              <Input 
                placeholder="Ex: Manutenção preventiva" 
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                className="h-12 rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Observações</Label>
              <Textarea 
                placeholder="Detalhes adicionais (opcional)" 
                value={formData.observacao}
                onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                className="min-h-[80px] rounded-xl border-slate-200"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={18} />
            <p className="text-[11px] text-amber-900 font-bold leading-relaxed">
              Ao bloquear este horário, nenhum professor poderá realizar agendamentos para este recurso nesta data/aula.
            </p>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-0 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[11px]">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 rounded-xl font-bold uppercase tracking-widest text-[11px] text-white">
              Confirmar Bloqueio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BloqueioHorarioModal;