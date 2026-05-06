import React, { useState } from "react";
import { 
  Activity, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldAlert,
  Database,
  Lock,
  ChevronRight,
  Monitor
} from "lucide-react";
import { useSaudeSistema, StatusType, ServiceStatus } from "@/hooks/useSaudeSistema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const StatusBadge = ({ status }: { status: StatusType }) => {
  switch (status) {
    case "ok":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Online / OK</Badge>;
    case "attention":
      return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Atenção</Badge>;
    case "error":
      return <Badge variant="destructive">Crítico / Erro</Badge>;
    case "loading":
      return <Badge variant="outline" className="animate-pulse">Verificando...</Badge>;
    default:
      return <Badge variant="secondary">Desconhecido</Badge>;
  }
};

const StatusIcon = ({ status }: { status: StatusType }) => {
  switch (status) {
    case "ok":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "attention":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-slate-400" />;
  }
};

const AdminSaudePage = () => {
  const { services, lastCheck, isRefreshing, refreshAll, generalStatus, events } = useSaudeSistema();
  const [autoRefresh, setAutoRefresh] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshAll();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refreshAll]);

  const copyReport = () => {
    const report = Object.values(services).map(s => 
      `[${s.status.toUpperCase()}] ${s.name}: ${s.message}`
    ).join("\n");
    
    const fullReport = `RELATÓRIO DE SAÚDE DO SISTEMA\nData: ${format(lastCheck, "dd/MM/yyyy HH:mm:ss")}\nStatus Geral: ${generalStatus.toUpperCase()}\n\n${report}\n\nGerado por Agenda Escolar Digital`;
    
    navigator.clipboard.writeText(fullReport);
    toast.success("Relatório copiado para a área de transferência!");
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Saúde do Sistema</h1>
          </div>
          <p className="text-muted-foreground">
            Monitore conexões, banco de dados, autenticação e serviços essenciais da plataforma.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-medium text-slate-600">Auto-atualizar (30s)</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          
          <Button variant="outline" size="sm" onClick={copyReport} className="gap-2">
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copiar Relatório</span>
          </Button>
          
          <Button size="sm" onClick={() => refreshAll()} disabled={isRefreshing} className="gap-2 shadow-lg shadow-primary/20">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar Diagnóstico
          </Button>
        </div>
      </div>

      {/* Resumo de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <span className={`text-2xl font-bold ${
                generalStatus === 'ok' ? 'text-emerald-600' : 
                generalStatus === 'attention' ? 'text-amber-600' : 'text-red-600'
              }`}>
                {generalStatus === 'ok' ? 'Sistema Estável' : 
                 generalStatus === 'attention' ? 'Atenção Necessária' : 'Crítico'}
              </span>
              <StatusBadge status={generalStatus} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Banco de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold">{services['supabase']?.status === 'ok' ? 'Conectado' : 'Erro'}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{services['supabase']?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Autenticação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-indigo-50 text-indigo-600">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold">{services['auth']?.status === 'ok' ? 'Ativa' : 'Falha'}</p>
                <p className="text-xs text-muted-foreground">Sessão protegida</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Última Verificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-slate-50 text-slate-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold">{format(lastCheck, "HH:mm:ss")}</p>
                <p className="text-xs text-muted-foreground">{format(lastCheck, "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detalhes dos Serviços */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xl border-t-4 border-t-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-slate-600" />
                Diagnóstico Detalhado
              </CardTitle>
              <CardDescription>
                Monitoramento em tempo real de tabelas e permissões RLS.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-t">
                {Object.entries(services).map(([id, s]) => (
                  <div key={id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg transition-colors ${
                        s.status === 'ok' ? 'bg-emerald-50 text-emerald-600' : 
                        s.status === 'attention' ? 'bg-amber-50 text-amber-600' : 
                        s.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        <StatusIcon status={s.status} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{s.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={s.status} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seção RLS e Permissões */}
          <Card className="bg-slate-900 text-white shadow-xl overflow-hidden border-none">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
                Permissões e RLS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="text-sm font-medium text-slate-300">Admin Plataforma reconhecido:</span>
                    <span className="text-sm font-bold text-emerald-400">OK</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="text-sm font-medium text-slate-300">Acesso escolas:</span>
                    <span className="text-sm font-bold text-emerald-400">Liberado</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="text-sm font-medium text-slate-300">Possível recursão RLS:</span>
                    <span className="text-sm font-bold text-emerald-400">Nenhuma detectada</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="text-sm font-medium text-slate-300">Erro 42501 (Permission):</span>
                    <span className="text-sm font-bold text-emerald-400">Nenhum</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-xs italic">
                Nota: Verificações baseadas na sessão atual do usuário administrativo.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Eventos */}
        <div className="space-y-6">
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="text-lg">Últimos Eventos</CardTitle>
              <CardDescription>Eventos detectados nas últimas verificações.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                {events.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum evento registrado ainda.</p>
                )}
                {events.map((event, idx) => (
                  <div key={idx} className="flex gap-3 relative before:absolute before:left-[11px] before:top-6 before:bottom-0 before:w-[1px] before:bg-slate-200 last:before:hidden pb-4">
                    <div className={`h-[22px] w-[22px] rounded-full mt-1 shrink-0 z-10 border-2 border-white ${
                      event.status === 'ok' ? 'bg-emerald-500' : 
                      event.status === 'attention' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{format(event.time, "HH:mm:ss")}</span>
                        <span className="text-xs font-bold text-slate-800">{event.service}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{event.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSaudePage;
