import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMockReservas, getMockRecursos, getMockEscolas } from "../data/storage";
import { Reserva, Recurso, Escola } from "../data/mockData";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  FileText,
  User,
  Monitor,
  LayoutDashboard,
  Bell,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { user, profile, selectedEscolaId } = useAuth();
  const navigate = useNavigate();
  const [todasReservas, setTodasReservas] = useState<Reserva[]>([]);
  const [todosRecursos, setTodosRecursos] = useState<Recurso[]>([]);
  const [todasEscolas, setTodasEscolas] = useState<Escola[]>([]);

  useEffect(() => {
    setTodasReservas(getMockReservas());
    setTodosRecursos(getMockRecursos());
    setTodasEscolas(getMockEscolas());
  }, []);
  
  const currentEscolaId = selectedEscolaId || profile?.escola_id;
  
  const escolaAtiva = todasEscolas.find(e => e.id === currentEscolaId);
  const recursosEscola = todosRecursos.filter(r => r.escola_id === currentEscolaId);
  
  const hojeStr = format(new Date(), "yyyy-MM-dd");
  
  const reservasEscola = useMemo(() => {
    return todasReservas.filter(r => r.escola_id === currentEscolaId);
  }, [todasReservas, currentEscolaId]);

  const reservasHoje = useMemo(() => {
    let list = reservasEscola.filter(r => r.data === hojeStr);
    if (profile?.role === "professor") {
      list = list.filter(r => r.professor_id === user?.id);
    }
    return list.sort((a, b) => a.aula - b.aula);
  }, [reservasEscola, hojeStr, profile?.role, user?.id]);

  const proximasReservas = useMemo(() => {
    let list = reservasEscola.filter(r => {
      const rDate = parseISO(r.data);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return rDate >= hoje;
    });
    
    if (profile?.role === "professor") {
      list = list.filter(r => r.professor_id === user?.id);
    }
    
    return list.sort((a, b) => a.data.localeCompare(b.data) || a.aula - b.aula).slice(0, 5);
  }, [reservasEscola, profile?.role, user?.id]);

  const alertas = useMemo(() => {
    return reservasEscola.filter(r => r.status === "manutencao" || r.status === "bloqueada");
  }, [reservasEscola]);

  const recursosEmUsoHoje = useMemo(() => {
    const ids = new Set(reservasHoje.filter(r => r.status === "confirmada" || r.status === "aprovada").map(r => r.recurso_id));
    return recursosEscola.filter(r => ids.has(r.id));
  }, [reservasHoje, recursosEscola]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
      case "aprovada": return "bg-green-500";
      case "pendente": return "bg-amber-500";
      case "recusada": return "bg-red-500";
      case "cancelada": return "bg-slate-400";
      case "manutencao":
      case "bloqueada": return "bg-slate-600";
      default: return "bg-blue-500";
    }
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Hoje na Escola</h1>
            <p className="text-sm font-medium text-slate-500 truncate max-w-[200px] sm:max-w-none">
              {escolaAtiva?.nome || "Carregando..."} · {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => navigate("/agenda")} 
            className="bg-blue-600 hover:bg-blue-700 h-11 px-5 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-blue-100 transition-all hover:scale-105"
          >
            <Calendar className="mr-2 h-4 w-4" /> Agenda Completa
          </Button>
        </div>
      </header>

      {/* Grid de Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="rounded-3xl border-none shadow-sm bg-blue-50/50 hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-blue-100 transition-all group cursor-pointer"
          onClick={() => {
            if (profile?.role === "professor") {
              navigate("/minhas-reservas");
            } else {
              navigate("/agenda");
            }
          }}
          aria-label="Ver agendamentos de hoje"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Calendar size={20} />
              </div>
              <Badge className="bg-blue-600 text-white border-none font-black">{reservasHoje.length}</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Reservas de Hoje</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">Agendamentos</h3>
          </CardContent>
        </Card>

        <Card 
          className="rounded-3xl border-none shadow-sm bg-emerald-50/50 hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-100 transition-all group cursor-pointer"
          onClick={() => {
            if (profile?.role === "professor") {
              navigate("/agenda");
            } else {
              navigate("/admin/recursos");
            }
          }}
          aria-label="Ver recursos e equipamentos"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Monitor size={20} />
              </div>
              <Badge className="bg-emerald-600 text-white border-none font-black">{recursosEmUsoHoje.length}</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Recursos em Uso</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">Equipamentos</h3>
          </CardContent>
        </Card>

        <Card 
          className="rounded-3xl border-none shadow-sm bg-amber-50/50 hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-amber-100 transition-all group cursor-pointer"
          onClick={() => {
            if (profile?.role === "professor") {
              navigate("/minhas-reservas");
            } else {
              navigate("/admin/aprovacoes");
            }
          }}
          aria-label="Ver solicitações pendentes"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Bell size={20} />
              </div>
              <Badge className="bg-slate-600 text-white border-none font-black">{alertas.length}</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bloqueios</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">Manutenção</h3>
          </CardContent>
        </Card>

        <Card 
          className="rounded-3xl border-none shadow-sm bg-indigo-50/50 hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-indigo-100 transition-all group cursor-pointer"
          onClick={() => {
            if (profile?.role === "professor") {
              navigate("/minhas-reservas");
            } else {
              navigate("/admin/reservas");
            }
          }}
          aria-label="Ver relatórios de reservas"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Meus Relatórios</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">Consultar</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Próximas Reservas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Clock className="text-blue-600" size={20} />
              Próximos Agendamentos
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs font-bold text-blue-600" 
              onClick={() => {
                if (profile?.role === "professor") {
                  navigate("/minhas-reservas");
                } else {
                  navigate("/admin/reservas");
                }
              }}
            >
              Ver todos
            </Button>
          </div>
          
          <div className="space-y-3">
            {proximasReservas.length > 0 ? (
              proximasReservas.map(res => {
                const rec = todosRecursos.find(r => r.id === res.recurso_id);
                return (
                  <Card key={res.id} className="rounded-2xl border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center min-w-[60px] h-16 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{format(parseISO(res.data), "MMM", { locale: ptBR })}</span>
                        <span className="text-lg font-black text-slate-900 leading-none">{format(parseISO(res.data), "dd")}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-black text-slate-900 truncate">{res.disciplina}</h4>
                          <Badge className={cn("text-[8px] font-black border-none text-white", getStatusColor(res.status))}>
                            {res.status}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          <User size={12} className="text-slate-300" /> {res.nome_professor} · {res.turma}
                        </p>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                          <Monitor size={12} className="text-slate-200" /> {rec?.nome} · Aula {res.aula}
                        </p>
                      </div>
                      
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600" onClick={() => navigate("/agenda")}>
                        <Plus className="h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                <p className="text-slate-400 font-medium">Nenhuma reserva encontrada para os próximos dias.</p>
                <Button variant="link" className="text-blue-600 font-black mt-2 uppercase tracking-widest text-[10px]" onClick={() => navigate("/agenda")}>
                  Fazer meu primeiro agendamento
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar do Dashboard: Resumo e Alertas */}
        <div className="space-y-8">
          {/* Status dos Recursos */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2">Recursos da Escola</h2>
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              {recursosEscola.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: r.cor_borda }} />
                    <span className="text-xs font-bold text-slate-700">{r.nome}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 border-slate-100">
                    {r.tipo}
                  </Badge>
                </div>
              ))}
              {recursosEscola.length > 5 && (
                <p className="text-[10px] text-center font-bold text-blue-600 cursor-pointer hover:underline pt-2">Ver todos os {recursosEscola.length} recursos</p>
              )}
            </div>
          </div>

          {/* Dicas e Alertas */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2">Alertas</h2>
            <Card className="rounded-3xl border-none bg-indigo-900 text-white overflow-hidden relative shadow-xl shadow-indigo-100">
              <CardContent className="p-6 relative z-10">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <Info size={20} className="text-indigo-200" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest mb-2">Modo Protótipo</h4>
                <p className="text-xs text-indigo-100 font-medium leading-relaxed opacity-80">
                  Os dados estão sendo salvos localmente. Suas alterações não serão perdidas ao recarregar a página.
                </p>
              </CardContent>
              {/* Elementos visuais de fundo */}
              <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/5" />
              <div className="absolute top-10 right-10 h-12 w-12 rounded-full bg-white/5" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;