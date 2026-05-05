import { useAuth } from "../../contexts/AuthContext";
import { useEscolas } from "@/hooks/useEscolas";
import { Building, ChevronRight, Loader2 } from "lucide-react";
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
  const { profile, selectedEscolaId, setSelectedEscolaId, vinculos } = useAuth();
  const { escolas, loading } = useEscolas();
  
  const escola = escolas.find(e => e.id === (selectedEscolaId || profile?.escola_id));
  const isAdminPlataforma = profile?.role === "admin_plataforma";
  const hasMultipleVinculos = vinculos.length > 1;

  const handleEscolaChange = (id: string) => {
    const novaEscola = escolas.find(e => e.id === id);
    setSelectedEscolaId(id);
    if (novaEscola) {
      toast.success(`Escola ativa alterada para ${novaEscola.nome}`);
    }
  };

  return (
    <header className="h-[calc(4rem+env(safe-area-inset-top,0px))] border-b bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-[40] pt-[env(safe-area-inset-top,0px)]">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 w-full max-w-full">
          {isAdminPlataforma ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 hidden sm:inline uppercase tracking-wider shrink-0">
                Escola ativa:
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all border border-blue-200 group shadow-sm min-w-0">
                    <Building className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span className="text-xs font-bold truncate max-w-[120px] sm:max-w-[300px]">
                      {loading ? "Carregando..." : (escola?.nome || "Selecionar Escola")}
                    </span>
                    <ChevronRight className="h-3 w-3 shrink-0 group-data-[state=open]:rotate-90 transition-transform text-blue-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 z-[50] max-h-[70vh] overflow-y-auto">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase border-b mb-1">
                    Mudar escola ativa
                  </div>
                  {escolas.map((e) => (
                    <DropdownMenuItem 
                      key={e.id}
                      onClick={() => handleEscolaChange(e.id)}
                      className={cn(
                        "text-xs cursor-pointer py-2 px-3 flex items-center justify-between gap-2",
                        selectedEscolaId === e.id && "bg-blue-50 text-blue-700 font-bold"
                      )}
                    >
                      <div className="flex items-center min-w-0">
                        <Building className={cn("h-3.5 w-3.5 mr-2 shrink-0", selectedEscolaId === e.id ? "text-blue-600" : "text-slate-400")} />
                        <span className="truncate">{e.nome}</span>
                      </div>
                      {selectedEscolaId === e.id && (
                        <Badge variant="secondary" className="text-[8px] h-4 px-1 bg-blue-100 text-blue-700 border-transparent shrink-0">
                          Atual
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : hasMultipleVinculos ? (
            <div className="flex items-center gap-3 w-full sm:w-auto bg-blue-50/50 border border-blue-100 rounded-xl px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="hidden sm:flex flex-col shrink-0">
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter leading-none mb-0.5">
                  Você está em
                </span>
                <span className="text-[10px] font-medium text-slate-500 leading-none">
                  Trocar unidade
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-blue-700 hover:bg-blue-50 transition-all border border-blue-200 group shadow-sm flex-1 sm:flex-initial min-w-0"
                    aria-label="Trocar escola ativa"
                  >
                    <Building className="h-4 w-4 shrink-0 text-blue-600" />
                    <div className="flex flex-col items-start min-w-0 text-left">
                      <span className="text-xs font-black truncate max-w-[150px] sm:max-w-[250px] leading-tight">
                        {escola?.nome || "Selecionar Escola"}
                      </span>
                      <span className="text-[9px] font-bold text-blue-600 sm:hidden">
                        Trocar escola ▼
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-blue-100 shrink-0">
                      <span className="text-[10px] font-bold text-blue-600 uppercase">Trocar</span>
                      <ChevronRight className="h-3 w-3 group-data-[state=open]:rotate-90 transition-transform text-blue-400" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 z-[50] shadow-xl border-blue-100">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase border-b mb-1 flex items-center gap-2">
                    <Building className="h-3 w-3" /> Minhas Unidades Vinculadas
                  </div>
                  {vinculos.map((v) => (
                    <DropdownMenuItem 
                      key={v.escola_id}
                      onClick={() => handleEscolaChange(v.escola_id)}
                      className={cn(
                        "text-xs cursor-pointer py-3 px-3 flex items-center justify-between gap-3 transition-colors",
                        selectedEscolaId === v.escola_id ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center min-w-0 gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          selectedEscolaId === v.escola_id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                        )}>
                          <Building className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-bold">{v.escola?.nome || "Escola"}</span>
                          <span className="text-[10px] font-medium text-slate-500 capitalize">
                            {v.papel === "admin_lab" ? "Administrador" : "Professor"}
                          </span>
                        </div>
                      </div>
                      {selectedEscolaId === v.escola_id ? (
                        <Badge className="bg-blue-600 text-white text-[8px] h-5 px-1.5 shrink-0">
                          Atual
                        </Badge>
                      ) : (
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm",
              !escola ? "bg-red-50 text-red-700 border-red-100" :
              profile?.role === "admin_lab" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                : "bg-blue-50 text-blue-700 border-blue-100"
            )}>
              <Building className={cn("h-3.5 w-3.5 shrink-0", 
                !escola ? "text-red-600" :
                profile?.role === "admin_lab" ? "text-emerald-600" : "text-blue-600"
              )} />
              <div className="flex flex-col">
                <span className="text-xs font-bold truncate max-w-[150px] sm:max-w-none leading-tight">
                  {escola?.nome || "Sem escola vinculada"}
                </span>
                {!escola && (
                  <span className="text-[9px] font-medium text-red-500 leading-none">
                    Procure o administrador da unidade.
                  </span>
                )}
              </div>
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
