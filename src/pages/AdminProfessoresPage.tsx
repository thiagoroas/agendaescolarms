import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usuarios, escolas, Usuario } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Shield, UserX, UserCheck, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const AdminProfessoresPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  const schoolProfessors = usuarios.filter(u => 
    u.escola_id === user?.escola_id && 
    u.papel === "professor" &&
    (u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <h1 className="text-2xl font-bold text-slate-900">Professores</h1>
          <p className="text-sm text-slate-500">Gerencie o acesso dos professores da sua unidade.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Professor
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

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schoolProfessors.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-slate-900">{p.nome}</TableCell>
                <TableCell className="text-slate-500">{p.email}</TableCell>
                <TableCell>{getStatusBadge(p.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {p.status === "pendente" && (
                      <Button variant="outline" size="sm" onClick={() => toast.success("Professor aprovado!")} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => toast.success("Configurações abertas")}>
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProfessoresPage;
