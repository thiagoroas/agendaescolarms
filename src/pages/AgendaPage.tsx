import React, { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Search, Info, Filter, X, Calendar, Monitor, Users, Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { escolas, recursos, reservas, Reserva, Recurso } from "../data/mockData";
import { horarios, diasSemana } from "../data/horarios";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
      (!selectedRecurso || r.recurso_id === selectedRecurso) &&
      (!searchQuery || 
        r.nome_professor.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.turma.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  const filteredReservationsCount = useMemo(() => {
    const mondayStr = format(monday, "yyyy-MM-dd");
    const fridayStr = format(weekDates[4], "yyyy-MM-dd");
    
    return reservas.filter(r => 
      r.escola_id === user?.escola_id &&
      r.data >= mondayStr && 
      r.data <= fridayStr &&
      (!selectedRecurso || r.recurso_id === selectedRecurso) &&
      (!searchQuery || 
        r.nome_professor.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.turma.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ).length;
  }, [monday, weekDates, selectedRecurso, searchQuery, user?.escola_id]);

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
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500" style={{ backgroundColor: '#f7f8fb' }}>
      {/* Header Compacto - Estilo Cal.com */}
      <header className="flex items-center justify-between h-16 px-8 border-b border-slate-200 bg-white shrink-0 z-20">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Agenda Escolar Digital</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{escola?.nome}</span>
            <span className="text-slate-300">·</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {format(weekDates[0], "d 'de' MMM", { locale: ptBR })} - {format(weekDates[4], "d 'de' MMM", { locale: ptBR })}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-[11px] font-bold rounded-md border-slate-200 hover:bg-slate-50 transition-colors shadow-sm" 
            onClick={() => setCurrentDate(new Date())}
          >
            Hoje
          </Button>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
            <button 
              className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors border-r border-slate-200"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-50 rounded-md relative" aria-label="Notificações">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full ring-2 ring-white"></span>
            </Button>

            <Button className="bg-blue-600 hover:bg-blue-700 h-8 px-3 rounded-md font-bold text-[11px] shadow-sm transition-all active:scale-95 text-white" onClick={() => { setSelectedSlot(null); setIsModalNovaOpen(true); }}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Nova reserva
            </Button>
          </div>
        </div>
      </header>

      {/* Área de Filtros e Busca - Largura Limitada */}
      <div className="w-full flex justify-center bg-white border-b border-slate-200 shrink-0">
        <div className="w-full max-w-[1320px] flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button 
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all border",
                !selectedRecurso 
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
              onClick={() => setSelectedRecurso(null)}
            >
              Todos
            </button>
            {schoolRecursos.map(r => (
              <button 
                key={r.id}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 border whitespace-nowrap",
                  selectedRecurso === r.id 
                    ? "border-slate-900 bg-white text-slate-900 shadow-sm" 
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                )}
                onClick={() => setSelectedRecurso(r.id)}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.cor_borda }}></div>
                {r.nome}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Buscar professor ou turma..." 
                className="pl-9 h-9 w-[300px] bg-slate-50 border-slate-200 text-xs focus:bg-white focus:ring-0 focus:border-slate-400 transition-all rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              <span className="text-slate-900">{filteredReservationsCount} de {reservas.filter(r => r.escola_id === user?.escola_id).length} reservas</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Lab</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span>Projetor</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span>Conflito</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Semanal Compacta - Centralizada */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-[1320px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hidden md:block shrink-0">
          <div className="min-w-[900px]">
            {/* Cabeçalho de Dias */}
            <div className="grid grid-cols-[125px_repeat(5,1fr)] border-b border-slate-200 bg-white sticky top-0 z-10">
              <div className="h-[92px] border-r border-slate-100"></div>
              {weekDates.map((date, i) => {
                const isToday = isSameDay(date, new Date());
                return (
                  <div key={i} className="h-[92px] flex flex-col items-center justify-center border-r border-slate-100 last:border-r-0">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{diasSemana[i].substring(0, 3)}</span>
                    <div className={cn(
                      "mt-1 text-2xl font-bold relative transition-colors",
                      isToday ? "text-blue-600" : "text-slate-900"
                    )}>
                      {format(date, "d")}
                      {isToday && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-600 rounded-full"></div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="divide-y divide-slate-100">
              {horarios.map((h, hIdx) => (
                <div key={hIdx} className={cn(
                  "grid grid-cols-[125px_repeat(5,1fr)]",
                  h.isIntervalo ? "h-[44px] bg-striped" : "h-[80px]"
                )}>
                  <div className="flex flex-col justify-center items-center p-2 border-r border-slate-100 bg-white">
                    <span className="text-[12px] font-bold text-slate-900 tracking-tight uppercase">{h.label}</span>
                    {!h.isIntervalo && (
                      <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                        {h.inicio} – {h.fim}
                      </span>
                    )}
                  </div>
                  
                  {weekDates.map((date, dIdx) => {
                    if (h.isIntervalo) {
                      return (
                        <div key={dIdx} className="flex items-center justify-center border-r border-slate-100 last:border-r-0 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                          {dIdx === 2 && "INTERVALO"}
                        </div>
                      );
                    }

                    const reserva = getReservaForSlot(date, h.aula);
                    const recurso = recursos.find(r => r.id === reserva?.recurso_id);

                    return (
                      <div 
                        key={dIdx} 
                        className={cn(
                          "group relative border-r border-slate-100 last:border-r-0 p-0 transition-all cursor-pointer",
                          !reserva && "hover:bg-blue-50/20"
                        )}
                        onClick={() => handleSlotClick(date, h)}
                      >
                        <AnimatePresence mode="wait">
                          {reserva ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              className="absolute inset-[6px] rounded-[10px] border-l-[3px] p-2.5 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden group/card"
                              style={{
                                backgroundColor: `${recurso?.cor_borda}10`,
                                color: recurso?.cor_texto,
                                borderColor: recurso?.cor_borda
                              }}
                            >
                              <div className="flex items-start gap-2 h-full">
                                <div className="h-6 w-6 rounded-full bg-white/60 flex items-center justify-center text-[11px] font-bold border border-white/50 shrink-0 mt-0.5">
                                  {reserva.nome_professor.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1 h-full flex flex-col justify-center">
                                  <p className="text-[13px] font-semibold leading-tight truncate tracking-tight text-slate-900">{reserva.nome_professor}</p>
                                  <p className="text-[12px] font-medium opacity-80 leading-tight truncate tracking-tight mt-0.5">
                                    {reserva.turma} • {recurso?.nome}
                                  </p>
                                </div>
                              </div>
                              
                              <button 
                                className="absolute top-1.5 right-1.5 p-1 rounded-md hover:bg-black/5 opacity-0 group-hover/card:opacity-100 transition-opacity text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.info("Funcionalidade de exclusão em breve");
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </motion.div>
                          ) : (
                            <div className="absolute inset-[6px] rounded-[10px] border border-dashed border-transparent group-hover:border-blue-300 group-hover:bg-blue-50/40 transition-all flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold text-blue-500 flex items-center gap-1">
                                <Plus className="h-3 w-3" /> Reservar
                              </div>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAB Discreto */}
      <div className="fixed bottom-6 right-8 flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
        <div className="relative">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
          <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
        </div>
        <span className="text-xs font-bold text-slate-700 tracking-tight">2 reservas hoje</span>
      </div>

      {/* Mobile Placeholder (Ajustar se necessário, mas foco foi desktop conforme solicitado) */}
      <div className="md:hidden p-8 text-center text-slate-500 text-sm italic">
        Acesse pelo computador para visualizar a grade completa.
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