import React, { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Search, Info, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { escolas, recursos, reservas, Reserva, Recurso } from "../data/mockData";
import { horarios, diasSemana } from "../data/horarios";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import NovaReservaModal from "../components/reservas/NovaReservaModal";
import DetalhesReservaModal from "../components/reservas/DetalhesReservaModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AgendaPage = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRecurso, setSelectedRecurso] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalNovaOpen, setIsModalNovaOpen] = useState(false);
  const [isModalDetalhesOpen, setIsModalDetalhesOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{date: string, aula: number, turno: "manha" | "tarde"} | null>(null);
  const [activeReserva, setActiveReserva] = useState<{reserva: Reserva, recurso: Recurso} | null>(null);

  const escola = escolas.find(e => e.id === user?.escola_id);
  const schoolRecursos = recursos.filter(r => r.escola_id === user?.escola_id);
  
  const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(monday, i));

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'prev' ? -7 : 7));
  };

  const getReservaForSlot = (date: Date, aula: number) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return reservas.find(r => 
      r.data === dateStr && 
      r.aula === aula && 
      r.escola_id === user?.escola_id &&
      (!selectedRecurso || r.recurso_id === selectedRecurso)
    );
  };

  const handleSlotClick = (date: Date, h: typeof horarios[0]) => {
    const res = getReservaForSlot(date, h.aula);
    if (res) {
      const rec = recursos.find(r => r.id === res.recurso_id);
      setActiveReserva({ reserva: res, recurso: rec! });
      setIsModalDetalhesOpen(true);
    } else {
      setSelectedSlot({
        date: format(date, "yyyy-MM-dd"),
        aula: h.aula,
        turno: h.turno
      });
      setIsModalNovaOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda Escolar Digital</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold">{escola?.nome}</span>
            <span>•</span>
            <span className="capitalize">{format(weekDates[0], "d 'de' MMM", { locale: ptBR })} - {format(weekDates[4], "d 'de' MMM", { locale: ptBR })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setSelectedSlot(null); setIsModalNovaOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova reserva
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge 
          variant="outline" 
          className={cn(
            "cursor-pointer px-4 py-1.5 text-xs transition-all",
            !selectedRecurso ? "bg-slate-200 text-slate-900 border-slate-300" : "bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200"
          )}
          onClick={() => setSelectedRecurso(null)}
        >
          Todos
        </Badge>
        {schoolRecursos.map(r => (
          <Badge 
            key={r.id}
            variant="outline"
            style={{ 
              backgroundColor: selectedRecurso === r.id ? r.cor_fundo : '#f1f5f9',
              color: selectedRecurso === r.id ? r.cor_texto : '#64748b',
              borderColor: selectedRecurso === r.id ? r.cor_borda : 'transparent'
            }}
            className={cn(
              "cursor-pointer px-4 py-1.5 text-xs transition-all",
              selectedRecurso === r.id ? "opacity-100" : "opacity-70 hover:opacity-100"
            )}
            onClick={() => setSelectedRecurso(r.id)}
          >
            {r.nome}
          </Badge>
        ))}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden overflow-x-auto hidden md:block">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[120px_repeat(5,1fr)] border-b bg-slate-50/50">
            <div className="p-4 border-r"></div>
            {weekDates.map((date, i) => (
              <div key={i} className={cn(
                "p-4 text-center border-r last:border-r-0",
                isSameDay(date, new Date()) && "bg-blue-50/50"
              )}>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{diasSemana[i]}</div>
                <div className={cn(
                  "mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold",
                  isSameDay(date, new Date()) ? "bg-blue-600 text-white" : "text-slate-900"
                )}>
                  {format(date, "d")}
                </div>
              </div>
            ))}
          </div>

          <div className="divide-y">
            {horarios.map((h, hIdx) => (
              <div key={hIdx} className={cn(
                "grid grid-cols-[120px_repeat(5,1fr)]",
                h.isIntervalo ? "h-8 bg-slate-50" : "h-[70px]"
              )}>
                <div className="flex flex-col justify-center p-3 border-r bg-slate-50/30">
                  <span className="text-xs font-bold text-slate-900">{h.label}</span>
                  {!h.isIntervalo && <span className="text-[10px] text-slate-500">{h.inicio} – {h.fim}</span>}
                </div>
                
                {weekDates.map((date, dIdx) => {
                  if (h.isIntervalo) {
                    return (
                      <div key={dIdx} className="flex items-center justify-center border-r last:border-r-0 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                        Intervalo
                      </div>
                    );
                  }

                  const reserva = getReservaForSlot(date, h.aula);
                  const recurso = recursos.find(r => r.id === reserva?.recurso_id);

                  return (
                    <div 
                      key={dIdx} 
                      className="group relative border-r last:border-r-0 p-1 transition-colors hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleSlotClick(date, h)}
                    >
                      {reserva ? (
                        <div 
                          className="h-full w-full rounded-lg border p-2 text-left shadow-sm transition-transform hover:scale-[1.02]"
                          style={{
                            backgroundColor: recurso?.cor_fundo,
                            color: recurso?.cor_texto,
                            borderColor: recurso?.cor_borda
                          }}
                        >
                          <p className="text-[10px] font-bold leading-tight truncate">{reserva.nome_professor}</p>
                          <p className="mt-0.5 text-[9px] opacity-80 leading-tight truncate">{reserva.turma} • {recurso?.nome}</p>
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <Plus className="h-5 w-5 text-blue-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-4 pb-20">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, -1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <div className="text-sm font-bold text-blue-600 uppercase tracking-wide">
              {format(currentDate, "EEEE", { locale: ptBR })}
            </div>
            <div className="text-lg font-bold text-slate-900">
              {format(currentDate, "d 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addDays(prev, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3">
          {horarios.map((h, idx) => {
            if (h.isIntervalo) {
              return (
                <div key={idx} className="flex items-center justify-center py-2 px-4 bg-slate-100 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Intervalo
                </div>
              );
            }

            const reserva = getReservaForSlot(currentDate, h.aula);
            const recurso = recursos.find(r => r.id === reserva?.recurso_id);

            return (
              <div 
                key={idx}
                onClick={() => handleSlotClick(currentDate, h)}
                className={cn(
                  "flex items-stretch rounded-xl border shadow-sm overflow-hidden transition-all active:scale-[0.98]",
                  reserva ? "bg-white" : "bg-slate-50/50 border-dashed"
                )}
              >
                <div className="w-20 flex flex-col items-center justify-center bg-slate-50 border-r py-3">
                  <span className="text-xs font-bold text-slate-900">{h.label}</span>
                  <span className="text-[10px] text-slate-500 mt-1">{h.inicio}</span>
                </div>
                
                <div className="flex-1 p-3 flex flex-col justify-center">
                  {reserva ? (
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-1 bg-blue-600 rounded-full"
                        style={{ backgroundColor: recurso?.cor_texto }}
                      ></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{reserva.nome_professor}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{reserva.turma} • {recurso?.nome}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 font-medium italic">Disponível — toque para reservar</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => { setSelectedSlot(null); setIsModalNovaOpen(true); }}
          className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-200 flex items-center justify-center z-50 active:scale-95 transition-transform md:hidden"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <NovaReservaModal 
        isOpen={isModalNovaOpen} 
        onClose={() => { setIsModalNovaOpen(false); setSelectedSlot(null); }} 
        initialData={selectedSlot || undefined}
      />

      <DetalhesReservaModal 
        isOpen={isModalDetalhesOpen} 
        onClose={() => setIsModalDetalhesOpen(false)}
        reserva={activeReserva?.reserva || null}
        recurso={activeReserva?.recurso || null}
        canEdit={activeReserva?.reserva.professor_id === user?.id || user?.papel !== 'professor'}
      />
    </div>
  );
};

export default AgendaPage;
