import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Escola } from "../data/mockData";
import { useEscolas } from "@/hooks/useEscolas";
import { Button } from "@/components/ui/button";
import { Plus, Building2, MapPin, Search, ExternalLink, Edit2, Power, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const AdminEscolasPage = () => {
  const { profile } = useAuth();
  const { escolas, loading, createEscola, updateEscola, toggleEscolaStatus, deleteEscola, getEscolaStats, deleteEscolaTeste } = useEscolas();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTestDeleteModalOpen, setIsTestDeleteModalOpen] = useState(false);
  const [escolaToDelete, setEscolaToDelete] = useState<Escola | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<{users: number, resources: number, reservations: number, announcements: number, schedules: number} | null>(null);
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const isAdminPlataforma = profile?.role === "admin_plataforma";

  // Form state
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [createDefaultResources, setCreateDefaultResources] = useState(false);

  const filteredEscolas = escolas
    .filter(e => 
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.cidade.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Ativas primeiro
      if (a.status === "ativa" && b.status === "inativa") return -1;
      if (a.status === "inativa" && b.status === "ativa") return 1;
      return a.nome.localeCompare(b.nome);
    });

  const handleOpenModal = (escola?: Escola) => {
    if (escola) {
      setEditingEscola(escola);
      setNome(escola.nome);
      setCidade(escola.cidade);
      setEstado(escola.estado);
    } else {
      setEditingEscola(null);
      setNome("");
      setCidade("");
      setEstado("");
    }
    setEndereco("");
    setTelefone("");
    setIsModalOpen(true);
  };

  const handleSalvarEscola = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!cidade.trim()) { toast.error("Cidade é obrigatória"); return; }
    if (!estado) { toast.error("Estado é obrigatório"); return; }

    if (editingEscola) {
      const success = await updateEscola(editingEscola.id, {
        nome: nome.trim(),
        cidade: cidade.trim(),
        estado
      });
      if (success) setIsModalOpen(false);
    } else {
      const result = await createEscola({
        nome: nome.trim(),
        cidade: cidade.trim(),
        estado
      }, createDefaultResources);
      if (result) setIsModalOpen(false);
    }
  };

  const handleDeleteClick = async (escola: Escola) => {
    setEscolaToDelete(escola);
    setIsDeleteModalOpen(true);
    setLoadingStats(true);
    const s = await getEscolaStats(escola.id);
    setStats(s);
    setLoadingStats(false);
  };

  const handleTestDeleteClick = async (escola: Escola) => {
    setEscolaToDelete(escola);
    setIsTestDeleteModalOpen(true);
    setConfirmName("");
    setLoadingStats(true);
    const s = await getEscolaStats(escola.id);
    setStats(s);
    setLoadingStats(false);
  };

  const handleConfirmDelete = async () => {
    if (!escolaToDelete) return;
    setIsDeleting(true);
    const success = await deleteEscola(escolaToDelete.id);
    setIsDeleting(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setEscolaToDelete(null);
      setStats(null);
    }
  };

  const handleConfirmTestDelete = async () => {
    if (!escolaToDelete || confirmName !== escolaToDelete.nome) return;
    setIsDeleting(true);
    const success = await deleteEscolaTeste(escolaToDelete.id);
    setIsDeleting(false);
    if (success) {
      setIsTestDeleteModalOpen(false);
      setEscolaToDelete(null);
      setStats(null);
      setConfirmName("");
    }
  };

  const ufs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciar Escolas</h1>
          <p className="text-sm text-slate-500">Administração global das instituições da plataforma.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Escola
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input 
          className="pl-10" 
          placeholder="Buscar escola por nome ou cidade..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Carregando escolas...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 pb-20 md:pb-0">
          {filteredEscolas.map((e) => (
            <Card key={e.id} className="border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition-colors">
              <CardHeader className="bg-slate-50/50 pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-xl bg-white border shadow-sm flex items-center justify-center text-blue-600">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">{e.nome}</CardTitle>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{e.cidade}, {e.estado}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={e.status === "ativa" ? "default" : "secondary"} className={e.status === "ativa" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                    {e.status === "ativa" ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="bg-white border-t p-4 flex flex-col sm:flex-row justify-between gap-3">
                <Button variant="outline" size="sm" className="flex-1 h-10" onClick={() => handleOpenModal(e)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "flex-1 h-10",
                    e.status === "ativa" ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"
                  )}
                  onClick={() => toggleEscolaStatus(e.id, e.status)}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {e.status === "ativa" ? "Inativar" : "Ativar"}
                </Button>
                {isAdminPlataforma && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                    onClick={() => handleDeleteClick(e)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
          {filteredEscolas.length === 0 && (
            <div className="col-span-full py-20 text-center border rounded-xl bg-slate-50 border-dashed">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma escola encontrada.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEscola ? "Editar Escola" : "Nova Escola"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarEscola} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome_escola">Nome da Escola</Label>
              <Input id="nome_escola" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: E.E. 26 de Agosto" required />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" value={cidade} onChange={e => setCidade(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select onValueChange={setEstado} value={estado}>
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ufs.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço (Opcional)</Label>
              <Input id="endereco" value={endereco} onChange={e => setEndereco(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (Opcional)</Label>
              <Input id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 0000-0000" />
            </div>
            {!editingEscola && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="createResources" 
                  checked={createDefaultResources} 
                  onCheckedChange={(checked) => setCreateDefaultResources(!!checked)}
                />
                <Label htmlFor="createResources" className="text-xs cursor-pointer">
                  Criar recursos padrão: Laboratório de Informática e Projetor
                </Label>
              </div>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingEscola ? "Salvar Alterações" : "Salvar Escola"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
        setIsDeleteModalOpen(open);
        if (!open) { setStats(null); setEscolaToDelete(null); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir a escola <strong>{escolaToDelete?.nome}</strong>?
              
              {loadingStats ? (
                <div className="flex items-center gap-2 mt-4 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando dados vinculados...</span>
                </div>
              ) : stats ? (
                <div className="mt-4 space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                    <p className="font-semibold text-slate-700 mb-2">Checklist de Vínculos:</p>
                    <div className="flex justify-between">
                      <span>Usuários (Professores/Lab):</span>
                      <span className={stats.users > 0 ? "text-red-600 font-bold" : "text-emerald-600"}>{stats.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recursos:</span>
                      <span className={stats.resources > 0 ? "text-red-600 font-bold" : "text-emerald-600"}>{stats.resources}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reservas:</span>
                      <span className={stats.reservations > 0 ? "text-red-600 font-bold" : "text-emerald-600"}>{stats.reservations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avisos:</span>
                      <span className={stats.announcements > 0 ? "text-red-600 font-bold" : "text-emerald-600"}>{stats.announcements}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span>Horários Padrão:</span>
                      <span className="text-blue-600 font-medium">{stats.schedules}</span>
                    </div>
                  </div>

                  { (stats.users > 0 || stats.resources > 0 || stats.reservations > 0 || stats.announcements > 0) ? (
                    <p className="text-red-600 font-medium text-sm">
                      Esta escola possui usuários, recursos, reservas ou avisos vinculados. Para preservar o histórico, inative a escola em vez de excluir.
                    </p>
                  ) : stats.schedules > 0 ? (
                    <p className="text-amber-600 font-medium text-sm">
                      Esta escola possui apenas horários padrão. Eles serão removidos junto com a escola.
                    </p>
                  ) : (
                    <p className="text-slate-600 text-sm">
                      Esta escola não possui dados vinculados e pode ser removida com segurança.
                    </p>
                  )}
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={handleConfirmDelete}
              disabled={isDeleting || loadingStats || (stats ? (stats.users > 0 || stats.resources > 0 || stats.reservations > 0 || stats.announcements > 0) : false)}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEscolasPage;