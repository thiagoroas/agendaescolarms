import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEscolas } from "@/hooks/useEscolas";
import { 
  Calendar, 
  ChevronDown,
  Building,
  LogOut,
  Check
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigation } from "@/hooks/useNavigation";

const Sidebar = () => {
  if (typeof window !== 'undefined') {
    (window as any).SIDEBAR_VERSION = "sidebar-theme-v2-2026-05-05";
  }
  const { profile, logout, selectedEscolaId, setSelectedEscolaId } = useAuth();
  const navigate = useNavigate();
  const { escolas, loading } = useEscolas();
  const { sections } = useNavigation();
  const escola = escolas.find(e => e.id === (selectedEscolaId || profile?.escola_id));

  const handleEscolaChange = (id: string) => {
    const novaEscola = escolas.find(e => e.id === id);
    setSelectedEscolaId(id);
    if (novaEscola) {
      toast.success(`Escola ativa alterada para ${novaEscola.nome}`);
    }
  };

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-[80px] lg:w-[264px] flex-col bg-gradient-to-b from-[#1E3A8A] via-[#2563EB] to-[#1E1B4B] md:flex z-40 transition-[width] duration-300 group/sidebar overflow-hidden hover:w-[264px] shadow-2xl pt-[env(safe-area-inset-top,0px)] border-r border-white/10">
      <div className="flex flex-col p-4 lg:p-5">
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="rounded-xl bg-white shadow-lg border border-white/20 shrink-0 overflow-hidden h-9 w-9 flex items-center justify-center p-0.5">
            <img src="/icon-192.png" alt="Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div className="lg:block hidden group-hover/sidebar:block transition-all overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-[#FFFFFF] leading-none">Agenda Escolar</h1>
            <p className="text-[10px] font-bold text-[#BFDBFE] mt-1 uppercase tracking-wider">Laboratório de Informática</p>
          </div>
        </div>

        <div className="mb-2 lg:block hidden group-hover/sidebar:block">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C7D2FE] mb-3 block px-1">
            {profile?.role === "admin_plataforma" ? "Plataforma" : "Minha escola"}
          </label>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 shadow-lg backdrop-blur-md cursor-pointer group/select-btn",
                !escola 
                  ? "bg-red-500/20 border-red-400/30" 
                  : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"
              )}>
                <div className={cn(
                  "rounded-xl p-2 text-white shrink-0 shadow-inner",
                  !escola ? "bg-red-500" : "bg-blue-500/60 backdrop-blur-sm"
                )}>
                  <Building className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-bold text-[#FFFFFF] truncate leading-none">
                      {loading ? "Carregando..." : (escola?.nome || "Sem escola")}
                    </p>
                    <ChevronDown className="h-3.5 w-3.5 text-[#DBEAFE] shrink-0" />
                  </div>
                  <p className={cn(
                    "text-[10px] mt-1.5 font-bold truncate leading-none uppercase tracking-wide",
                    !escola ? "text-red-300" : "text-[#BFDBFE]"
                  )}>
                    {!escola ? "Vínculo ausente" : "Trocar escola"}
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              className="w-[240px] bg-[#1E3A8A] border-white/20 text-white shadow-2xl backdrop-blur-xl z-[100]"
              align="start"
              side="right"
              sideOffset={10}
            >
              <DropdownMenuLabel className="text-[#BFDBFE] text-[10px] uppercase tracking-widest font-bold px-3 py-2">
                Selecionar Unidade
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              
              <div className="max-h-[300px] overflow-y-auto py-1">
                {escolas.length === 0 && !loading && (
                  <div className="px-3 py-4 text-center">
                    <p className="text-xs text-red-300 font-bold">Nenhum vínculo encontrado.</p>
                  </div>
                )}
                
                {escolas.map((e) => (
                  <DropdownMenuItem
                    key={e.id}
                    onClick={() => handleEscolaChange(e.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 px-3 py-3 cursor-pointer transition-colors focus:bg-white/10 focus:text-white",
                      e.id === escola?.id ? "bg-white/20" : "hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="font-bold text-sm truncate">{e.nome}</span>
                      {e.id === escola?.id && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] uppercase font-black px-1.5 py-0.5 rounded border leading-none",
                        e.id === escola?.id ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-400" : "bg-white/10 border-white/20 text-[#BFDBFE]"
                      )}>
                        {profile?.role === "admin_plataforma" ? "Admin" : 
                         profile?.role === "admin_lab" ? "Admin Lab" : "Professor"}
                      </span>
                      {e.id === escola?.id && (
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Ativo agora</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <nav className="flex-1 space-y-8 p-4 overflow-y-auto scrollbar-hide">
        {sections.map((section, idx) => (
          <div key={section.title || idx} className="space-y-3">
            {section.title && (
              <div className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#C7D2FE] lg:block hidden group-hover/sidebar:block truncate">
                {section.title}
              </div>
            )}
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 group border border-transparent font-medium",
                      isActive 
                        ? "bg-white/20 text-[#FFFFFF] font-bold border-white/22 shadow-lg backdrop-blur-sm" 
                        : "text-[#DBEAFE] hover:bg-white/10 hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300",
                        isActive 
                          ? "bg-white text-blue-700 shadow-md" 
                          : "bg-white/15 text-[#BFDBFE] group-hover:bg-white/20 group-hover:text-white"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="lg:block hidden group-hover/sidebar:block truncate tracking-tight">
                        {item.label}
                      </span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg border border-red-400/20 lg:flex hidden group-hover/sidebar:flex">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto p-4 space-y-3 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 group border border-transparent",
              isActive 
                ? "bg-white/20 border-white/22 shadow-lg" 
                : "hover:bg-white/10"
            )
          }
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-white/20 group-hover:ring-white/40 transition-all shrink-0">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 lg:flex hidden group-hover/sidebar:flex transition-all">
            <p className="text-sm font-bold text-[#FFFFFF] truncate leading-tight">{profile?.full_name}</p>
            <p className="text-[10px] font-bold text-[#BFDBFE] uppercase tracking-wider mt-0.5">Meu Perfil</p>
          </div>
        </NavLink>
        
        <button
          onClick={async () => {
            try {
              await logout();
              navigate("/login", { replace: true });
            } catch (error) {
              toast.error("Erro ao sair do sistema");
            }
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-white transition-all duration-300 hover:bg-red-500/20 group justify-center lg:justify-start group-hover/sidebar:justify-start overflow-hidden border border-transparent hover:border-red-500/30"
        >
          <LogOut className="h-4 w-4 shrink-0 text-red-400 group-hover:text-red-500 transition-colors" />
          <span className="lg:block hidden group-hover/sidebar:block truncate uppercase tracking-widest text-red-400 group-hover:text-red-300">
            Sair do sistema
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;