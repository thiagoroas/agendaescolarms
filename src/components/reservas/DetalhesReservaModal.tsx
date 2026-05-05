import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Reserva, Recurso } from "../../data/mockData";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Users, Info, Trash2, Edit, BookOpen, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DetalhesReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (reservaId: string) => void;
  reserva: Reserva | null;
  recurso: Recurso | null;
  canEdit: boolean;
  isPast?: boolean;
}

const DetalhesReservaModal = ({ isOpen, onClose, onDelete, reserva, recurso, canEdit, isPast }: DetalhesReservaModalProps) => {
  if (!reserva) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95%] p-0 border-none rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 focus:outline-none focus:ring-0">
        <div 
          className="p-8 relative text-white"
          style={{ 
            background: `linear-gradient(135deg, ${recurso?.cor_borda} 0%, ${recurso?.cor_texto} 100%)`,
          }}
        >
          <Badge className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            {recurso?.tipo}
          </Badge>
          <div className="flex flex-col gap-1 mt-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-black leading-tight tracking-tight uppercase">
                {isPast ? "Detalhes da Reserva" : reserva.disciplina || "Reserva"}
              </h2>
              {reserva.status && (
                <Badge className={cn(
                  "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border-none w-fit",
                  (reserva.status === "confirmada" || reserva.status === "aprovada") ? "bg-green-500 text-white" :
                  reserva.status === "pendente" ? "bg-amber-500 text-white" :
                  reserva.status === "recusada" ? "bg-red-500 text-white" :
                  reserva.status === "cancelada" ? "bg-slate-500 text-white" :
                  (reserva.status === "manutencao" || reserva.status === "bloqueada") ? "bg-slate-700 text-white" :
                  "bg-blue-500 text-white"
                )}>
                  {reserva.status === "confirmada" ? "Confirmada" : 
                   reserva.status === "aprovada" ? "Aprovada" :
                   reserva.status === "cancelada" ? "Cancelada" :
                   reserva.status === "bloqueada" ? "Bloqueada" :
                   reserva.status === "pendente" ? "Pendente" : reserva.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 opacity-80 font-bold text-sm tracking-tight">
              <span>{recurso?.nome}</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-white">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <User className="h-3 w-3" /> Professor
              </div>
              <p className="text-sm font-black text-slate-900 truncate tracking-tight">
                {reserva.professor?.nome || reserva.nome_professor || "Professor não encontrado"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <BookOpen className="h-3 w-3" /> Disciplina
              </div>
              <p className="text-sm font-black text-slate-900 truncate tracking-tight">
                {reserva.disciplina || reserva.recurso?.nome || "Não informada"}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Users className="h-3 w-3" /> Turma
              </div>
              <p className="text-sm font-black text-slate-900 tracking-tight">{reserva.turma || "Não informada"}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <CalendarIcon className="h-3 w-3" /> Data
              </div>
              <p className="text-sm font-black text-slate-900 tracking-tight">
                {format(new Date(reserva.data + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Clock className="h-3 w-3" /> Horário
              </div>
              <div className="text-sm font-black text-slate-900 tracking-tight">
                <p>Aula {reserva.aula}</p>
                <p className="text-[10px] text-slate-500 font-bold">{reserva.horario}</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <BookOpen className="h-3 w-3" /> Recurso
              </div>
              <p className="text-sm font-black text-slate-900 tracking-tight">
                {reserva.recurso?.nome || recurso?.nome || "Não informado"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Info className="h-3 w-3" /> Status
              </div>
              <p className="text-sm font-black text-slate-900 tracking-tight capitalize">{reserva.status || "Pendente"}</p>
            </div>
          </div>

          {reserva.objetivo_pedagogico && (
            <div className="space-y-3 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                <BookOpen className="h-3 w-3" /> Objetivo Pedagógico
              </div>
              <p className="text-sm text-slate-700 font-medium leading-relaxed italic">"{reserva.objetivo_pedagogico}"</p>
            </div>
          )}

          {reserva.status === 'recusada' && reserva.motivo_cancelamento && (
            <div className="space-y-3 bg-red-50 p-5 rounded-2xl border border-red-100">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
                <AlertCircle className="h-3 w-3" /> Motivo da Recusa
              </div>
              <p className="text-sm text-red-700 font-bold leading-relaxed italic">"{reserva.motivo_cancelamento}"</p>
            </div>
          )}

          {reserva.observacao && (
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Info className="h-3 w-3" /> Observações
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{reserva.observacao}"</p>
            </div>
          )}

          {(reserva.criado_por || reserva.criado_em) && (
            <div className="flex flex-col gap-1 px-1">
              {reserva.criado_por && (
                <p className="text-[10px] text-slate-400 font-medium">
                  Criado por: <span className="font-bold">{reserva.criado_por}</span>
                </p>
              )}
              {reserva.criado_em && (
                <p className="text-[10px] text-slate-400 font-medium">
                  Em: <span className="font-bold">{format(new Date(reserva.criado_em), "dd/MM/yyyy HH:mm")}</span>
                </p>
              )}
            </div>
          )}

          {isPast && (
            <div className="space-y-3 bg-slate-100 p-5 rounded-2xl border border-slate-200 mb-6">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <Info className="h-3 w-3" /> Aviso
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                Esta reserva pertence a um horário já encerrado.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {canEdit && !isPast ? (
              <>
                <Button 
                  variant="ghost" 
                  className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                  onClick={() => {
                    if (reserva) onDelete(reserva.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancelar Reserva
                </Button>
              </>
            ) : (
              <Button onClick={onClose} className="w-full h-12 bg-slate-900 hover:bg-slate-800 rounded-xl font-black uppercase tracking-widest text-white active:scale-95 transition-all">
                Fechar Detalhes
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetalhesReservaModal;
