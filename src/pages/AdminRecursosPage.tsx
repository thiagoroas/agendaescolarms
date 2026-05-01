import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { recursos, Recurso } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Monitor, Laptop, Projector, MoreHorizontal, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const AdminRecursosPage = () => {
  const { user } = useAuth();
  const schoolRecursos = recursos.filter(r => r.escola_id === user?.escola_id);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "laboratorio": return <Laptop className="h-5 w-5" />;
      case "projetor": return <Projector className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recursos</h1>
          <p className="text-sm text-slate-500">Cadastre laboratórios, projetores e outros itens para reserva.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
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
              <Badge variant={r.ativo ? "default" : "secondary"} className={r.ativo ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
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
                <Button variant="outline" size="sm" className={r.ativo ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"} onClick={() => toast.success("Status alterado")}>
                  {r.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminRecursosPage;
