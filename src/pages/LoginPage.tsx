import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-login">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Calendar className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda Escolar Digital</h1>
          <p className="text-sm text-slate-500 text-center mt-1">Faça login para acessar a agenda da sua escola</p>
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
                className="pl-10"
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
                onClick={() => {
                  if (!email) {
                    toast.error("Por favor, digite seu e-mail primeiro.");
                    return;
                  }
                  toast.success(`Um link de recuperação foi enviado para ${email}`);
                }}
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
                className="pl-10 pr-10"
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

          <div className="flex items-center space-x-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={(c) => setRemember(!!c)} />
            <Label htmlFor="remember" className="text-sm cursor-pointer">Lembrar meus dados</Label>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? "Acessando..." : "Acessar Agenda"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">O cadastro de professores é feito pela coordenação.</p>
      </div>

      <div className="fixed bottom-4 left-4 max-w-xs rounded-lg border bg-white p-4 text-xs shadow-sm">
        <h4 className="mb-2 font-bold uppercase">Credenciais de Teste</h4>
        {usuarios.map(u => (
          <div key={u.id} className="mb-1 flex justify-between gap-4">
            <span className="truncate">{u.papel}</span>
            <code className="bg-slate-100 p-0.5">{u.email}</code>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoginPage;
