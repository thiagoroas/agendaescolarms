import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { Recurso } from "../data/mockData";
import { useRecursos } from "@/hooks/useRecursos";
import { Button } from "@/components/ui/button";
import { Plus, Monitor, Laptop, Projector, Settings2, School, Trash2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const AdminRecursosPage = () => {
  const { profile, selectedEscolaId } = useAuth();
  const { recursos, loading, createRecurso, updateRecurso, toggleRecursoAtivo, deleteRecurso, getRecursoStats } = useRecursos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecurso, setEditingRecurso] = useState<Recurso | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recursoToDelete, setRecursoToDelete] = useState<Recurso | null>(null);
  const [deleteStats, setDeleteStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("outro");
  const [corPersonalizada, setCorPersonalizada] = useState<string | null>(null);


  const mapToDbTipo = (uiTipo: string) => {
    switch (uiTipo) {
      case "laboratorio": return "laboratorio";
      case "projetor": return "equipamento";
      case "sala": return "sala";
      case "equipamento": return "equipamento";
      case "informatica": return "equipamento";
      default: return "equipamento";
    }
  };

  const categorias = [
    { value: "laboratorio", label: "Laboratório", cor_fundo: "#DBEAFE", cor_texto: "#1E40AF", cor_borda: "#93C5FD" },
    { value: "projetor", label: "Projetor / Audiovisual", cor_fundo: "#D1FAE5", cor_texto: "#065F46", cor_borda: "#6EE7B7" },
    { value: "sala", label: "Sala / Espaço", cor_fundo: "#FEF3C7", cor_texto: "#92400E", cor_borda: "#FCD34D" },
    { value: "equipamento", label: "Equipamento", cor_fundo: "#FCE7F3", cor_texto: "#9D174D", cor_borda: "#F9A8D4" },
    { value: "informatica", label: "Informática / Dispositivo", cor_fundo: "#E0E7FF", cor_texto: "#3730A3", cor_borda: "#A5B4FC" },
    { value: "outro", label: "Outro", cor_fundo: "#F1F5F9", cor_texto: "#334155", cor_borda: "#CBD5E1" },
  ];

  const coresDisponiveis = [
    { nome: "Azul", cor_fundo: "#DBEAFE", cor_texto: "#1E40AF", cor_borda: "#93C5FD" },
    { nome: "Verde", cor_fundo: "#D1FAE5", cor_texto: "#065F46", cor_borda: "#6EE7B7" },
    { nome: "Amarelo", cor_fundo: "#FEF3C7", cor_texto: "#92400E", cor_borda: "#FCD34D" },
    { nome: "Rosa", cor_fundo: "#FCE7F3", cor_texto: "#9D174D", cor_borda: "#F9A8D4" },
    { nome: "Índigo", cor_fundo: "#E0E7FF", cor_texto: "#3730A3", cor_borda: "#A5B4FC" },
    { nome: "Roxo", cor_fundo: "#F3E8FF", cor_texto: "#6B21A8", cor_borda: "#C4B5FD" },
    { nome: "Laranja", cor_fundo: "#FFEDD5", cor_texto: "#9A3412", cor_borda: "#FDBA74" },
    { nome: "Cinza", cor_fundo: "#F1F5F9", cor_texto: "#334155", cor_borda: "#CBD5E1" },
  ];

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "laboratorio": return <Laptop className="h-5 w-5" />;
      case "projetor": return <Projector className="h-5 w-5" />;
      case "sala": return <School className="h-5 w-5" />;
      case "informatica": return <Laptop className="h-5 w-5" />;
      case "equipamento": return <Monitor className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };


  const handleSalvarRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }

    const categoriaSelecionada = categorias.find(c => c.value === tipo) || categorias[categorias.length - 1];
    const corSelecionada = corPersonalizada 
      ? coresDisponiveis.find(c => c.cor_fundo === corPersonalizada) || categoriaSelecionada
      : categoriaSelecionada;

    const targetEscolaId = selectedEscolaId || profile?.escola_id || "";

    if (editingRecurso) {
      const success = await updateRecurso(editingRecurso.id, {
        nome: nome.trim(),
        tipo: isSupabaseConfigured ? mapToDbTipo(tipo) : tipo,
        cor_fundo: corSelecionada.cor_fundo,
        cor_texto: corSelecionada.cor_texto,
        cor_borda: corSelecionada.cor_borda,
      });
      if (success) {
        setIsModalOpen(false);
        resetForm();
      }
    } else {
      const result = await createRecurso({
        escola_id: targetEscolaId,
        nome: nome.trim(),
        tipo: isSupabaseConfigured ? mapToDbTipo(tipo) : tipo,
        cor_fundo: corSelecionada.cor_fundo,
        cor_texto: corSelecionada.cor_texto,
        cor_borda: corSelecionada.cor_borda,
        ativo: true,
      });

      if (result) {
        setIsModalOpen(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setNome("");
    setTipo("outro");
    setCorPersonalizada(null);
    setEditingRecurso(null);
  };

  const handleEdit = (recurso: Recurso) => {
    setEditingRecurso(recurso);
    setNome(recurso.nome);
    setTipo(recurso.tipo);
    setCorPersonalizada(recurso.cor_fundo);
    setIsModalOpen(true);
  };

  const handleToggle = async (id: string, ativo: boolean) => {
    await toggleRecursoAtivo(id, ativo);
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Gestão de Recursos</h1>
          <p className="text-sm font-medium text-slate-500">Administre laboratórios, projetores e equipamentos da escola.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-6 rounded-2xl shadow-xl shadow-blue-100 font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-5 w-5 stroke-[3px]" />
          Novo Recurso
        </Button>
      </header>

      {!isSupabaseConfigured && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3 shadow-sm">
          <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Modo Protótipo Ativo:</span> O cadastro e alteração de recursos são salvos localmente no seu navegador. As mudanças serão mantidas entre recarregamentos de página.
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 text-center font-bold text-slate-400">Carregando recursos...</div>
        ) : recursos.length === 0 ? (
          <div className="col-span-full py-20 text-center font-bold text-slate-400">Nenhum recurso cadastrado para esta escola.</div>
        ) : (
          recursos.map((r) => (
            <Card key={r.id} className="group overflow-hidden border-slate-100 bg-white rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 border-2">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                <div 
                  className="h-14 w-14 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundColor: r.cor_fundo, color: r.cor_texto, borderColor: r.cor_borda }}
                >
                  {getIcon(r.tipo)}
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant={r.ativo ? "default" : "secondary"} 
                    className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                      r.ativo ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {r.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Excluir Recurso?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-slate-500">
                          Esta ação não pode ser desfeita. O recurso será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteRecurso(r.id)} className="bg-red-500 hover:bg-red-600 rounded-xl font-bold uppercase tracking-widest text-[10px]">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-1">{r.nome}</CardTitle>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
                  {r.tipo}
                </div>
                
                <div className="flex gap-3">
                  <Button variant="ghost" size="sm" className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all" onClick={() => handleEdit(r)}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "flex-[1.5] h-11 rounded-xl font-black uppercase tracking-widest transition-all", 
                      r.ativo ? "text-red-500 hover:bg-red-50 border-red-100 hover:border-red-200" : "text-emerald-500 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-200"
                    )} 
                    onClick={() => handleToggle(r.id, r.ativo)}
                  >
                    {r.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>


      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md p-0 border-none rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">
                {editingRecurso ? "Editar Recurso" : "Novo Recurso"}
              </DialogTitle>
            </DialogHeader>

            <p className="text-blue-100 text-sm font-medium mt-1 opacity-90">Cadastre laboratórios, projetores e equipamentos.</p>
          </div>

          <form onSubmit={handleSalvarRecurso} className="p-8 space-y-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Recurso</Label>
              <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Laboratório de Química, Tablet 01..." className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</Label>
              <Select onValueChange={setTipo} value={tipo}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-blue-500 transition-all font-bold">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {categorias.map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="font-bold text-slate-600 focus:text-blue-600 focus:bg-blue-50 rounded-lg">{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paleta de Cor</Label>
              <div className="flex flex-wrap gap-3 pt-1">
                {coresDisponiveis.map(cor => (
                  <button
                    key={cor.nome}
                    type="button"
                    onClick={() => setCorPersonalizada(cor.cor_fundo)}
                    className={cn(
                      "h-10 w-10 rounded-2xl border-4 transition-all relative overflow-hidden",
                      corPersonalizada === cor.cor_fundo 
                        ? "border-blue-600 scale-110 shadow-lg shadow-blue-100" 
                        : "border-white hover:scale-105 shadow-sm"
                    )}
                    style={{ backgroundColor: cor.cor_fundo }}
                  >
                    {corPersonalizada === cor.cor_fundo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-600/10">
                        <Plus className="h-4 w-4 text-blue-600 stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl font-black uppercase tracking-widest text-slate-400">Cancelar</Button>
              <Button type="submit" className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">Salvar Recurso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRecursosPage;