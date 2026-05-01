import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { escolas, Escola } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Building2, MapPin, CheckCircle2, XCircle, Search, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const AdminEscolasPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEscolas = escolas.filter(e => 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciar Escolas</h1>
          <p className="text-sm text-slate-500">Administração global das instituições da plataforma.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
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

      <div className="grid gap-6 md:grid-cols-2">
        {filteredEscolas.map((e) => (
          <Card key={e.id} className="border-slate-200 shadow-sm overflow-hidden">
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
            <CardFooter className="bg-white border-t p-4 flex justify-between gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success("Agenda acessada")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Acessar Agenda
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Edição")}>
                Editar Dados
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminEscolasPage;
