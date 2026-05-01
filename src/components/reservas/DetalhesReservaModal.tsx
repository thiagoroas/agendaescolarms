import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Reserva, Recurso } from "../../data/mockData";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Users, Info, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DetalhesReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva | null;
  recurso: Recurso | null;
  canEdit: boolean;
}

const DetalhesReservaModal = ({ isOpen, onClose, reserva, recurso, canEdit }: DetalhesReservaModalProps) => {
  if (!reserva) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-4">
            <div 
              className="h-12 w-12 rounded-xl border flex items-center justify-center"
              style={{ backgroundColor: recurso?.cor_fundo, color: recurso?.cor_texto, borderColor: recurso?.cor_borda }}
            >
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{reserva.disciplina}</h3>
              <p className="text-sm text-slate-500">{recurso?.nome}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-4 w-4" />
              <span>Professor:</span>
            </div>
            <div className="font-medium text-slate-900">{reserva.nome_professor}</div>

            <div className="flex items-center gap-2 text-slate-600">
              <Users className="h-4 w-4" />
              <span>Turma:</span>
            </div>
            <div className="font-medium text-slate-900">{reserva.turma}</div>

            <div className="flex items-center gap-2 text-slate-600">
              <CalendarIcon className="h-4 w-4" />
              <span>Data:</span>
            </div>
            <div className="font-medium text-slate-900">
              {format(new Date(reserva.data + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4" />
              <span>Horário:</span>
            </div>
            <div className="font-medium text-slate-900">
              {reserva.horario} (Aula {reserva.aula})
            </div>
          </div>

          {reserva.observacao && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <Info className="h-4 w-4" />
                <span>Observações:</span>
              </div>
              <p className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">{reserva.observacao}</p>
            </div>
          )}

          {canEdit && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="destructive" className="flex-1">
                <Trash2 className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetalhesReservaModal;
