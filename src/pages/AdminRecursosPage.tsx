import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { recursos, Recurso } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Monitor, Laptop, Projector, Settings2, School, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const AdminRecursosPage = () => {
  const { user } = useAuth();
  const [localRecursos, setLocalRecursos] = useState<Recurso[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("outro");
  const [corPersonalizada, setCorPersonalizada] = useState<string | null>(null);

  useEffect(() => {
    setLocalRecursos(recursos);
  }, []);

  const schoolRecursos = localRecursos.filter(r => r.escola_id === user?.escola_id);

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
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  const handleSalvarRecurso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }

    const categoriaSelecionada = categorias.find(c => c.value === tipo) || categorias[categorias.length - 1];
    const corSelecionada = corPersonalizada 
      ? coresDisponiveis.find(c => c.cor_fundo === corPersonalizada) || categoriaSelecionada
      : categoriaSelecionada;

    const novoRecurso: Recurso = {
      id: "rec-" + Date.now(),
      escola_id: user?.escola_id || "",
      nome: nome.trim(),
      tipo,
      cor_fundo: corSelecionada.cor_fundo,
      cor_texto: corSelecionada.cor_texto,
      cor_borda: corSelecionada.cor_borda,
      ativo: true,
    };

    setLocalRecursos(prev => [...prev, novoRecurso]);
    setNome("");
    setTipo("outro");
    setCorPersonalizada(null);
    setIsModalOpen(false);
    toast.success("Recurso cadastrado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recursos</h1>
          <p className="text-sm text-slate-500">Cadastre laboratórios, projetores e outros itens para reserva.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Recurso
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schoolRecursos.map((r) => (
          <Card key={r.id} className="overflow-hidden border-slate-200 hover:border-blue-300 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center border"
                style={{ backgroundColor: r.cor_fundo, color: r.cor_texto, borderColor: r.cor_borda }}
              >
                {getIcon(r.tipo)}
              </div>
              <Badge variant={r.ativo ? "default" : "secondary"} className={r.ativo ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" : ""}>
                {r.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg font-bold text-slate-900">{r.nome}</CardTitle>
              <p className="text-xs text-slate-500 capitalize mt-1">Tipo: {r.tipo}</p>
              
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Edição em breve")}>
                  <Settings2 className="mr-2 h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className={r.ativo ? "text-red-600 hover:bg-red-50 border-red-100" : "text-emerald-600 hover:bg-emerald-50 border-emerald-100"} onClick={() => toast.success("Status alterado")}>
                  {r.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Recurso</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarRecurso} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Recurso</Label>
              <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Caixa de Som, Projetor 2, Kit Robótica..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Categoria</Label>
              <Select onValueChange={setTipo} value={tipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cor personalizada (opcional)</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {coresDisponiveis.map(cor => (
                  <button
                    key={cor.nome}
                    type="button"
                    onClick={() => setCorPersonalizada(cor.cor_fundo)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      corPersonalizada === cor.cor_fundo ? "border-slate-900 scale-110 shadow-sm" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: cor.cor_fundo }}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Salvar Recurso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRecursosPage;