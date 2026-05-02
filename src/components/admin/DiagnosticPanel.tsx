import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Server, Shield, User, Globe } from "lucide-react";

export const DiagnosticPanel = () => {
  const { user, profile } = useAuth();
  const [edgeFunctionStatus, setEdgeFunctionStatus] = useState<"idle" | "checking" | "ok" | "error" | "unauthorized">("idle");
  const [edgeError, setEdgeError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [tokenSent, setTokenSent] = useState<boolean>(false);

  useEffect(() => {
  const checkEdgeFunction = async () => {
    if (!isSupabaseConfigured || !user) {
      setEdgeFunctionStatus("unauthorized");
      return;
    }

    setEdgeFunctionStatus("checking");
    setEdgeError(null);
    setLastResponse(null);
    
    try {
      // Check if session has access token
      const { data: sessionData } = await supabase.auth.getSession();
      setTokenSent(!!sessionData.session?.access_token);

      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'ping' } 
      });

      setLastResponse(data || error);

      if (error) {
        if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
          setEdgeFunctionStatus("error");
          setEdgeError("Não foi possível alcançar a Edge Function (Network Error/Not Deployed)");
        } else {
          // If we got a response from the function (even an error message like "Invalid action")
          setEdgeFunctionStatus("ok");
        }
      } else if (data?.error) {
        setEdgeFunctionStatus("ok");
      } else {
        setEdgeFunctionStatus("ok");
      }
    } catch (err: any) {
      setEdgeFunctionStatus("error");
      setEdgeError(err.message || "Erro desconhecido");
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
        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">Supabase Configurado</span>
          </div>
          {isSupabaseConfigured ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Sim
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
              <AlertCircle className="h-3 w-3" /> Não (Fallback Local)
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">VITE_SUPABASE_URL</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
            {import.meta.env.VITE_SUPABASE_URL ? "Configurada ✓" : "Ausente ✗"}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">Autenticação Real</span>
          </div>
          {user ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Logado
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1">
              Offline
            </Badge>
          )}
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

        <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 md:col-span-2">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">Edge Function (manage-user)</span>
          </div>
          {edgeFunctionStatus === "checking" && (
            <span className="text-xs text-slate-400 animate-pulse">Testando conectividade...</span>
          )}
          {edgeFunctionStatus === "ok" && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Acessível
            </Badge>
          )}
          {edgeFunctionStatus === "error" && (
            <div className="flex flex-col items-end">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                <AlertCircle className="h-3 w-3" /> Erro/Não Deployada
              </Badge>
              {edgeError && <span className="text-[10px] text-red-500 mt-1">{edgeError}</span>}
            </div>
          )}
          {edgeFunctionStatus === "unauthorized" && (
            <span className="text-xs text-slate-400">Requer Login Supabase</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
