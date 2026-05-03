import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
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

  // Redirecionamento removido para garantir que a página renderize mesmo se houver usuário
  // if (user) return <Navigate to="/agenda" />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Se houver uma sessão antiga/conflitante, deslogar antes de tentar novo login
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log("[LOGIN] Sessão antiga detectada, limpando antes de novo login...");
      await supabase.auth.signOut();
    }

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
              {/* Ocultado para evitar confusão em produção, já que o app está em Lovable Cloud */}

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

              {/* Ocultado para produção */}

          </>
        )}
      </div>

      {/* Ocultado para evitar informações de mock no ambiente de produção */}


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
