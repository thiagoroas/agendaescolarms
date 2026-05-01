import React, { useState, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Search, Bell, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { escolas, recursos, reservas, Reserva, Recurso } from "../data/mockData";
import { horarios, diasSemana } from "../data/horarios";
import { toast } from "sonner";
import NovaReservaModal from "../components/reservas/NovaReservaModal";
import DetalhesReservaModal from "../components/reservas/DetalhesReservaModal";
import "./agenda.css";

const tipoColor = (tipo: string) => {
  switch (tipo) {
    case "laboratorio": return "c-blue";
    case "projetor": return "c-green";
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
    case "projetor": return "var(--accent-green)";
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

  const weekLabel = `${format(weekDates[0], "d 'de' MMM", { locale: ptBR })} – ${format(weekDates[4], "d 'de' MMM", { locale: ptBR })}`;

  return (
    <div className="agenda-proto">
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Agenda Escolar Digital</div>
          <div className="topbar-sub">
            <span>{escola?.nome}</span>
            <span className="dot" />
            <span>{weekLabel}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date())}>Hoje</button>
          <button className="btn-icon" onClick={() => navigateWeek('prev')} aria-label="Semana anterior">
            <ChevronLeft size={16} />
          </button>
          <button className="btn-icon" onClick={() => navigateWeek('next')} aria-label="Próxima semana">
            <ChevronRight size={16} />
          </button>
          <button className="btn-icon" aria-label="Notificações">
            <Bell size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => { setSelectedSlot(null); setIsModalNovaOpen(true); }}>
            <Plus size={16} /> Nova reserva
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
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

        <div className="toolbar-divider" />

        <div className="search">
          <span className="search-icon"><Search size={14} /></span>
          <input
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

      {/* Calendar */}
      <div className="calendar-wrap">
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
                const recurso = recursos.find(r => r.id === reserva?.recurso_id);

                return (
                  <div
                    key={dIdx}
                    className="cal-cell"
                    onClick={() => !reserva && handleSlotClick(date, h)}
                  >
                    {reserva && recurso ? (
                      <button
                        className={`event ${tipoColor(recurso.tipo)}`}
                        onClick={(e) => { e.stopPropagation(); handleSlotClick(date, h); }}
                        title={`${reserva.nome_professor} • ${reserva.turma} • ${recurso.nome}`}
                      >
                        <div className="event-title">
                          <span className="event-avatar" style={{ background: tipoSwatch(recurso.tipo) }}>
                            {initialsOf(reserva.nome_professor)}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {reserva.nome_professor}
                          </span>
                        </div>
                        <div className="event-meta">
                          <span>{reserva.turma}</span>
                          <span>•</span>
                          <span>{recurso.nome}</span>
                        </div>
                        <div className="event-actions">
                          <span
                            className="event-action-btn"
                            role="button"
                            aria-label="Excluir"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Funcionalidade de exclusão em breve");
                            }}
                          >
                            <Trash2 size={12} />
                          </span>
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
