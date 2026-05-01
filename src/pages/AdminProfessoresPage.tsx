import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usuarios, Usuario } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, UserCheck, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AdminProfessoresPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [localUsers, setLocalUsers] = useState<Usuario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Form State
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [papel, setPapel] = useState<"professor" | "admin_lab">("professor");

  useEffect(() => {
    setLocalUsers(usuarios);
  }, []);

  const schoolUsers = localUsers.filter(u => 
    u.escola_id === user?.escola_id && 
    (u.papel === "professor" || u.papel === "admin_lab") &&
    (u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSalvarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || nome.trim().length < 3) { toast.error("Nome inválido (mínimo 3 caracteres)"); return; }
    if (!email.trim() || !email.includes("@")) { toast.error("E-mail inválido"); return; }
    if (senha.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres"); return; }
    if (senha !== confirmarSenha) { toast.error("As senhas não coincidem"); return; }

    const novoUsuario: Usuario = {
      id: "user-" + Date.now(),
      nome: nome.trim(),
      email: email.trim(),
      escola_id: user?.escola_id || "",
      papel: papel,
      status: "ativo"
    };

    setLocalUsers(prev => [novoUsuario, ...prev]);
    
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmarSenha("");
    setPapel("professor");
    setIsModalOpen(false);
    
    toast.success(`${papel === "professor" ? "Professor" : "Admin do Laboratório"} cadastrado com sucesso!`);
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
          <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500">Gerencie professores e administradores de laboratório.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input 
          className="pl-10" 
          placeholder="Buscar por nome ou e-mail..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schoolUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-slate-900">{u.nome}</TableCell>
                <TableCell className="text-slate-500">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {u.papel === "admin_lab" ? "Admin Lab" : "Professor"}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(u.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {u.status === "pendente" && (
                      <Button variant="outline" size="sm" onClick={() => toast.success("Acesso aprovado!")} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => toast.info("Edição em breve")}>
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:hidden pb-20">
        {schoolUsers.map((u) => (
          <div key={u.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{u.nome}</h3>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
              {getStatusBadge(u.status)}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize text-[10px]">
                {u.papel === "admin_lab" ? "Admin Lab" : "Professor"}
              </Badge>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Edição em breve")}>
                Editar
              </Button>
              {u.status === "pendente" && (
                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.success("Acesso aprovado!")}>
                  Aprovar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
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
                <Label htmlFor="senha">Senha</Label>
                <Input id="senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar Senha</Label>
                <Input id="confirmar" type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block text-sm font-medium text-slate-700">Tipo de usuário</Label>
              <div className="flex gap-3">
                <label 
                  className="flex flex-1 items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all hover:border-blue-300"
                  style={{
                    borderColor: papel === "professor" ? "#2563EB" : "#E2E8F0",
                    backgroundColor: papel === "professor" ? "#EFF6FF" : "white"
                  }}
                >
                  <input type="radio" name="papel" value="professor" checked={papel === "professor"} onChange={(e) => setPapel(e.target.value as any)} className="sr-only" />
                  <span className="text-sm font-medium">Professor</span>
                </label>
                
                {user?.papel === "admin_plataforma" && (
                  <label 
                    className="flex flex-1 items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all hover:border-blue-300"
                    style={{
                      borderColor: papel === "admin_lab" ? "#2563EB" : "#E2E8F0",
                      backgroundColor: papel === "admin_lab" ? "#EFF6FF" : "white"
                    }}
                  >
                    <input type="radio" name="papel" value="admin_lab" checked={papel === "admin_lab"} onChange={(e) => setPapel(e.target.value as any)} className="sr-only" />
                    <span className="text-sm font-medium">Admin Lab</span>
                  </label>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Cadastrar Usuário</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProfessoresPage;