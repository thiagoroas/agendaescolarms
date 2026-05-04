import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { Usuario } from "../data/mockData";
import { useEscolas } from "@/hooks/useEscolas";
import { getMockUsuarios, saveMockUsuarios } from "../data/storage";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, UserCheck, Search, Info, Building2, Trash2, Edit2, Loader2, Key, Power, ArchiveX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DiagnosticPanel } from "@/components/admin/DiagnosticPanel";


const AdminProfessoresPage = () => {
  const { user, profile, selectedEscolaId, setSelectedEscolaId } = useAuth();
  const { escolas, loading: loadingEscolas } = useEscolas();
  const [searchTerm, setSearchTerm] = useState("");
  const [localUsers, setLocalUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("professores");
  
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
      try {
        let query = supabase.from("profiles").select("*");
        
        // Filter by role: professor or admin_lab
        query = query.in("papel", ["professor", "admin_lab"]);

        // Permission filtering
        if (profile?.role === "admin_lab") {
          query = query.eq("escola_id", profile.escola_id);
        } else if (profile?.role === "admin_plataforma" && selectedEscolaId) {
          // If admin plataforma has a school selected, we filter, otherwise we show all
          // But usually we want to see users of the active school
          query = query.eq("escola_id", selectedEscolaId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const mapped: Usuario[] = (data || []).map(p => ({
          id: p.id,
          nome: p.nome,
          email: p.email || "",
          escola_id: p.escola_id || "",
          papel: p.papel,
          status: p.status,
          disciplinas: p.disciplinas || [],
          senha: "" // Never expose
        }));
        setLocalUsers(mapped);
      } catch (err: any) {
        console.error("Error fetching users:", err.message);
        toast.error("Erro ao carregar usuários");
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

  const isAdminPlataforma = profile?.role === "admin_plataforma";
  const isAdminLab = profile?.role === "admin_lab";
  
  const filteredUsers = localUsers.filter(u => {
    // Tab filter
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
      setDisciplinas(u.disciplinas?.join(", ") || "");
      setStatus(u.status);
    } else {
      setEditingUserId(null);
      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
      setPapel(activeTab === "professores" ? "professor" : "admin_lab");
      setEscolaId(isAdminLab ? (profile?.escola_id || "") : (selectedEscolaId || ""));
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

    if (!escolaId) {
      toast.error("Vínculo com escola é obrigatório");
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
            console.log("[DEBUG] Invocando reset_password, token presente?", !!resetSession?.access_token);
            const { error: resetError } = await supabase.functions.invoke('manage-user', {
              body: { action: 'reset_password', userData: { id: editingUserId, password: senha } }
            });
            if (resetError) throw resetError;
            toast.success("Senha atualizada!");
          }
        } else {
          userData.password = senha;
        }

        console.log("[DEBUG] Invocando manage-user action:", action);
        const { data, error } = await supabase.functions.invoke('manage-user', {
          body: { action, userData }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast.success(editingUserId ? "Usuário atualizado!" : "Usuário cadastrado!");
        setIsModalOpen(false);
        fetchUsers();
      } catch (err: any) {
        console.error("Error managing user:", err.message);
        toast.error(`Erro: ${err.message}`);
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
            body: { action: 'update', userData: { id: u.id, status: 'removido' } }
          });
          if (error) throw error;
          toast.success("Usuário removido da escola.");
          fetchUsers();
        } catch (err: any) {
          console.error("Error removing user:", err.message);
          toast.error("Erro ao remover usuário");
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
        const updated = [{ ...novoUsuario, senha }, ...localUsers];
        saveMockUsuarios(updated as any);
        setLocalUsers(updated);
        toast.success("Cadastrado com sucesso!");
      }
      setIsModalOpen(false);
      setLoading(false);
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
      <DiagnosticPanel />
      
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários do Sistema</h1>
          <p className="text-sm text-slate-500">Gerencie professores e administradores de laboratório.</p>
        </div>
        {(isAdminPlataforma || (isAdminLab && activeTab === "professores")) && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openModal()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo {activeTab === "professores" ? "Professor" : "Administrador"}
          </Button>
        )}
      </header>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-2">
          <TabsTrigger value="professores" className="data-[state=active]:bg-white">Professores</TabsTrigger>
          <TabsTrigger value="usuarios_lab" className="data-[state=active]:bg-white">Usuários Laboratório</TabsTrigger>
        </TabsList>

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
                  {isAdminPlataforma && <TableHead>Escola</TableHead>}
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
                      {isAdminPlataforma && (
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
                          <Button variant="outline" size="sm" onClick={() => openModal(u)} className="h-8 w-8 p-0" disabled={loading}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={loading}
                            className="text-red-600 hover:bg-red-50 border-red-100 h-8 w-8 p-0"
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
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openModal(u)}>
                    Editar
                  </Button>
                  {u.status === "pendente" && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                      onClick={() => {
                        setLocalUsers(prev => {
                          const updated = prev.map(usr => usr.id === u.id ? { ...usr, status: "ativo" as const } : usr);
                          if (!isSupabaseConfigured) {
                            saveMockUsuarios(updated as any);
                          }
                          return updated;
                        });
                        toast.success("Acesso aprovado!");
                      }}
                    >
                      Aprovar
                    </Button>
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