import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, School, Info, Hash, Sun, Moon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DetalhesHorarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    escola: string;
    data: string;
    aula: number;
    horarioInicio: string;
    horarioFim: string;
    turno: string;
  } | null;
}

const DetalhesHorarioModal = ({ isOpen, onClose, data }: DetalhesHorarioModalProps) => {
  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95%] p-0 border-none rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 focus:outline-none focus:ring-0">
        <div className="p-8 relative bg-slate-100 text-slate-900 border-b border-slate-200">
          <Badge className="absolute top-4 right-4 bg-red-100 text-red-600 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            Encerrado
          </Badge>
          <div className="flex flex-col gap-1 mt-4">
            <h2 className="text-3xl font-black leading-tight tracking-tight uppercase text-slate-800">Horário encerrado</h2>
            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm tracking-tight">
              <School className="h-4 w-4" />
              <span>{data.escola}</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-white">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <CalendarIcon className="h-3 w-3" /> Data
              </div>
              <p className="text-sm font-black text-slate-900 tracking-tight">
                {format(new Date(data.data + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Hash className="h-3 w-3" /> Aula
              </div>
              <p className="text-sm font-black text-slate-900 tracking-tight">{data.aula}ª Aula</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Clock className="h-3 w-3" /> Horário
              </div>
              <p className="text-sm font-black text-slate-900 tracking-tight">
                {data.horarioInicio} - {data.horarioFim}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {data.turno.toLowerCase() === 'manha' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />} Turno
              </div>
              <p className="text-sm font-black text-slate-900 tracking-tight capitalize">{data.turno}</p>
            </div>
          </div>

          <div className="space-y-3 bg-red-50 p-5 rounded-2xl border border-red-100">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
              <Info className="h-3 w-3" /> Status
            </div>
            <p className="text-sm text-red-700 font-medium leading-relaxed italic">
              Este horário já passou e não pode mais receber novas reservas.
            </p>
          </div>

          <Button onClick={onClose} className="w-full h-12 bg-slate-900 hover:bg-slate-800 rounded-xl font-black uppercase tracking-widest text-white active:scale-95 transition-all">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetalhesHorarioModal;
