import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { Usuario, escolas } from "../data/mockData";
import { getMockUsuarios, saveMockUsuarios } from "../data/storage";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, UserCheck, Search, Info, Building2, Trash2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const AdminProfessoresPage = () => {
  const { user, profile, selectedEscolaId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [localUsers, setLocalUsers] = useState<Usuario[]>([]);
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
  const [status, setStatus] = useState<"ativo" | "pendente" | "bloqueado">("ativo");

  useEffect(() => {
    setLocalUsers(getMockUsuarios());
  }, []);

  // Filter users based on profile role and selected school
  const isAdminPlataforma = profile?.role === "admin_plataforma";
  const isAdminLab = profile?.role === "admin_lab";
  
  const filteredUsers = localUsers.filter(u => {
    // Basic role filter: only show professor and admin_lab in this page
    if (u.papel !== "professor" && u.papel !== "admin_lab") return false;
    
    // Tab filter
    if (activeTab === "professores" && u.papel !== "professor") return false;
    if (activeTab === "usuarios_lab" && u.papel !== "admin_lab") return false;

    // Multi-school filtering
    if (!isAdminPlataforma) {
      // admin_lab can only see users from their own school
      if (u.escola_id !== profile?.escola_id) return false;
    } else if (selectedEscolaId) {
      // admin_plataforma can filter by selected school if they want
      // But typically for the "Users" list we might want to see all if no specific school is selected in the sidebar
      // However, usually selectedEscolaId is always set for admin_plataforma in this app's context
      if (u.escola_id !== selectedEscolaId) return false;
    }

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
      setSenha(""); // Don't show password for editing
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

  const handleSalvarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || nome.trim().length < 3) { toast.error("Nome inválido (mínimo 3 caracteres)"); return; }
    if (!email.trim() || !email.includes("@")) { toast.error("E-mail inválido"); return; }
    
    // Only require password on creation
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

    if (editingUserId) {
      setLocalUsers(prev => {
        const updated = prev.map(u => {
          if (u.id === editingUserId) {
            const updatedUser = {
              ...u,
              nome: nome.trim(),
              email: email.trim(),
              escola_id: isAdminPlataforma ? escolaId : u.escola_id, // Proteção escola_id para admin_lab
              papel: papel,
              status: status,
              disciplinas: papel === "professor" ? disciplinasArray : undefined,
            };
            
            // Alteração de senha se preenchida
            if (senha) {
              (updatedUser as any).senha = senha;
            }
            
            return updatedUser;
          }
          return u;
        });
        if (!isSupabaseConfigured) saveMockUsuarios(updated as any);
        return updated;
      });
      toast.success("Usuário atualizado com sucesso!");
    } else {
      const novoUsuario: Usuario = {
        id: "user-" + Date.now(),
        nome: nome.trim(),
        email: email.trim(),
        escola_id: isAdminPlataforma ? escolaId : (profile?.escola_id || ""),
        papel: papel,
        status: "ativo",
        disciplinas: papel === "professor" ? disciplinasArray : undefined
      };

      setLocalUsers(prev => {
        const updated = [{ ...novoUsuario, senha }, ...prev];
        if (!isSupabaseConfigured) saveMockUsuarios(updated as any);
        return updated;
      });
      toast.success(`${papel === "professor" ? "Professor" : "Admin do Laboratório"} cadastrado com sucesso!`);
    }
    
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: Usuario["status"]) => {
    switch (status) {
      case "ativo": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>;
      case "pendente": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendente</Badge>;
      case "bloqueado": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Bloqueado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários do Sistema</h1>
          <p className="text-sm text-slate-500">Gerencie professores e administradores de laboratório.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openModal()}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-2">
          <TabsTrigger value="professores" className="data-[state=active]:bg-white">Professores</TabsTrigger>
          <TabsTrigger value="usuarios_lab" className="data-[state=active]:bg-white">Usuários Laboratório</TabsTrigger>
        </TabsList>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            className="pl-10" 
            placeholder={`Buscar ${activeTab === "professores" ? "professores" : "usuários"} por nome ou e-mail...`} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
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
                {filteredUsers.length === 0 ? (
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
                              onClick={() => {
                                setLocalUsers(prev => {
                                  const updated = prev.map(usr => usr.id === u.id ? { ...usr, status: "ativo" as const } : usr);
                                  if (!isSupabaseConfigured) saveMockUsuarios(updated as any);
                                  return updated;
                                });
                                toast.success("Acesso aprovado!");
                              }} 
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8 w-8 p-0"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => openModal(u)} className="h-8 w-8 p-0">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:bg-red-50 border-red-100 h-8 w-8 p-0"
                            onClick={() => {
                              if (confirm(`Deseja excluir ${u.nome}?`)) {
                                setLocalUsers(prev => {
                                  const updated = prev.filter(user => user.id !== u.id);
                                  if (!isSupabaseConfigured) saveMockUsuarios(updated as any);
                                  return updated;
                                });
                                toast.success("Usuário excluído.");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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
                          if (!isSupabaseConfigured) saveMockUsuarios(updated as any);
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
            <DialogTitle>{editingUserId ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarUsuario} className="space-y-4 py-4">
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

            <div className="space-y-2">
              <Label>Escola Vinculada</Label>
              {isAdminPlataforma ? (
                <Select value={escolaId} onValueChange={setEscolaId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {escolas.filter(e => e.status === "ativa").map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-slate-50 border rounded-lg text-sm text-slate-600 font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {escolas.find(e => e.id === escolaId)?.nome || "Sua Escola"}
                </div>
              )}
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
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingUserId ? "Salvar Alterações" : "Cadastrar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProfessoresPage;