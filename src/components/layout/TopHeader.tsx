import { useAuth } from "../../contexts/AuthContext";
import { escolas } from "../../data/mockData";
import { Building, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const TopHeader = () => {
  const { profile, selectedEscolaId, setSelectedEscolaId } = useAuth();
  const escola = escolas.find(e => e.id === (selectedEscolaId || profile?.escola_id));
  const isAdminPlataforma = profile?.role === "admin_plataforma";

  const handleEscolaChange = (id: string) => {
    const novaEscola = escolas.find(e => e.id === id);
    setSelectedEscolaId(id);
    if (novaEscola) {
      toast.success(`Escola ativa alterada para ${novaEscola.nome}`);
    }
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-[40]">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          {/* Mobile logo could go here if sidebar is hidden */}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 hidden sm:inline uppercase tracking-wider">
            {isAdminPlataforma ? "Escola ativa:" : "Minha escola:"}
          </span>
          
          {isAdminPlataforma ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all border border-blue-200 group shadow-sm">
                  <Building className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span className="text-xs font-bold truncate max-w-[120px] sm:max-w-[200px]">
                    {escola?.nome || "Selecionar Escola"}
                  </span>
                  <ChevronRight className="h-3 w-3 shrink-0 group-data-[state=open]:rotate-90 transition-transform text-blue-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 z-[50]">
                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase border-b mb-1">
                  Mudar escola ativa
                </div>
                {escolas.map((e) => (
                  <DropdownMenuItem 
                    key={e.id}
                    onClick={() => handleEscolaChange(e.id)}
                    className={cn(
                      "text-xs cursor-pointer py-2 px-3",
                      selectedEscolaId === e.id && "bg-blue-50 text-blue-700 font-bold"
                    )}
                  >
                    <Building className={cn("h-3 w-3 mr-2", selectedEscolaId === e.id ? "text-blue-600" : "text-slate-400")} />
                    {e.nome}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm",
              profile?.role === "admin_lab" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                : "bg-blue-50 text-blue-700 border-blue-100"
            )}>
              <Building className={cn("h-3.5 w-3.5 shrink-0", profile?.role === "admin_lab" ? "text-emerald-600" : "text-blue-600")} />
              <span className="text-xs font-bold truncate max-w-[150px] sm:max-w-none">{escola?.nome || "Sem Escola"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-bold text-slate-900 leading-none">{profile?.full_name}</span>
          <span className="text-[10px] text-slate-500 mt-1 capitalize">{profile?.role.replace("_", " ")}</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {profile?.full_name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
