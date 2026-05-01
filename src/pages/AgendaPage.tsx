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
    <div className="flex flex-col h-screen overflow-hidden bg-white animate-in fade-in duration-500">
      {/* Header Compacto */}
      <header className="flex items-center justify-between h-[100px] px-8 border-b border-slate-200 bg-white shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agenda Escolar Digital</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold text-slate-500">{escola?.nome}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-semibold text-slate-500 capitalize">
              {format(weekDates[0], "d 'de' MMM", { locale: ptBR })} - {format(weekDates[4], "d 'de' MMM", { locale: ptBR })}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg mr-2">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold rounded-md" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
            <div className="flex items-center ml-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => navigateWeek('prev')}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => navigateWeek('next')}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="relative h-10 w-10 text-slate-500 hover:bg-slate-50 rounded-full" aria-label="Notificações">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
          </Button>

          <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95" onClick={() => { setSelectedSlot(null); setIsModalNovaOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova reserva
          </Button>
        </div>
      </header>

      {/* Área de Filtros e Busca */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button 
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-full transition-all",
              !selectedRecurso 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            )}
            onClick={() => setSelectedRecurso(null)}
          >
            Todos
          </button>
          {schoolRecursos.map(r => (
            <button 
              key={r.id}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-2 border whitespace-nowrap",
                selectedRecurso === r.id 
                  ? "border-slate-900 bg-white text-slate-900 shadow-sm" 
                  : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
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
              className="pl-9 h-8 w-56 bg-slate-50 border-transparent text-xs focus:bg-white transition-all rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span>Conflito</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Semanal Compacta */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="hidden md:block min-w-[1000px]">
          {/* Cabeçalho de Dias */}
          <div className="grid grid-cols-[130px_repeat(5,1fr)] border-b border-slate-100 bg-white sticky top-0 z-10">
            <div className="h-20 border-r border-slate-100"></div>
            {weekDates.map((date, i) => {
              const isToday = isSameDay(date, new Date());
              return (
                <div key={i} className="h-20 flex flex-col items-center justify-center border-r border-slate-100 last:border-r-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{diasSemana[i].substring(0, 3)}</span>
                  <div className={cn(
                    "mt-1 text-2xl font-black relative",
                    isToday ? "text-blue-600" : "text-slate-900"
                  )}>
                    {format(date, "d")}
                    {isToday && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-600 rounded-full"></div>}
                  </div>
                </div>
              );
            })}
          </div>

      <div className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden hidden md:block">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[140px_repeat(5,1fr)] bg-slate-50/80 border-b border-slate-100 backdrop-blur-sm sticky top-0 z-10">
              <div className="p-5 border-r border-slate-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600 opacity-50" />
              </div>
              {weekDates.map((date, i) => (
                <div key={i} className={cn(
                  "p-5 text-center border-r border-slate-100 last:border-r-0 transition-colors",
                  isSameDay(date, new Date()) && "bg-blue-600/5"
                )}>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{diasSemana[i]}</div>
                  <div className={cn(
                    "mt-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black transition-all",
                    isSameDay(date, new Date()) 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110" 
                      : "text-slate-900"
                  )}>
                    {format(date, "d")}
                  </div>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {horarios.map((h, hIdx) => (
                <div key={hIdx} className={cn(
                  "grid grid-cols-[140px_repeat(5,1fr)]",
                  h.isIntervalo ? "h-10 bg-striped" : "h-[90px]"
                )}>
                  <div className="flex flex-col justify-center items-center p-4 border-r border-slate-100 bg-slate-50/50">
                    <span className="text-xs font-black text-slate-900 tracking-tight">{h.label}</span>
                    {!h.isIntervalo && (
                      <span className="text-[10px] font-bold text-slate-400 mt-1 px-2 py-0.5 bg-white rounded-full border border-slate-100 shadow-sm">
                        {h.inicio} – {h.fim}
                      </span>
                    )}
                  </div>
                  
                  {weekDates.map((date, dIdx) => {
                    if (h.isIntervalo) {
                      return (
                        <div key={dIdx} className="flex items-center justify-center border-r border-slate-100 last:border-r-0 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                          {dIdx === 2 && "Intervalo"}
                        </div>
                      );
                    }

                    const reserva = getReservaForSlot(date, h.aula);
                    const recurso = recursos.find(r => r.id === reserva?.recurso_id);

                    return (
                      <div 
                        key={dIdx} 
                        className={cn(
                          "group relative border-r border-slate-100 last:border-r-0 p-1.5 transition-all cursor-pointer",
                          !reserva && "hover:bg-blue-50/30"
                        )}
                        onClick={() => handleSlotClick(date, h)}
                      >
                        <AnimatePresence mode="wait">
                          {reserva ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="h-full w-full rounded-2xl border-2 p-3 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden"
                              style={{
                                backgroundColor: recurso?.cor_fundo,
                                color: recurso?.cor_texto,
                                borderColor: recurso?.cor_borda
                              }}
                            >
                              <div className="absolute top-0 right-0 p-1 opacity-20">
                                <Monitor className="h-8 w-8 -mr-2 -mt-2" />
                              </div>
                              <p className="text-[11px] font-black leading-tight truncate uppercase tracking-tight">{reserva.nome_professor}</p>
                              <p className="mt-1 text-[10px] font-bold opacity-80 leading-tight truncate flex items-center gap-1">
                                <Users className="h-3 w-3" /> {reserva.turma}
                              </p>
                              <div className="mt-2 inline-block px-1.5 py-0.5 rounded-lg bg-white/20 text-[9px] font-black uppercase tracking-wider">
                                {recurso?.nome}
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                              className="flex h-full w-full items-center justify-center transition-opacity"
                            >
                              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-inner">
                                <Plus className="h-5 w-5 stroke-[3px]" />
                              </div>
                            </motion.div>
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

      <div className="md:hidden space-y-4 pb-24">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50" onClick={() => setCurrentDate(prev => addDays(prev, -1))}>
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="text-center">
            <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
              {format(currentDate, "EEEE", { locale: ptBR })}
            </div>
            <div className="text-lg font-black text-slate-900 leading-tight">
              {format(currentDate, "d 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50" onClick={() => setCurrentDate(prev => addDays(prev, 1))}>
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        <div className="space-y-3">
          {horarios.map((h, idx) => {
            if (h.isIntervalo) {
              return (
                <div key={idx} className="flex items-center justify-center py-3 px-4 bg-striped rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  Intervalo
                </div>
              );
            }

            const reserva = getReservaForSlot(currentDate, h.aula);
            const recurso = recursos.find(r => r.id === reserva?.recurso_id);

            return (
              <motion.div 
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSlotClick(currentDate, h)}
                className={cn(
                  "flex items-stretch rounded-2xl border overflow-hidden transition-all shadow-sm",
                  reserva ? "bg-white border-slate-100" : "bg-slate-50/50 border-dashed border-slate-200"
                )}
              >
                <div className="w-20 flex flex-col items-center justify-center bg-slate-50/80 border-r border-slate-100 py-4">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">{h.label}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{h.inicio}</span>
                </div>
                
                <div className="flex-1 p-4 flex flex-col justify-center">
                  {reserva ? (
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-1.5 h-12 rounded-full"
                        style={{ backgroundColor: recurso?.cor_borda || '#3b82f6' }}
                      ></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-black text-slate-900 truncate tracking-tight">{reserva.nome_professor}</p>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{recurso?.nome}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Users className="h-3 w-3 opacity-70" /> {reserva.turma}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                        <Plus className="h-4 w-4 stroke-[3px]" />
                      </div>
                      <p className="text-xs font-bold italic tracking-tight uppercase tracking-wider opacity-60">Toque para reservar</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={() => { setSelectedSlot(null); setIsModalNovaOpen(true); }}
          className="fixed bottom-24 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-300 flex items-center justify-center z-50 active:scale-90 transition-all border-4 border-white"
        >
          <Plus className="w-8 h-8 stroke-[3px]" />
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
