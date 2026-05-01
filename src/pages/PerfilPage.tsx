import { useAuth } from "../contexts/AuthContext";
import { escolas } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User as UserIcon, Mail, Building, Shield } from "lucide-react";

const PerfilPage = () => {
  const { user, logout } = useAuth();
  const escola = escolas.find(e => e.id === user?.escola_id);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin_plataforma": return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Admin Plataforma</Badge>;
      case "admin_lab": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Admin Lab</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Professor</Badge>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
        <p className="text-sm text-slate-500">Informações da sua conta no sistema.</p>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.nome.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">{user?.nome}</CardTitle>
              <div className="mt-1">{getRoleBadge(user?.papel || "")}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-[24px_1fr] gap-4 items-center">
            <Mail className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">E-mail</p>
              <p className="text-slate-900 font-medium">{user?.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[24px_1fr] gap-4 items-center">
            <Building className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Escola</p>
              <p className="text-slate-900 font-medium">{escola?.nome}</p>
            </div>
          </div>

          <div className="grid grid-cols-[24px_1fr] gap-4 items-center">
            <Shield className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Papel</p>
              <p className="text-slate-900 font-medium capitalize">{user?.papel.replace("_", " ")}</p>
            </div>
          </div>

          <div className="pt-6 border-t mt-6">
            <Button variant="destructive" className="w-full sm:w-auto" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilPage;
