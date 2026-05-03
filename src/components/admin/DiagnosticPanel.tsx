import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Server, Shield, User, Globe, RefreshCcw, Terminal, Lock } from "lucide-react";

export const DiagnosticPanel = () => {
  const { user, profile } = useAuth();
  const [edgeFunctionStatus, setEdgeFunctionStatus] = useState<"idle" | "checking" | "ok" | "error" | "unauthorized">("idle");
  const [edgeError, setEdgeError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [tokenSent, setTokenSent] = useState<boolean>(false);
  const [hasAccessToken, setHasAccessToken] = useState<boolean>(false);

  const checkEdgeFunction = async () => {
    // Mesmo que isSupabaseConfigured seja falso, se tivermos um user e um token, tentamos
    // Isso resolve casos onde a detecção automática falha mas o cliente está funcionando
    if (!user) {
      setEdgeFunctionStatus("unauthorized");
      return;
    }

    setEdgeFunctionStatus("checking");
    setEdgeError(null);
    setLastResponse(null);
    setTokenSent(false);
    setHasAccessToken(false);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const session = sessionData.session;
      
      if (!session?.access_token) {
        setEdgeFunctionStatus("unauthorized");
        setEdgeError(sessionError?.message || "Sessão existe visualmente, mas access_token não foi encontrado.");
        return;
      }

      setHasAccessToken(true);
      setTokenSent(true);

      // Chamada simplificada - o SDK do Supabase já injeta o token se houver sessão
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'ping' }
      });

      setLastResponse(data || error);

      if (error) {
        // Se for erro de rede (função não deployada ou URL errada)
        if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError") || error.name === "FunctionsFetchError") {
          setEdgeFunctionStatus("error");
          setEdgeError(`Não foi possível alcançar a Edge Function: ${error.message || "Erro de rede"}`);
        } else {
          // Outros erros da função (ex: 401, 403, 500) são considerados "comunicação ok" mas com erro lógico
          setEdgeFunctionStatus("ok");
        }
      } else {
        setEdgeFunctionStatus("ok");
      }
    } catch (err: any) {
      console.error("Erro ao testar Edge Function:", err);
      setEdgeFunctionStatus("error");
      setEdgeError(err.message || "Erro desconhecido ao chamar a função");
      setLastResponse(err);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured && user && profile?.role === "admin_plataforma" && edgeFunctionStatus === "idle") {
      checkEdgeFunction();
    }
  }, [user, profile, edgeFunctionStatus]);

  if (profile?.role !== "admin_plataforma") return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-800">
          <Shield className="h-4 w-4" />
          Painel de Diagnóstico (Apenas Admin Plataforma)
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Bloco A: Variáveis Vite */}
        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">VITE_SUPABASE_URL</span>
          </div>
          <Badge variant="outline" className={import.meta.env.VITE_SUPABASE_URL ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
            {import.meta.env.VITE_SUPABASE_URL ? "Presente" : "Ausente"}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">VITE_SUPABASE_PUBLISHABLE_KEY</span>
          </div>
          <Badge variant="outline" className={import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
            {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "Presente" : "Ausente"}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">VITE_SUPABASE_PROJECT_ID</span>
          </div>
          <Badge variant="outline" className={import.meta.env.VITE_SUPABASE_PROJECT_ID ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
            {import.meta.env.VITE_SUPABASE_PROJECT_ID ? "Presente" : "Ausente"}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">Modo Supabase</span>
          </div>
          {isSupabaseConfigured ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Real
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
              <AlertCircle className="h-3 w-3" /> Local/Demo
            </Badge>
          )}
        </div>

        {/* Bloco B: Sessão Real */}
        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">Sessão Ativa</span>
          </div>
          <Badge variant="outline" className={user ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
            {user ? "Sim" : "Não"}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">Access Token</span>
          </div>
          <Badge variant="outline" className={hasAccessToken ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
            {hasAccessToken ? "Presente" : "Ausente"}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">Auth Token Sent</span>
          </div>
          <Badge variant="outline" className={tokenSent ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}>
            {tokenSent ? "Sim" : "Não"}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">Perfil Carregado</span>
          </div>
          {profile ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <CheckCircle2 className="h-3 w-3" /> {profile.role}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
              <AlertCircle className="h-3 w-3" /> Não
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">Edge manage-user</span>
          </div>
          <div className="flex items-center gap-2">
            {edgeFunctionStatus === "checking" && (
              <span className="text-xs text-slate-400 animate-pulse">Testando...</span>
            )}
            {edgeFunctionStatus === "ok" && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Acessível
              </Badge>
            )}
            {edgeFunctionStatus === "error" && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                <AlertCircle className="h-3 w-3" /> Erro
              </Badge>
            )}
            {edgeFunctionStatus === "unauthorized" && (
              <span className="text-xs text-slate-400">Requer Login</span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0" 
              onClick={() => checkEdgeFunction()}
              disabled={edgeFunctionStatus === "checking"}
            >
              <RefreshCcw className={`h-3 w-3 ${edgeFunctionStatus === "checking" ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="md:col-span-2 lg:col-span-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800">
            <p className="font-bold mb-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> VITE_SUPABASE_URL não detectada
            </p>
            <p>Para usar o Supabase real, configure as variáveis de ambiente no painel do <strong>Lovable</strong> (Settings &gt; Supabase &gt; Connect) ou adicione manualmente em <strong>Secrets</strong> com os nomes:</p>
            <ul className="list-disc ml-4 mt-1 font-mono">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_PUBLISHABLE_KEY</li>
            </ul>
          </div>
        )}
      </CardContent>

      {(edgeError || lastResponse) && (
        <CardFooter className="flex flex-col items-start bg-slate-50 border-t border-blue-100 p-4 gap-3">
          {edgeError && (
            <div className="w-full p-2 bg-red-50 border border-red-100 rounded text-[10px] text-red-700 font-mono">
              <strong>Erro:</strong> {edgeError}
            </div>
          )}
          
          {lastResponse && (
            <div className="w-full">
              <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Última Resposta (JSON):</span>
              <pre className="p-2 bg-slate-900 text-slate-300 rounded text-[10px] font-mono overflow-auto max-h-32 w-full">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-blue-700 bg-blue-100/50 p-2 rounded w-full">
            <Terminal className="h-3 w-3 shrink-0" />
            <span>Se aparecer erro, faça deploy com: <strong>supabase functions deploy manage-user</strong></span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
