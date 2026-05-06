import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { Usuario } from "../data/mockData";
import { useEscolas } from "@/hooks/useEscolas";
import { getMockUsuarios, saveMockUsuarios } from "../data/storage";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, UserCheck, Search, Info, Building2, Trash2, Edit2, Loader2, Key, Power, ArchiveX, ShieldCheck, Bug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DiagnosticPanel } from "@/components/admin/DiagnosticPanel";
import { Card, CardContent } from "@/components/ui/card";

const AdminProfessoresPage = () => {
  const { user, profile, selectedEscolaId, setSelectedEscolaId } = useAuth();
  const { escolas, loading: loadingEscolas } = useEscolas();
  const [searchTerm, setSearchTerm] = useState("");
  const [localUsers, setLocalUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("professores");
  
  // Permission & Debug Checks
  const isAdminPlataforma = profile?.role === "admin_plataforma";
  const isAdminLab = profile?.role === "admin_lab";
  const isDevOrDebug = isAdminPlataforma && (
    import.meta.env.DEV === true || 
    localStorage.getItem('debug_users') === 'true'
  );

  // Debug State
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // Modal Form State
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [papel, setPapel] = useState<"professor" | "admin_lab">("professor");
  const [escolaId, setEscolaId] = useState("");
  const [disciplinas, setDisciplinas] = useState("");
  const [status, setStatus] = useState<"ativo" | "pendente" | "bloqueado" | "removido">("ativo");
  const [statusFilter, setStatusFilter] = useState<string>("ativos");

  const fetchUsers = async () => {
    if (isSupabaseConfigured) {
      setLoading(true);
      const diagnostics: any = {
        timestamp: new Date().toISOString(),
        version: "users-multi-school-debug-2026-05-05",
        env: {
          supabaseUrl: (import.meta as any).env.VITE_SUPABASE_URL?.split('.')[0] + "... (Redacted)",
          hasUrl: !!(import.meta as any).env.VITE_SUPABASE_URL,
          hasKey: !!(import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        user: {
          id: user?.id,
          email: user?.email,
          role: profile?.role
        }
      };

      try {
        if (isDevOrDebug) console.log("[DEBUG] Starting Manual Fetch Diagnostic...");

        // 1. Simple Test: profile_escolas
        const testPe = await supabase.from('profile_escolas').select('*').limit(5);
        diagnostics.test_profile_escolas = {
          count: testPe.data?.length || 0,
          error: testPe.error ? { code: testPe.error.code, message: testPe.error.message } : null
        };

        // 2. Simple Test: profiles
        const testP = await supabase.from('profiles').select('id,nome,email,papel,status').limit(5);
        diagnostics.test_profiles = {
          count: testP.data?.length || 0,
          error: testP.error ? { code: testP.error.code, message: testP.error.message } : null
        };

        // 3. Simple Test: escolas
        const testE = await supabase.from('escolas').select('id,nome,status').limit(5);
        diagnostics.test_escolas = {
          count: testE.data?.length || 0,
          error: testE.error ? { code: testE.error.code, message: testE.error.message } : null
        };

        // 4. Manual Fallback Query Strategy
        let peQuery = supabase.from("profile_escolas").select("*");
        
        const isAdminPlataforma = profile?.role === "admin_plataforma";
        const isAdminLab = profile?.role === "admin_lab";

        if (isAdminLab) {
          peQuery = peQuery.eq("escola_id", profile.escola_id).eq("papel", "professor");
        } else if (isAdminPlataforma) {
          if (activeTab === "professores") {
            peQuery = peQuery.eq("papel", "professor");
          } else if (activeTab === "usuarios_lab") {
            peQuery = peQuery.eq("papel", "admin_lab");
          }
          if (selectedEscolaId && selectedEscolaId !== "todas") {
            peQuery = peQuery.eq("escola_id", selectedEscolaId);
          }
        }

        const { data: vinculosData, error: vinculosError } = await peQuery;
        
        if (vinculosError) {
          diagnostics.final_query_error = { code: vinculosError.code, message: vinculosError.message };
          throw vinculosError;
        }

        if (!vinculosData || vinculosData.length === 0) {
          setLocalUsers([]);
          setDebugInfo(diagnostics);
          return;
        }

        // Fetch Profiles manually
        const profileIds = Array.from(new Set(vinculosData.map(v => v.profile_id)));
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nome, email")
          .in("id", profileIds);

        if (profilesError) {
          diagnostics.profiles_fetch_error = { code: profilesError.code, message: profilesError.message };
          throw profilesError;
        }

        // Map data together
        const mapped: Usuario[] = vinculosData.map(link => {
          const profileInfo = profilesData?.find(p => p.id === link.profile_id);
          return {
            id: link.profile_id,
            nome: profileInfo?.nome || "Usuário sem perfil",
            email: profileInfo?.email || "",
            escola_id: link.escola_id,
            papel: link.papel,
            status: link.status,
            disciplinas: link.disciplinas || [],
            senha: ""
          };
        });

        setLocalUsers(mapped);
        diagnostics.mapped_count = mapped.length;
        setDebugInfo(diagnostics);

      } catch (err: any) {
        if (isDevOrDebug) console.error("[DIAGNOSTIC ERROR]", err);
        diagnostics.exception = err.message;
        setDebugInfo(diagnostics);
        toast.error(`Não foi possível carregar os usuários. Tente atualizar a página.`);
      } finally {
        setLoading(false);
      }
    } else {
      const storedUsers = getMockUsuarios();
      setLocalUsers(storedUsers);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [profile, selectedEscolaId, activeTab]);

  const filteredUsers = localUsers.filter(u => {
    // Note: Database query already filters by papel for activeTab in Supabase mode.
    // This frontend filter is kept for mock mode and extra safety.
    if (activeTab === "professores" && u.papel !== "professor") return false;
    if (activeTab === "usuarios_lab" && u.papel !== "admin_lab") return false;

    // Status filter
    if (statusFilter === "ativos" && (u.status === "removido")) return false;
    if (statusFilter !== "todos" && statusFilter !== "ativos" && u.status !== statusFilter) return false;

    // Search filter
    const matchesSearch = u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const openModal = (u?: Usuario) => {
    if (u) {
      setEditingUserId(u.id);
      setNome(u.nome);
      setEmail(u.email);
      setSenha("");
      setConfirmarSenha("");
      setPapel(u.papel as any);
      setEscolaId(u.escola_id);
    } else {
      const defaultPapel = activeTab === "usuarios_lab" ? "admin_lab" : "professor";
      setEditingUserId(null);
      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
      setPapel(defaultPapel);
      setEscolaId(isAdminLab ? (profile?.escola_id || "") : (selectedEscolaId && selectedEscolaId !== "todas" ? selectedEscolaId : ""));
      setDisciplinas("");
      setStatus("ativo");
    }
    setIsModalOpen(true);
  };

  const handleSalvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || nome.trim().length < 3) { toast.error("Nome inválido (mínimo 3 caracteres)"); return; }
    if (!email.trim() || !email.includes("@")) { toast.error("E-mail inválido"); return; }
    
    if (!editingUserId) {
      if (senha.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres"); return; }
      if (senha !== confirmarSenha) { toast.error("As senhas não coincidem"); return; }
    } else if (senha && senha.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres"); return;
    }

    if (!escolaId || escolaId === "todas") {
      toast.error("Vínculo com uma escola específica é obrigatório");
      return;
    }

    const disciplinasArray = disciplinas.split(",").map(d => d.trim()).filter(d => d !== "");
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        const action = editingUserId ? 'update' : 'create';
        const userData: any = {
          nome: nome.trim(),
          email: email.trim(),
          papel,
          escola_id: escolaId,
          status,
          disciplinas: papel === "professor" ? disciplinasArray : []
        };

        if (editingUserId) {
          userData.id = editingUserId;
          // Se preencheu senha na edição, é um reset
          if (senha) {
            const { data: { session: resetSession } } = await supabase.auth.getSession();
            if (isDevOrDebug) console.log("[DEBUG] Invocando reset_password, token presente?", !!resetSession?.access_token);
            const { error: resetError } = await supabase.functions.invoke('manage-user', {
              body: { action: 'reset_password', userData: { id: editingUserId, password: senha } }
            });
            if (resetError) throw resetError;
            toast.success("Senha atualizada!");
          }
        } else {
          userData.password = senha;
        }

        if (isDevOrDebug) console.log("[DEBUG] Invocando manage-user action:", action);
        const { data, error: invokeError } = await supabase.functions.invoke('manage-user', {
          body: { action, userData }
        });

        if (invokeError) throw invokeError;
        if (data?.error) {
          if (data.code === 'ALREADY_LINKED') {
            toast.error(data.error);
            setIsModalOpen(false);
            return;
          }
          throw new Error(data.error);
        }

        if (data?.isNewUser === false && action === 'create') {
          toast.info("Este usuário já existe. Foi adicionado vínculo com esta escola.");
        } else {
          toast.success(editingUserId ? "Usuário atualizado!" : "Usuário cadastrado!");
        }
        setIsModalOpen(false);
        fetchUsers();
      } catch (err: any) {
        if (isDevOrDebug) console.error("Error managing user:", err.message);
        toast.error(isDevOrDebug ? `Erro: ${err.message}` : "Não foi possível salvar o usuário. Tente novamente.");
      } finally {
        setLoading(false);
      }
    } else {
      // Mock logic... (existing logic moved below)
      if (editingUserId) {
        const updated = localUsers.map(u => {
          if (u.id === editingUserId) {
            const updatedUser = {
              ...u,
              nome: nome.trim(),
              email: email.trim(),
              escola_id: isAdminPlataforma ? escolaId : u.escola_id,
              papel: papel,
              status: status,
              disciplinas: papel === "professor" ? disciplinasArray : undefined,
            };
            if (senha) (updatedUser as any).senha = senha;
            return updatedUser;
          }
          return u;
        });
        saveMockUsuarios(updated as any);
        setLocalUsers(updated);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        const novoUsuario: Usuario = {
          id: "user-" + Date.now(),
          nome: nome.trim(),
          email: email.trim(),
          escola_id: isAdminPlataforma ? (escolaId || selectedEscolaId || "") : (profile?.escola_id || ""),
          papel: papel,
          status: "ativo",
          disciplinas: papel === "professor" ? disciplinasArray : undefined
        };
        const updated = [{ ...novoUsuario, senha } as any, ...localUsers];
        saveMockUsuarios(updated as any);
        setLocalUsers(updated);
        toast.success("Cadastrado com sucesso!");
      }
      setIsModalOpen(false);
      setLoading(false);
    }
  };

  const handleRemoverUsuario = async (u: Usuario) => {
    const isProfessor = u.papel === 'professor';
    const message = isProfessor 
      ? `Deseja remover este professor da escola? Ele não aparecerá mais na lista de professores ativos e não poderá realizar novas reservas. O histórico será preservado.`
      : `Deseja remover este administrador da escola? O histórico será preservado.`;

    if (confirm(message)) {
      setLoading(true);
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.functions.invoke('manage-user', {
            body: { action: 'update', userData: { id: u.id, escola_id: u.escola_id, status: 'removido' } }
          });
          if (error) throw error;
          toast.success("Usuário removido da escola.");
          fetchUsers();
        } catch (err: any) {
          if (isDevOrDebug) console.error("Error removing user:", err.message);
          toast.error(isDevOrDebug ? `Erro: ${err.message}` : "Erro ao remover usuário");
        } finally {
          setLoading(false);
        }
      } else {
        const updated = localUsers.map(usr => usr.id === u.id ? { ...usr, status: "removido" as const } : usr);
        saveMockUsuarios(updated as any);
        setLocalUsers(updated);
        toast.success("Usuário removido da escola.");
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: Usuario["status"]) => {
    switch (status) {
      case "ativo": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>;
      case "pendente": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendente</Badge>;
      case "bloqueado": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Bloqueado</Badge>;
      case "removido": return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Arquivado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {isDevOrDebug && <DiagnosticPanel />}
      
      {isDevOrDebug && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600">
              <Bug className="h-4 w-4" />
              <span className="text-xs font-mono">Debug Mode: {debugInfo?.version || "Loading..."}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDebug(!showDebug)}
              className="text-[10px] h-7"
            >
              {showDebug ? "Ocultar Diagnóstico" : "Ver Diagnóstico"}
            </Button>
          </div>

          {showDebug && debugInfo && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <Bug className="h-4 w-4" /> Painel de Diagnóstico Supabase
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono">
                  <div className="space-y-1 bg-white p-2 rounded border border-amber-100">
                    <p className="font-bold text-amber-700 underline">Ambiente:</p>
                    <p>Runtime URL: {debugInfo.env.supabaseUrl}</p>
                    <p>User: {debugInfo.user.email} ({debugInfo.user.role})</p>
                    <p>ID: {debugInfo.user.id}</p>
                  </div>
                  <div className="space-y-1 bg-white p-2 rounded border border-amber-100">
                    <p className="font-bold text-amber-700 underline">Consultas Simples (RLS Check):</p>
                    <p>profile_escolas: {debugInfo.test_profile_escolas.error ? `FAIL [${debugInfo.test_profile_escolas.error.code}]` : `OK (${debugInfo.test_profile_escolas.count})`}</p>
                    <p>profiles: {debugInfo.test_profiles.error ? `FAIL [${debugInfo.test_profiles.error.code}]` : `OK (${debugInfo.test_profiles.count})`}</p>
                    <p>escolas: {debugInfo.test_escolas.error ? `FAIL [${debugInfo.test_escolas.error.code}]` : `OK (${debugInfo.test_escolas.count})`}</p>
                  </div>
                </div>
                {debugInfo.final_query_error && (
                  <div className="p-2 bg-red-100 border border-red-200 rounded text-red-800 text-[10px] font-mono">
                    <p className="font-bold">ERRO QUERY FINAL:</p>
                    <p>[{debugInfo.final_query_error.code}] {debugInfo.final_query_error.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Usuários do Sistema</h1>
            <p className="text-sm text-slate-500">Gerencie professores e administradores de laboratório.</p>
          </div>
        </div>
        {(isAdminPlataforma || (isAdminLab && activeTab === "professores")) && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openModal()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo {papel === "professor" ? "Professor" : "Administrador"}
          </Button>
        )}
      </header>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {isAdminPlataforma && (
          <TabsList className="bg-slate-100 p-1 mb-2">
            <TabsTrigger value="professores" className="data-[state=active]:bg-white">Professores</TabsTrigger>
            <TabsTrigger value="usuarios_lab" className="data-[state=active]:bg-white">Usuários Laboratório</TabsTrigger>
          </TabsList>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              className="pl-10" 
              placeholder={`Buscar ${activeTab === "professores" ? "professores" : "usuários"} por nome ou e-mail...`} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            {isAdminPlataforma && (
              <Select value={selectedEscolaId || "todas"} onValueChange={(val) => setSelectedEscolaId(val === "todas" ? "todas" : val)}>
                <SelectTrigger className="mb-2">
                  <SelectValue placeholder="Filtrar por Escola" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as escolas</SelectItem>
                  {escolas.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="bloqueado">Bloqueados</SelectItem>
                <SelectItem value="removido">Arquivados</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 shadow-sm mt-4">
            <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Modo Protótipo:</span> As alterações são salvas localmente.
            </div>
          </div>
        )}

        <TabsContent value={activeTab} className="mt-6">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  {isAdminPlataforma && (selectedEscolaId === "todas" || !selectedEscolaId) && <TableHead>Escola</TableHead>}
                  {activeTab === "professores" && <TableHead>Disciplinas</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isAdminPlataforma ? 6 : 5} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-slate-500">Carregando usuários...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdminPlataforma ? 6 : 5} className="h-24 text-center text-slate-500">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-slate-900">{u.nome}</TableCell>
                      <TableCell className="text-slate-500">{u.email}</TableCell>
                      {isAdminPlataforma && (selectedEscolaId === "todas" || !selectedEscolaId) && (
                        <TableCell className="text-slate-500">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {escolas.find(e => e.id === u.escola_id)?.nome || "Não definida"}
                          </div>
                        </TableCell>
                      )}
                      {activeTab === "professores" && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.disciplinas?.map(d => (
                              <Badge key={d} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                                {d}
                              </Badge>
                            )) || <span className="text-slate-300 text-xs">-</span>}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{getStatusBadge(u.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {u.status === "pendente" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={loading}
                              title="Aprovar"
                              onClick={async () => {
                                if (isSupabaseConfigured) {
                                  setLoading(true);
                                  try {
                                    const { error } = await supabase.functions.invoke('manage-user', {
                                      body: { action: 'update', userData: { id: u.id, status: 'ativo' } }
                                    });
                                    if (error) throw error;
                                    toast.success("Acesso aprovado!");
                                    fetchUsers();
                                  } catch (err: any) {
                                    toast.error("Erro ao aprovar usuário");
                                  } finally {
                                    setLoading(false);
                                  }
                                } else {
                                  const updated = localUsers.map(usr => usr.id === u.id ? { ...usr, status: "ativo" as const } : usr);
                                  saveMockUsuarios(updated as any);
                                  setLocalUsers(updated);
                                  toast.success("Acesso aprovado!");
                                }
                              }} 
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8 w-8 p-0"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {(isAdminPlataforma || (isAdminLab && u.papel === "professor")) && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openModal(u)} 
                                className="h-8 w-8 p-0" 
                                disabled={loading}
                                title="Editar"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={loading}
                                title={u.status === 'bloqueado' ? 'Ativar' : 'Bloquear'}
                                className="text-amber-600 hover:bg-amber-50 border-amber-100 h-8 w-8 p-0"
                                onClick={async () => {
                                  const actionName = u.status === 'bloqueado' ? 'Ativar' : 'Bloquear';
                                  if (confirm(`Deseja ${actionName} o professor ${u.nome}?`)) {
                                    if (isSupabaseConfigured) {
                                      setLoading(true);
                                      try {
                                        const nextStatus = u.status === 'bloqueado' ? 'ativo' : 'bloqueado';
                                        const { error } = await supabase.functions.invoke('manage-user', {
                                          body: { action: 'update', userData: { id: u.id, status: nextStatus } }
                                        });
                                        if (error) throw error;
                                        toast.success(`Usuário ${nextStatus === 'bloqueado' ? 'bloqueado' : 'ativado'} com sucesso.`);
                                        fetchUsers();
                                      } catch (err: any) {
                                        toast.error("Erro ao alterar status do usuário");
                                      } finally {
                                        setLoading(false);
                                      }
                                    } else {
                                      const nextStatus = u.status === 'bloqueado' ? 'ativo' : 'bloqueado';
                                      const updated = localUsers.map(usr => usr.id === u.id ? { ...usr, status: nextStatus as any } : usr);
                                      saveMockUsuarios(updated as any);
                                      setLocalUsers(updated);
                                      toast.success(`Usuário ${nextStatus === 'bloqueado' ? 'bloqueado' : 'ativado'}.`);
                                    }
                                  }
                                }}
                              >
                                <Power className="h-4 w-4" />
                              </Button>

                              <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={loading || u.status === 'removido'}
                                title="Remover da escola"
                                className="text-red-600 hover:bg-red-50 border-red-100 h-8 w-8 p-0"
                                onClick={() => handleRemoverUsuario(u)}
                              >
                                <ArchiveX className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 md:hidden pb-20">
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900">{u.nome}</h3>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  {getStatusBadge(u.status)}
                </div>
                {isAdminPlataforma && (
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {escolas.find(e => e.id === u.escola_id)?.nome}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {u.status === "pendente" && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                      onClick={async () => {
                        if (isSupabaseConfigured) {
                          setLoading(true);
                          try {
                            const { error } = await supabase.functions.invoke('manage-user', {
                              body: { action: 'update', userData: { id: u.id, status: 'ativo' } }
                            });
                            if (error) throw error;
                            toast.success("Acesso aprovado!");
                            fetchUsers();
                          } catch (err: any) {
                            toast.error("Erro ao aprovar usuário");
                          } finally {
                            setLoading(false);
                          }
                        } else {
                          const updated = localUsers.map(usr => usr.id === u.id ? { ...usr, status: "ativo" as const } : usr);
                          saveMockUsuarios(updated as any);
                          setLocalUsers(updated);
                          toast.success("Acesso aprovado!");
                        }
                      }}
                    >
                      Aprovar
                    </Button>
                  )}

                  {(isAdminPlataforma || (isAdminLab && u.papel === "professor")) && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openModal(u)}>
                        Editar
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-amber-600 border-amber-100"
                        onClick={async () => {
                          const actionName = u.status === 'bloqueado' ? 'Ativar' : 'Bloquear';
                          if (confirm(`Deseja ${actionName} o professor ${u.nome}?`)) {
                            if (isSupabaseConfigured) {
                              setLoading(true);
                              try {
                                const nextStatus = u.status === 'bloqueado' ? 'ativo' : 'bloqueado';
                                const { error } = await supabase.functions.invoke('manage-user', {
                                  body: { action: 'update', userData: { id: u.id, status: nextStatus } }
                                });
                                if (error) throw error;
                                toast.success(`Usuário ${nextStatus === 'bloqueado' ? 'bloqueado' : 'ativado'} com sucesso.`);
                                fetchUsers();
                              } catch (err: any) {
                                toast.error("Erro ao alterar status do usuário");
                              } finally {
                                setLoading(false);
                              }
                            } else {
                              const nextStatus = u.status === 'bloqueado' ? 'ativo' : 'bloqueado';
                              const updated = localUsers.map(usr => usr.id === u.id ? { ...usr, status: nextStatus as any } : usr);
                              saveMockUsuarios(updated as any);
                              setLocalUsers(updated);
                              toast.success(`Usuário ${nextStatus === 'bloqueado' ? 'bloqueado' : 'ativado'}.`);
                            }
                          }
                        }}
                      >
                        {u.status === 'bloqueado' ? 'Ativar' : 'Bloquear'}
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={u.status === 'removido'}
                        className="flex-1 text-red-600 border-red-100"
                        onClick={() => handleRemoverUsuario(u)}
                      >
                        Remover
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUserId ? (senha ? "Alterar Senha e Dados" : "Editar Usuário") : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
          <form onSubmit={handleSalvarUsuario} className="space-y-4 py-4 relative">
            {editingUserId && isSupabaseConfigured && (
              <div className="bg-amber-50 p-2 rounded text-[10px] text-amber-700 border border-amber-100 flex gap-2">
                <Key className="h-3 w-3 shrink-0" />
                <span>Preencha o campo "Nova Senha" apenas se desejar alterar a senha deste usuário.</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João Silva" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@escola.com" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senha">{editingUserId ? "Nova Senha (opcional)" : "Senha"}</Label>
                <Input id="senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} required={!editingUserId} />
              </div>
              {!editingUserId && (
                <div className="space-y-2">
                  <Label htmlFor="confirmar">Confirmar Senha</Label>
                  <Input id="confirmar" type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required />
                </div>
              )}
            </div>

            <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="escola" className="text-blue-900 font-bold">Escola vinculada</Label>
                <Badge variant="outline" className="bg-white text-[10px] h-5">Obrigatório</Badge>
              </div>
              {isAdminPlataforma ? (
                <Select value={escolaId} onValueChange={setEscolaId}>
                  <SelectTrigger id="escola" className="bg-white border-blue-200 focus:ring-blue-500">
                    <SelectValue placeholder="Selecione a escola do usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {escolas.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-white border rounded-lg text-sm text-slate-600 font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {escolas.find(e => e.id === (profile?.escola_id || escolaId))?.nome || "Sua Escola"}
                </div>
              )}
              <p className="text-[10px] text-blue-600 mt-1 leading-tight">
                <span className="font-bold">Nota:</span> "Escola vinculada" é a escola onde este usuário terá acesso. "Escola ativa" no topo do painel é apenas o seu filtro atual de visualização.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de usuário</Label>
              <div className="flex gap-3">
                <label 
                  className={`flex flex-1 items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${papel === "professor" ? "border-blue-600 bg-blue-50" : "bg-white"}`}
                >
                  <input type="radio" name="papel" value="professor" checked={papel === "professor"} onChange={(e) => setPapel(e.target.value as any)} className="sr-only" />
                  <span className="text-sm font-medium">Professor</span>
                </label>
                
                {isAdminPlataforma && (
                  <label 
                    className={`flex flex-1 items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${papel === "admin_lab" ? "border-blue-600 bg-blue-50" : "bg-white"}`}
                  >
                    <input type="radio" name="papel" value="admin_lab" checked={papel === "admin_lab"} onChange={(e) => setPapel(e.target.value as any)} className="sr-only" />
                    <span className="text-sm font-medium">Admin Lab</span>
                  </label>
                )}
              </div>
            </div>

            {papel === "professor" && (
              <div className="space-y-2">
                <Label htmlFor="disciplinas">Disciplinas (separadas por vírgula)</Label>
                <Input id="disciplinas" value={disciplinas} onChange={e => setDisciplinas(e.target.value)} placeholder="Ex: Matemática, Física" />
              </div>
            )}

            {editingUserId && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    <SelectItem value="removido">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={loading}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingUserId ? "Salvar Alterações" : "Cadastrar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProfessoresPage;