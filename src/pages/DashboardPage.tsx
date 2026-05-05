import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured, isValidUUID } from "../lib/supabase";
import { getMockEscolas } from "../data/storage";
import { useRecursos } from "@/hooks/useRecursos";
import { useReservas } from "@/hooks/useReservas";
import { useAvisos } from "@/hooks/useAvisos";
import { Escola } from "../data/mockData";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  Plus, 
  FileText,
  User,
  Monitor,
  LayoutDashboard,
  Bell,
  Info,
  AlertTriangle,
  ChevronRight,
  Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { resetMockData } from "../data/storage";
import { useToast } from "@/hooks/use-toast";

const DashboardPage = () => {
  const { user, profile, selectedEscolaId, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { recursos: todosRecursos, loading: loadingRecursos, error: errorRecursos } = useRecursos();
  // Central do Laboratório usa o hook useReservas que já carrega os dados da escola selecionada
  const { reservas: todasReservas, loading: loadingReservas, error: errorReservas } = useReservas();
  const { avisos, loading: loadingAvisos, error: errorAvisos } = useAvisos();

  const [todasEscolas, setTodasEscolas] = useState<Escola[]>([]);
  const hasShownErrorToastRef = useRef(false);

  useEffect(() => {
    setTodasEscolas(getMockEscolas());
  }, []);

  useEffect(() => {
    if (errorRecursos || errorReservas || errorAvisos) {
      if (!hasShownErrorToastRef.current) {
        toast({
          title: "Erro de carregamento",
          description: "Alguns dados não puderam ser carregados. Tente atualizar a página.",
          variant: "destructive"
        });
        hasShownErrorToastRef.current = true;
      }
    }
  }, [errorRecursos, errorReservas, errorAvisos, toast]);

  const currentEscolaId = selectedEscolaId || profile?.escola_id;
  const escolaAtiva = todasEscolas.find(e => e.id === currentEscolaId);
  
  const recursosEscola = useMemo(() => {
    if (isSupabaseConfigured && !isValidUUID(currentEscolaId)) return [];
    return todosRecursos.filter(r => r.escola_id === currentEscolaId);
  }, [todosRecursos, currentEscolaId]);
  
  const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const hojeStr = getLocalDateString();
  
  const avisosAtivos = useMemo(() => {
    return avisos.filter(a => 
      a.ativo && 
      a.escola_id === currentEscolaId && 
      a.exibir_no_dashboard &&
      hojeStr >= a.data_inicio && 
      hojeStr <= a.data_fim
    ).sort((a, b) => {
      const prioridade = { urgente: 0, atencao: 1, informativo: 2 };
      return prioridade[a.tipo] - prioridade[b.tipo];
    });
  }, [avisos, currentEscolaId, hojeStr]);

  const reservationsSource = todasReservas;

  const statusEncontrados = useMemo(() => {
    const set = new Set<string>();
    reservationsSource.forEach(r => set.add(r.status));
    return Array.from(set);
  }, [reservationsSource]);

  const reservasHoje = useMemo(() => {
    // Diagnóstico via logs internos para entender o que está acontecendo no filter
    let list = reservationsSource.filter(r => {
      // Normalização da data: tenta YYYY-MM-DD ou extrai do timestamp
      let resData = r.data;
      if (resData.includes('T')) {
        resData = resData.split('T')[0];
      } else if (resData.includes(' ')) {
        resData = resData.split(' ')[0];
      }
      
      const isToday = resData === hojeStr;
      
      const status = String(r.status).toLowerCase();
      // Status válidos para exibição na Central (confirmados ou em uso)
      const isConfirmed = [
        "confirmada", 
        "confirmado", 
        "aprovada", 
        "aprovado", 
        "ativo", 
        "ativa", 
        "realizada",
        "pendente" // Incluindo pendente para diagnóstico se nada aparecer
      ].includes(status);
      
      return isToday && isConfirmed;
    });
    
    if (profile?.role === "professor") {
      list = list.filter(r => r.profile_id === user?.id);
    } else if (profile?.role === "admin_lab") {
      // Garantir que admin_lab só vê reservas da escola ativa
      list = list.filter(r => r.escola_id === currentEscolaId);
    }
    
    return list.sort((a, b) => a.aula - b.aula);
  }, [reservationsSource, hojeStr, profile?.role, user?.id]);

  const proximasReservas = useMemo(() => {
    let list = reservationsSource.filter(r => {
      let resData = r.data;
      if (resData.includes('T')) {
        resData = resData.split('T')[0];
      } else if (resData.includes(' ')) {
        resData = resData.split(' ')[0];
      }
      
      const isFuture = resData > hojeStr;
      
      const status = String(r.status).toLowerCase();
      const isConfirmed = [
        "confirmada", 
        "confirmado", 
        "aprovada", 
        "aprovado", 
        "ativo", 
        "ativa", 
        "realizada",
        "pendente"
      ].includes(status);
      
      return isFuture && isConfirmed;
    });
    
    if (profile?.role === "professor") {
      list = list.filter(r => r.profile_id === user?.id);
    } else if (profile?.role === "admin_lab") {
      list = list.filter(r => r.escola_id === currentEscolaId);
    }
    
    const limit = profile?.role === "professor" ? 3 : 15;
    return list.sort((a, b) => a.data.localeCompare(b.data) || a.aula - b.aula).slice(0, limit);
  }, [reservationsSource, hojeStr, profile?.role, user?.id]);

  const debugData = useMemo(() => {
    return {
      email: user?.email,
      role: profile?.role,
      profileId: user?.id,
      profileEscolaId: profile?.escola_id,
      selectedEscolaId: selectedEscolaId,
      escolaIdFinalUsado: currentEscolaId,
      hojeLocal: hojeStr,
      totalReservasBrutas: reservationsSource.length,
      statusEncontrados: statusEncontrados,
      datasEncontradas: Array.from(new Set(reservationsSource.map(r => r.data.split('T')[0]))).sort(),
      reservasHojeBrutas: reservationsSource.filter(r => r.data.split('T')[0] === hojeStr).length,
      reservasHojeFiltradas: reservasHoje.length,
      reservasFuturasBrutas: reservationsSource.filter(r => r.data.split('T')[0] > hojeStr).length,
      reservasFuturasFiltradas: proximasReservas.length,
      primeiraReserva: reservationsSource[0] || null
    };
  }, [user, profile, selectedEscolaId, currentEscolaId, hojeStr, reservationsSource, statusEncontrados, reservasHoje, proximasReservas]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("[CENTRAL LAB DEBUG]", debugData);
    }
  }, [debugData]);

  const alertas = useMemo(() => {
    return reservationsSource.filter(r => 
      (r.status === "manutencao" || r.status === "bloqueada") &&
      r.data >= hojeStr
    );
  }, [reservationsSource, hojeStr]);

  const recursosEmUsoHoje = useMemo(() => {
    const ids = new Set(reservasHoje.map(r => r.recurso_id));
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
    <div className="space-y-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8 animate-in fade-in duration-500">
      {/* Dashboard principal */}


      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Central do Laboratório</h1>
            <p className="text-sm font-medium text-slate-500 truncate max-w-[200px] sm:max-w-none">
              {escolaAtiva?.nome ? `${escolaAtiva.nome} · ` : "Visão geral · "}{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card 
          className="rounded-3xl border-none shadow-sm bg-blue-50/50 hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-blue-100 transition-all group cursor-pointer"
          onClick={() => {
            if (profile?.role === "professor") {
              navigate("/minhas-reservas");
            } else {
              navigate("/admin/reservas");
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
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Agendamentos</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {profile?.role === "professor" ? "Meus agendamentos hoje" : "Reservas de hoje"}
            </h3>
            <p className="text-[10px] font-bold text-blue-400 mt-1">Apenas reservas de hoje</p>
          </CardContent>
        </Card>

        <Card 
          className="rounded-3xl border-none shadow-sm bg-emerald-50/50 hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-100 transition-all group cursor-pointer"
          onClick={() => navigate("/agenda")}
          aria-label="Ver recursos em uso hoje"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Monitor size={20} />
              </div>
              <Badge className="bg-emerald-600 text-white border-none font-black">{recursosEmUsoHoje.length}</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Recursos em uso hoje</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">Hoje</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Ver uso na agenda</p>
          </CardContent>
        </Card>

        <Card 
          className="rounded-3xl border-none shadow-sm bg-amber-50/50 hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-amber-100 transition-all group cursor-pointer"
          onClick={() => {
            if (profile?.role === "professor") {
              navigate("/agenda?view=blocks"); 
            } else {
              navigate("/admin/reservas?status=manutencao");
            }
          }}
          aria-label="Ver bloqueios e manutenções"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <AlertTriangle size={20} />
              </div>
              <Badge className="bg-slate-600 text-white border-none font-black">{alertas.length}</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              BLOQUEIOS E MANUTENÇÃO
            </p>
            <h3 className="text-xl font-black text-slate-900 mt-1">Próximos bloqueios</h3>
          </CardContent>
        </Card>

        <Card 
          className="rounded-3xl border-none shadow-sm bg-indigo-50/50 hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-indigo-100 transition-all group cursor-pointer"
          onClick={() => {
            if (profile?.role === "professor") {
              navigate("/minhas-reservas");
            } else {
              navigate("/admin/recursos");
            }
          }}
          aria-label={profile?.role === "professor" ? "Ver meus relatórios" : "Ver recursos cadastrados"}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                {profile?.role === "professor" ? <FileText size={20} /> : <Monitor size={20} />}
              </div>
              {profile?.role !== "professor" && (
                <Badge className="bg-indigo-600 text-white border-none font-black">{recursosEscola.length}</Badge>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              {profile?.role === "professor" ? "Meus Relatórios" : "Recursos Cadastrados"}
            </p>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {profile?.role === "professor" ? "Consultar" : "Gestão"}
            </h3>
            {profile?.role !== "professor" && (
              <p className="text-[10px] font-bold text-slate-400 mt-1">Gerenciar equipamentos</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Coluna Principal: Acompanhamento de Reservas */}
        <div className="md:col-span-1 xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Clock className="text-blue-600" size={20} />
              Acompanhamento de Reservas
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
                const isProfessor = profile?.role === "professor";
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
                          <Monitor size={12} className="text-slate-200" /> {rec?.nome} · {res.aula}ª Aula {res.horario ? `(${res.horario})` : ""}
                        </p>
                      </div>
                      
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600" onClick={() => navigate(isProfessor ? "/minhas-reservas" : "/admin/reservas")}>
                        <ChevronRight className="h-5 w-5" />
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

          {/* Avisos Importantes */}
          {avisosAtivos.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <Bell size={14} className="text-blue-500" /> Avisos Importantes
              </h2>
              <div className="space-y-3">
                {avisosAtivos.map(aviso => (
                  <Card 
                    key={aviso.id} 
                    className={cn(
                      "rounded-3xl border-none text-white overflow-hidden relative shadow-lg transition-all hover:scale-[1.02]",
                      aviso.tipo === "urgente" ? "bg-red-600" :
                      aviso.tipo === "atencao" ? "bg-amber-500" :
                      "bg-blue-600"
                    )}
                  >
                    <CardContent className="p-5 relative z-10">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                          {aviso.tipo === "urgente" ? <AlertTriangle size={16} /> : <Info size={16} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tight leading-tight">{aviso.titulo}</h4>
                          <p className="text-[11px] font-medium leading-relaxed opacity-90 mt-1">
                            {aviso.mensagem}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {profile?.role === "admin_plataforma" && !isSupabaseConfigured && (
        <div className="mt-12 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom duration-700">
          <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                    <Trash2 size={22} />
                  </div>
                  Painel de Controle Demo
                </h3>
                <p className="text-sm font-medium text-slate-500">Este painel permite gerenciar os dados fictícios usados na demonstração.</p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-black uppercase tracking-widest text-[11px] px-8 rounded-2xl group transition-all">
                    Resetar Todos os Dados Demo
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-none">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Deseja resetar os dados?</AlertDialogTitle>
                    <AlertDialogDescription className="font-medium text-slate-500">
                      Isso irá apagar todas as reservas, avisos e alterações feitas neste navegador e restaurar o estado original da demonstração.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        resetMockData();
                        toast({
                          title: "Dados resetados",
                          description: "O ambiente de demonstração foi restaurado com sucesso."
                        });
                        setTimeout(() => window.location.reload(), 1000);
                      }} 
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]"
                    >
                      Confirmar Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;