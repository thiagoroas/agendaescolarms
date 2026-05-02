import React, { useState, useMemo, useEffect } from "react";
import { useAvisos } from "@/hooks/useAvisos";
import { format, addDays, startOfWeek, isSameDay, parseISO, isWithinInterval, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Search, Bell, Trash2, Calendar as CalendarIcon, Info, FileText, CheckCircle, XCircle, LayoutDashboard, ClipboardList, CalendarDays, AlertTriangle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { Reserva, Recurso, AvisoLaboratorio } from "../data/mockData";
import { useEscolas } from "@/hooks/useEscolas";
import { useRecursos } from "@/hooks/useRecursos";
import { useReservas } from "@/hooks/useReservas";
import { getMockEscolas, resetMockData, getMockRecursos, getMockReservas } from "../data/storage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { horarios, diasSemana } from "../data/horarios";
import { toast } from "sonner";
import NovaReservaModal from "../components/reservas/NovaReservaModal";
import DetalhesReservaModal from "../components/reservas/DetalhesReservaModal";
import RelatorioReservasModal from "../components/reservas/RelatorioReservasModal";
import "./agenda.css";

const tipoColor = (tipo: string) => {
  switch (tipo) {
    case "laboratorio": return "c-blue";
    case "projetor":
    case "equipamento": return "c-green";
    case "biblioteca": return "c-amber";
    case "auditorio": return "c-purple";
    case "quadra": return "c-pink";
    case "sala": return "c-amber";
    default: return "c-blue";
  }
};

const tipoSwatch = (tipo: string) => {
  switch (tipo) {
    case "laboratorio": return "var(--accent-blue)";
    case "projetor":
    case "equipamento": return "var(--accent-green)";
    case "biblioteca": return "var(--accent-amber)";
    case "auditorio": return "var(--accent-purple)";
    case "quadra": return "var(--accent-pink)";
    case "sala": return "var(--accent-amber)";
    default: return "var(--accent-blue)";
  }
};

const initialsOf = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join("");

const AgendaPage = () => {
  const { user, profile, selectedEscolaId } = useAuth();
  const { escolas: allEscolas, loading: loadingEscolas } = useEscolas();
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    // Se for final de semana (Sábado=6, Domingo=0), inicia na Segunda-feira da próxima semana
    if (day === 0 || day === 6) {
      return addDays(today, (8 - day) % 7);
    }
    return today;
  });
  const [selectedRecurso, setSelectedRecurso] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const { reservas: reservasState, cancelReserva, refresh: refreshReservas } = useReservas();
  const { recursos: schoolRecursos, loading: loadingRecursos } = useRecursos();
  const { avisos: avisosState, loading: loadingAvisos } = useAvisos();
  const [isModalNovaOpen, setIsModalNovaOpen] = useState(false);
  const [isModalRelatorioOpen, setIsModalRelatorioOpen] = useState(false);
  const [showAllAvisos, setShowAllAvisos] = useState(false);
  
  // Avisos are now loaded via useAvisos hook

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [isModalDetalhesOpen, setIsModalDetalhesOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{date: string, aula: number, turno: "manha" | "tarde"} | null>(null);
  const [activeReserva, setActiveReserva] = useState<{reserva: Reserva, recurso: Recurso} | null>(null);

  const currentSchoolId = selectedEscolaId || profile?.escola_id;

  const reservasHoje = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return reservasState.filter(r => 
      r.escola_id === currentSchoolId && 
      r.data === todayStr
    );
  }, [currentSchoolId, reservasState]);

  const schoolEscolas = allEscolas;
  const escola = schoolEscolas.find(e => e.id === currentSchoolId);
  const schoolRecursosList = schoolRecursos;


  const monday = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDates = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      // No mobile, navega dia a dia. No desktop, navega semana a semana (7 dias).
      const step = isMobile ? 1 : 7;
      return addDays(prev, direction === 'prev' ? -step : step);
    });
  };

  const getReservaForSlot = (date: Date, aula: number) => {
    if (!date) return null;
    const dateStr = format(date, "yyyy-MM-dd");
    return reservasState.find(r =>
      r.data === dateStr &&
      r.aula === aula &&
      r.escola_id === currentSchoolId &&
      (r.status === "confirmada" || r.status === "aprovada" || r.status === "pendente" || r.status === "manutencao" || r.status === "bloqueada") &&
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
    
    return reservasState.filter(r =>
      r.escola_id === currentSchoolId &&
      r.data >= mondayStr &&
      r.data <= fridayStr &&
      (!selectedRecurso || r.recurso_id === selectedRecurso) &&
      (!searchQuery ||
        r.nome_professor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.turma.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ).length;
  }, [monday, weekDates, selectedRecurso, searchQuery, currentSchoolId, reservasState]);

  const avisosAtivos = useMemo(() => {
    const agora = new Date();
    const hojeStr = format(agora, "yyyy-MM-dd");
    const horaAtualStr = format(agora, "HH:mm");

    return avisosState.filter(a => {
      if (!a.ativo || a.escola_id !== currentSchoolId || !a.exibir_na_agenda) return false;
      
      const dentroData = hojeStr >= a.data_inicio && hojeStr <= a.data_fim;
      if (!dentroData) return false;

      if (a.hora_inicio && a.hora_fim) {
        return horaAtualStr >= a.hora_inicio && horaAtualStr <= a.hora_fim;
      }

      return true;
    }).sort((a, b) => {
      const prioridade = { urgente: 0, atencao: 1, informativo: 2 };
      return prioridade[a.tipo] - prioridade[b.tipo];
    });
  }, [avisosState, currentSchoolId]);

  const handleSlotClick = (date: Date, h: typeof horarios[0]) => {
    const res = getReservaForSlot(date, h.aula);
    if (res) {
      const rec = schoolRecursosList.find(r => r.id === res.recurso_id);
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

  const handleExcluirReserva = async (reservaId: string) => {
    const reservaParaExcluir = reservasState.find(r => r.id === reservaId);
    if (!reservaParaExcluir) return;

    // Verificar permissões
    const canDelete = 
      profile?.role === 'admin_plataforma' || 
      (profile?.role === 'admin_lab' && reservaParaExcluir.escola_id === profile.escola_id) ||
      (profile?.role === 'professor' && reservaParaExcluir.profile_id === user?.id);

    if (!canDelete) {
      toast.error("Você não tem permissão para excluir esta reserva.");
      return;
    }

    if (window.confirm("Tem certeza que deseja cancelar esta reserva?")) {
      await cancelReserva(reservaId);
      setIsModalDetalhesOpen(false);
    }
  };

  const weekLabel = `${format(monday, "d 'de' MMM", { locale: ptBR })} – ${format(weekDates[4], "d 'de' MMM", { locale: ptBR })}`;

  return (
    <div className="agenda-proto overflow-y-auto pb-24 md:pb-8">
      {/* Topbar */}
      <div className="topbar">
        <div className="flex-1">
          <div className="topbar-title">Agenda Escolar Digital</div>
          <div className="topbar-sub flex flex-wrap gap-x-3">
            <span className="truncate">{escola?.nome}</span>
            <span className="dot hidden sm:block" />
            <span className="font-bold text-slate-900 whitespace-nowrap">{isMobile ? format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR }) : weekLabel}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date())}>Hoje</button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="btn btn-ghost gap-2 px-3">
                <CalendarDays size={16} className="text-blue-600" />
                <span className="hidden sm:inline">Data</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1">
            <button className="btn-icon" onClick={() => navigateWeek('prev')} aria-label={isMobile ? "Dia anterior" : "Semana anterior"}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn-icon" onClick={() => navigateWeek('next')} aria-label={isMobile ? "Próximo dia" : "Próxima semana"}>
              <ChevronRight size={16} />
            </button>
          </div>
          <button className="btn-icon relative" aria-label="Notificações">
            <Bell size={16} />
            {reservasHoje.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {reservasHoje.length}
              </span>
            )}
          </button>
          {!isMobile && (
            <div className="flex items-center gap-2">
              {(profile?.role === 'admin_plataforma' || profile?.role === 'admin_lab') && (
                <button className="btn btn-outline gap-2" onClick={() => setIsModalRelatorioOpen(true)}>
                  <FileText size={16} /> Relatório
                </button>
              )}
              <button className="btn btn-primary" onClick={() => { setSelectedSlot(null); setIsModalNovaOpen(true); }}>
                <Plus size={16} /> Nova reserva
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-2 px-2 w-full sm:w-auto">
          <button
            className={`chip ${!selectedRecurso ? 'active' : ''}`}
            onClick={() => setSelectedRecurso(null)}
          >
            Todos
          </button>
          {schoolRecursos.map(r => (
            <button
              key={r.id}
              className={`chip ${selectedRecurso === r.id ? 'active' : ''}`}
              onClick={() => setSelectedRecurso(r.id)}
            >
              <span className="chip-dot" style={{ background: r.cor_borda }} />
              {r.nome}
            </button>
          ))}
        </div>

        {!isMobile && <div className="toolbar-divider" />}

        <div className="search w-full sm:w-auto mt-2 sm:mt-0">
          <span className="search-icon"><Search size={14} /></span>
          <input
            className="w-full sm:w-[220px]"
            placeholder="Buscar professor, turma…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-meta">
          <span><strong>{filteredReservationsCount}</strong> reservas</span>
          <div className="legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--accent-blue)' }} />Lab</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--accent-green)' }} />Projetor</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--danger)' }} />Conflito</span>
          </div>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Modo Protótipo Ativo:</span> As alterações feitas aqui (reservas, exclusões, etc.) são salvas localmente no seu navegador.
            </div>
          </div>
          {profile?.role === "admin_plataforma" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-[10px] font-bold border-amber-200 text-amber-700 hover:bg-amber-100"
              onClick={resetMockData}
            >
              Resetar dados demo
            </Button>
          )}
        </div>
      )}

      {/* Banner de Avisos */}
      {avisosAtivos.length > 0 && (
        <div className="mx-4 mb-4 space-y-2">
          {avisosAtivos.slice(0, showAllAvisos ? undefined : 1).map((aviso) => (
            <div 
              key={aviso.id}
              className={cn(
                "p-4 rounded-2xl border flex items-start gap-4 shadow-sm animate-in slide-in-from-top duration-300",
                aviso.tipo === "urgente" ? "bg-red-50 border-red-100 text-red-900" :
                aviso.tipo === "atencao" ? "bg-amber-50 border-amber-100 text-amber-900" :
                "bg-blue-50 border-blue-100 text-blue-900"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl shrink-0",
                aviso.tipo === "urgente" ? "bg-red-100 text-red-600" :
                aviso.tipo === "atencao" ? "bg-amber-100 text-amber-600" :
                "bg-blue-100 text-blue-600"
              )}>
                {aviso.tipo === "urgente" ? <AlertTriangle size={18} /> : <Info size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-black uppercase tracking-tight">{aviso.titulo}</h4>
                  {avisosAtivos.length > 1 && !showAllAvisos && (
                    <button 
                      onClick={() => setShowAllAvisos(true)}
                      className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline"
                    >
                      Ver todos ({avisosAtivos.length}) <ChevronDown size={12} />
                    </button>
                  )}
                  {showAllAvisos && aviso.id === avisosAtivos[0].id && (
                    <button 
                      onClick={() => setShowAllAvisos(false)}
                      className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline"
                    >
                      Recolher
                    </button>
                  )}
                </div>
                <p className="text-xs font-medium opacity-80 mt-0.5">{aviso.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div className="calendar-wrap">
        {!isMobile ? (
          <div className="calendar">
            <div className="cal-header">
              <div className="cal-header-cell" />
              {weekDates.map((date, i) => {
                const isToday = isSameDay(date, new Date());
                return (
                  <div key={i} className={`cal-header-cell ${isToday ? 'today' : ''}`}>
                    <div className="cal-day-label">{diasSemana[i].substring(0, 3)}</div>
                    <div className={`cal-day-num ${isToday ? 'today' : ''}`}>{format(date, "d")}</div>
                  </div>
                );
              })}
            </div>

            {horarios.map((h, hIdx) => (
              <div key={hIdx} className={`cal-row ${h.isIntervalo ? 'break' : ''}`}>
                <div className="cal-time">
                  <div className="cal-time-label">{h.label}</div>
                  {!h.isIntervalo && <div className="cal-time-range">{h.inicio}</div>}
                </div>

                {weekDates.map((date, dIdx) => {
                  if (h.isIntervalo) {
                    return (
                      <div key={dIdx} className="cal-cell break-cell">
                        {dIdx === 2 && <div className="break-label">Intervalo</div>}
                      </div>
                    );
                  }

                  const reserva = getReservaForSlot(date, h.aula);
                  const recurso = schoolRecursosList.find(r => r.id === reserva?.recurso_id);

                  return (
                    <div
                      key={dIdx}
                      className="cal-cell"
                      onClick={() => !reserva && handleSlotClick(date, h)}
                    >
                      {reserva && recurso ? (
                        <button
                          className={cn(
                            "event", 
                            tipoColor(recurso.tipo),
                            reserva.status === "pendente" && "border-amber-400 border-2 shadow-amber-100"
                          )}
                          onClick={(e) => { e.stopPropagation(); handleSlotClick(date, h); }}
                          title={`${reserva.nome_professor} • ${reserva.turma} • ${recurso.nome} (${reserva.status})`}
                        >
                          <div className="event-title">
                            <span className="event-avatar" style={{ background: tipoSwatch(recurso.tipo) }}>
                              {initialsOf(reserva.nome_professor)}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="truncate leading-tight">{reserva.nome_professor}</span>
                              {reserva.status === "pendente" && (
                                <span className="text-[8px] font-black uppercase text-amber-600 tracking-tighter">Pendente</span>
                              )}
                            </div>
                          </div>
                          <div className="event-meta">
                            <span>{reserva.turma}</span>
                            <span>•</span>
                            <span>{recurso.nome}</span>
                          </div>
                          <div className="event-actions">
                            {(profile?.role === 'admin_plataforma' || 
                              (profile?.role === 'admin_lab' && reserva.escola_id === profile.escola_id) ||
                              (profile?.role === 'professor' && reserva.professor_id === user?.id)) && (
                              <span
                                className="event-action-btn"
                                role="button"
                                aria-label="Excluir"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExcluirReserva(reserva.id);
                                }}
                              >
                                <Trash2 size={12} />
                              </span>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className="add-hint">
                          <Plus size={14} /> Reservar
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="mobile-timeline">
            <div className="mobile-day-header">
              <div className="flex items-center gap-3">
                <CalendarIcon size={20} className="text-blue-600" />
                <span className="mobile-day-label">
                  {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
              <button 
                className="text-[11px] font-black uppercase tracking-widest text-blue-600 px-2 py-1 rounded-md bg-blue-50"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </button>
            </div>

            {horarios.map((h, hIdx) => {
              const reserva = getReservaForSlot(currentDate, h.aula);
              const recurso = schoolRecursosList.find(r => r.id === reserva?.recurso_id);

              return (
                <div key={hIdx} className={`mobile-slot ${h.isIntervalo ? 'is-break' : ''}`}>
                  <div className="mobile-slot-time">
                    <span className="mobile-slot-label">{h.label.replace("Aula ", "A")}</span>
                    <span className="mobile-slot-hour">{h.inicio}</span>
                  </div>
                  <div className="mobile-slot-content">
                    {h.isIntervalo ? (
                      <span className="break-label text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Intervalo</span>
                    ) : reserva && recurso ? (
                      <button 
                        className={`mobile-card-event ${tipoColor(recurso.tipo)}`}
                        onClick={() => handleSlotClick(currentDate, h)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="event-avatar" style={{ background: tipoSwatch(recurso.tipo), width: '22px', height: '22px', fontSize: '10px' }}>
                            {initialsOf(reserva.nome_professor)}
                          </span>
                          <span className="text-[13px] font-bold text-slate-900 leading-none">{reserva.nome_professor}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-auto">
                          <span className="text-[11px] font-medium bg-white/50 px-2 py-0.5 rounded-md">{reserva.turma}</span>
                          <span className="text-[11px] font-medium text-slate-500">• {recurso.nome}</span>
                        </div>
                      </button>
                    ) : (
                      <button 
                        className="mobile-card-available"
                        onClick={() => handleSlotClick(currentDate, h)}
                      >
                        <Plus size={14} className="mr-2 text-blue-400" />
                        Disponível — toque para reservar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isMobile && (
        <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-50">
          {(profile?.role === 'admin_plataforma' || profile?.role === 'admin_lab') && (
            <button 
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 border border-slate-200"
              onClick={() => setIsModalRelatorioOpen(true)}
              aria-label="Relatório"
            >
              <FileText size={20} />
            </button>
          )}
          <button 
            className="w-14 h-14 rounded-full bg-blue-600 shadow-lg flex items-center justify-center text-white"
            onClick={() => { setSelectedSlot(null); setIsModalNovaOpen(true); }}
            aria-label="Nova reserva"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      <NovaReservaModal
        isOpen={isModalNovaOpen}
        onClose={() => { setIsModalNovaOpen(false); setSelectedSlot(null); }}
        initialData={selectedSlot || undefined}
      />

      <DetalhesReservaModal
        isOpen={isModalDetalhesOpen}
        onClose={() => setIsModalDetalhesOpen(false)}
        onDelete={handleExcluirReserva}
        reserva={activeReserva?.reserva || null}
        recurso={activeReserva?.recurso || null}
        canEdit={activeReserva?.reserva.professor_id === user?.id || profile?.role !== 'professor'}
      />

      <RelatorioReservasModal
        isOpen={isModalRelatorioOpen}
        onClose={() => setIsModalRelatorioOpen(false)}
        reservas={reservasState}
        recursos={schoolRecursosList}
        escolas={schoolEscolas}
        selectedEscolaId={currentSchoolId}
      />
    </div>
  );
};

export default AgendaPage;
