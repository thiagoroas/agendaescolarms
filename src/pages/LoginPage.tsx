import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Calendar } from "lucide-react";
import { toast } from "sonner";
import { usuarios } from "../data/mockData";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mostrarRecuperarSenha, setMostrarRecuperarSenha] = useState(false);
  const [recuperarEmail, setRecuperarEmail] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [isEnviando, setIsEnviando] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("agenda_remembered_email");
    const savedPassword = localStorage.getItem("agenda_remembered_password");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRemember(true);
    }
  }, []);

  if (user) return <Navigate to="/agenda" />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await login(email, password, remember);
    
    if (result.success) {
      navigate("/agenda");
    } else {
      setError(result.error || "Erro ao realizar login");
      toast.error(result.error || "Erro ao realizar login");
    }
    setIsLoading(false);
  };

  const handleRecuperarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recuperarEmail || !recuperarEmail.includes("@")) {
      toast.error("Digite um e-mail válido");
      return;
    }

    setIsEnviando(true);
    setTimeout(() => {
      setIsEnviando(false);
      setEmailEnviado(true);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-login my-auto">
        {mostrarRecuperarSenha ? (
          <div>
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                {emailEnviado ? <Mail className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {emailEnviado ? "E-mail enviado!" : "Recuperar senha"}
              </h1>
              <p className="text-sm text-slate-500 text-center mt-2">
                {emailEnviado 
                  ? "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes. Verifique também a pasta de spam."
                  : "Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha."
                }
              </p>
            </div>

            {emailEnviado ? (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setMostrarRecuperarSenha(false);
                  setEmailEnviado(false);
                  setRecuperarEmail("");
                }}
              >
                Voltar para o login
              </Button>
            ) : (
              <form onSubmit={handleRecuperarSenha} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recuperar-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <Input
                      id="recuperar-email"
                      type="email"
                      value={recuperarEmail}
                      onChange={(e) => setRecuperarEmail(e.target.value)}
                      className="pl-10 h-12"
                      placeholder="nome@escola.com"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={isEnviando}>
                  {isEnviando ? "Enviando..." : "Enviar link"}
                </Button>
                <button
                  type="button"
                  onClick={() => setMostrarRecuperarSenha(false)}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 mt-2"
                >
                  ← Voltar para o login
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Calendar className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Agenda Escolar Digital</h1>
              <p className="text-sm text-slate-500 text-center mt-1">Faça login para acessar a agenda da sua escola</p>
              {!isSupabaseConfigured && (
                <div className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-100">
                  Modo protótipo: dados de demonstração para teste piloto
                </div>
              )}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    placeholder="nome@escola.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    onClick={() => setMostrarRecuperarSenha(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 py-1">
                <Checkbox id="remember" checked={remember} onCheckedChange={(c) => setRemember(!!c)} />
                <Label htmlFor="remember" className="text-sm cursor-pointer">Lembrar meus dados</Label>
              </div>

              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Acessando..." : "Acessar Agenda"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">O cadastro de professores é feito pela coordenação.</p>
          </>
        )}
      </div>

      {!isSupabaseConfigured && (
        <div className="md:fixed md:bottom-4 md:right-4 w-full max-w-md md:max-w-sm rounded-xl bg-white p-4 shadow-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 mx-auto md:mx-0">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">?</span>
              Como testar
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 ml-1">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 min-w-[70px]">Professor:</span>
                <span>Criar reserva e consultar "Minhas Reservas"</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 min-w-[70px]">Laboratório:</span>
                <span>Acompanhar reservas e gerar relatório</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 min-w-[70px]">Admin:</span>
                <span>Trocar escola ativa e validar dados isolados</span>
              </li>
            </ul>
          </div>

          <Separator className="my-3 bg-slate-100" />

          <h3 className="text-sm font-bold text-slate-900 mb-2">Credenciais de acesso</h3>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="p-2 bg-blue-50 rounded border border-blue-100">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-blue-700">Admin Geral (Plataforma)</span>
              </div>
              <p className="text-slate-500">admin@escola.com / admin123</p>
            </div>
            
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-slate-700">Admin Escolar (Laboratório)</span>
              </div>
              <p className="text-slate-500">lab@escola.com / lab123</p>
            </div>
            
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-slate-700">Professor</span>
              </div>
              <p className="text-slate-500">carlos@escola.com / prof123</p>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full py-6 mt-auto text-center">
        <p className="text-sm text-slate-500">
          Desenvolvido pelo <strong className="font-bold text-slate-700">Prof. Thiago Roas</strong>
        </p>
      </footer>
    </div>
  );
};

const Separator = ({ className }: { className?: string }) => (
  <div className={`h-[1px] w-full ${className || ""}`} />
);

export default LoginPage;
