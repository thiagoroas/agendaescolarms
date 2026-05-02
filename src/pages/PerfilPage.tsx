import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { escolas as initialEscolas } from "../data/mockData";
import { getMockUsuarios, saveMockUsuarios, getMockEscolas } from "../data/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LogOut, 
  User as UserIcon, 
  Mail, 
  Building, 
  Shield, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Save,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const PerfilPage = () => {
  const { user, profile, logout, updateProfile } = useAuth();
  const allEscolas = getMockEscolas();
  const escola = allEscolas.find(e => e.id === profile?.escola_id);
  
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Basic info form
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [disciplinas, setDisciplinas] = useState(profile?.disciplinas?.join(", ") || "");

  // Password change form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin_plataforma": return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Admin Plataforma</Badge>;
      case "admin_lab": return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Usuário Laboratório</Badge>;
      default: return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Professor</Badge>;
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Mode Prototype
        const mockUsuarios = getMockUsuarios();
        const updatedUsuarios = mockUsuarios.map(u => {
          if (u.id === profile?.id) {
            return {
              ...u,
              nome: fullName,
              email: email,
              disciplinas: profile?.role === "professor" ? disciplinas.split(",").map(d => d.trim()).filter(d => d !== "") : u.disciplinas
            };
          }
          return u;
        });

        saveMockUsuarios(updatedUsuarios);
        
        // Update context
        updateProfile({
          full_name: fullName,
          disciplinas: profile?.role === "professor" ? disciplinas.split(",").map(d => d.trim()).filter(d => d !== "") : (profile?.disciplinas || [])
        });

        toast.success("Perfil atualizado com sucesso!");
        setEditMode(false);
      } else {
        // Supabase mode
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            disciplinas: profile?.role === "professor" ? disciplinas.split(",").map(d => d.trim()).filter(d => d !== "") : profile?.disciplinas
          })
          .eq("id", profile?.id);

        if (profileError) throw profileError;

        if (email !== user?.email) {
          const { error: emailError } = await supabase.auth.updateUser({ email });
          if (emailError) throw emailError;
          toast.info("E-mail alterado. Verifique sua nova caixa de entrada para confirmar.");
        }

        toast.success("Perfil atualizado com sucesso!");
        setEditMode(false);
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      toast.error("A nova senha e a confirmação não coincidem.");
      return;
    }

    if (trimmedNewPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Mode Prototype
        const mockUsuarios = getMockUsuarios();
        const userInStorage = mockUsuarios.find(u => u.id === profile?.id);

        if (!userInStorage || userInStorage.senha.trim() !== trimmedCurrentPassword) {
          toast.error("Senha atual incorreta.");
          setLoading(false);
          return;
        }

        const updatedUsuarios = mockUsuarios.map(u => {
          if (u.id === profile?.id) {
            return { ...u, senha: trimmedNewPassword };
          }
          return u;
        });

        saveMockUsuarios(updatedUsuarios);
        
        // Update context
        updateProfile({
          full_name: fullName,
          disciplinas: profile?.role === "professor" ? disciplinas.split(",").map(d => d.trim()).filter(d => d !== "") : (profile?.disciplinas || [])
        });

        // Update remembered password if it exists
        if (localStorage.getItem("agenda_remembered_password")) {
          localStorage.setItem("agenda_remembered_password", trimmedNewPassword);
        }

        // Update session storage for user and profile
        const savedUser = localStorage.getItem("agenda_mock_user");
        if (savedUser) {
          const userObj = JSON.parse(savedUser);
          // O objeto User do Supabase mockado não tem campo 'password',
          // mas o AuthContext não o usa para validação no login (ele usa getMockUsuarios).
          // Manteremos a sessão atual.
          localStorage.setItem("agenda_mock_user", JSON.stringify(userObj));
        }

        toast.success("Senha alterada com sucesso.");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        // Supabase mode
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success("Senha alterada com sucesso!");
        setShowPasswordForm(false);
      }
    } catch (error: any) {
      toast.error("Erro ao alterar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-8 p-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meu Perfil</h1>
          <p className="text-slate-500 mt-1">Gerencie suas informações pessoais e segurança da conta.</p>
        </div>
        {!isSupabaseConfigured && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 py-1">
            <AlertCircle className="h-3 w-3" /> Modo Protótipo
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b pb-8 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-4">
              <div className="h-24 w-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-blue-200 ring-4 ring-white">
                {profile?.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center sm:text-left space-y-2 pt-2">
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                  <CardTitle className="text-2xl font-bold text-slate-900">{profile?.full_name}</CardTitle>
                  {getRoleBadge(profile?.role || "")}
                </div>
                <CardDescription className="text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                  <Mail className="h-4 w-4" /> {user?.email}
                </CardDescription>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none capitalize">
                    Status: {profile?.status}
                  </Badge>
                  {escola && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none flex items-center gap-1">
                      <Building className="h-3 w-3" /> {escola.nome}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-8 flex-grow">
            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-700 font-semibold">Nome Completo</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 border-slate-200 focus:ring-blue-500"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-semibold">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="email" 
                        type="email"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-slate-200 focus:ring-blue-500"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                {profile?.role === "professor" && (
                  <div className="space-y-2">
                    <Label htmlFor="disciplinas" className="text-slate-700 font-semibold">Disciplinas (separadas por vírgula)</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <textarea
                        id="disciplinas"
                        value={disciplinas}
                        onChange={(e) => setDisciplinas(e.target.value)}
                        className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-10 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Ex: Matemática, Física, Química"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Suas disciplinas cadastradas no sistema.</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6" disabled={loading}>
                    <Save className="h-4 w-4" />
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditMode(false)} disabled={loading} className="border-slate-200 text-slate-600 hover:bg-slate-50">
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <UserIcon className="h-3 w-3" /> Nome Completo
                    </p>
                    <p className="text-slate-900 font-semibold text-lg">{profile?.full_name}</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Endereço de E-mail
                    </p>
                    <p className="text-slate-900 font-semibold text-lg">{user?.email}</p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Building className="h-3 w-3" /> Escola Vinculada
                    </p>
                    <p className="text-slate-900 font-semibold text-lg">{escola?.nome || "Não informada"}</p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="h-3 w-3" /> Papel de Acesso
                    </p>
                    <p className="text-slate-900 font-semibold text-lg capitalize">{profile?.role.replace("_", " ")}</p>
                  </div>
                </div>

                {profile?.role === "professor" && profile.disciplinas && profile.disciplinas.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3" /> Minhas Disciplinas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.disciplinas.map((disc, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 py-1 px-3">
                          {disc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <Button variant="outline" className="border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 gap-2 transition-all font-semibold" onClick={() => setEditMode(true)}>
                    Editar Dados Básicos
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security / Password Card */}
        <div className="space-y-6 flex flex-col h-full">
          <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col flex-grow">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Segurança</CardTitle>
                  <CardDescription>Alterar sua senha de acesso.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-grow">
              {showPasswordForm ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="currentPassword" 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-10 border-slate-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="newPassword" 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 border-slate-200"
                        required
                        minLength={6}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Mínimo de 6 caracteres.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="confirmPassword" 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 border-slate-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={loading}>
                      {loading ? "Atualizando..." : "Confirmar Nova Senha"}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={() => setShowPasswordForm(false)} disabled={loading}>
                      Voltar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Recomendamos trocar sua senha periodicamente para manter sua conta segura.
                    </p>
                  </div>
                  <Button 
                    className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200 border-none font-semibold gap-2" 
                    onClick={() => setShowPasswordForm(true)}
                  >
                    <KeyRound className="h-4 w-4" />
                    Alterar Senha de Acesso
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-sm overflow-hidden bg-red-50/20">
            <CardHeader className="bg-red-50/50 border-b border-red-100 py-3">
              <CardTitle className="text-sm font-bold text-red-700">Sair do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <Button 
                variant="ghost" 
                className="w-full text-red-600 hover:bg-red-100 hover:text-red-700 justify-start gap-3 font-semibold h-12" 
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
                Encerrar Sessão
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;