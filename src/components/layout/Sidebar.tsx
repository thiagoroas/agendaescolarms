import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEscolas } from "@/hooks/useEscolas";
import { 
  Calendar, 
  ChevronDown,
  Building,
  LogOut
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigation } from "@/hooks/useNavigation";

const Sidebar = () => {
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
          <div className="rounded-xl bg-white/20 backdrop-blur-md p-2.5 text-white shadow-lg border border-white/20 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="lg:block hidden group-hover/sidebar:block transition-all overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Agenda Escolar</h1>
            <p className="text-[10px] font-medium text-blue-100/70 mt-1 uppercase tracking-wider">Laboratório de Informática</p>
          </div>
        </div>

        <div className="mb-2 lg:block hidden group-hover/sidebar:block">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/50 mb-3 block px-1">
            {profile?.role === "admin_plataforma" ? "Plataforma" : "Minha escola"}
          </label>
          
          <div className="relative group/select">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 shadow-lg backdrop-blur-md cursor-pointer",
              !escola 
                ? "bg-red-500/20 border-red-400/30" 
                : "bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
            )}>
              <div className={cn(
                "rounded-xl p-2 text-white shrink-0 shadow-inner",
                !escola ? "bg-red-500" : "bg-blue-500/50 backdrop-blur-sm"
              )}>
                <Building className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-bold text-white truncate leading-none">
                    {loading ? "Carregando..." : (escola?.nome || "Sem escola")}
                  </p>
                  <ChevronDown className="h-3.5 w-3.5 text-blue-100/50 shrink-0" />
                </div>
                <p className={cn(
                  "text-[10px] mt-1.5 font-semibold truncate leading-none uppercase tracking-wide",
                  !escola ? "text-red-300" : "text-blue-100/70"
                )}>
                  {!escola ? "Vínculo ausente" : "Trocar escola"}
                </p>
              </div>
            </div>
            {profile?.role === "admin_plataforma" && (
              <select 
                value={selectedEscolaId || ""} 
                onChange={(e) => handleEscolaChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Trocar escola"
              >
                {escolas.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-8 p-4 overflow-y-auto scrollbar-hide">
        {sections.map((section, idx) => (
          <div key={section.title || idx} className="space-y-3">
            {section.title && (
              <div className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-100/40 lg:block hidden group-hover/sidebar:block truncate">
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
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 group border border-transparent",
                      isActive 
                        ? "bg-white/15 text-white font-bold border-white/10 shadow-lg backdrop-blur-sm" 
                        : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300",
                        isActive 
                          ? "bg-white text-blue-700 shadow-md" 
                          : "bg-white/10 text-blue-100/50 group-hover:bg-white/20 group-hover:text-white"
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

      <div className="mt-auto p-4 space-y-3 border-t border-white/10 bg-black/10 backdrop-blur-md">
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 group border border-transparent",
              isActive 
                ? "bg-white/15 border-white/20 shadow-lg" 
                : "hover:bg-white/5"
            )
          }
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-white/20 group-hover:ring-white/40 transition-all shrink-0">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 lg:flex hidden group-hover/sidebar:flex transition-all">
            <p className="text-sm font-bold text-white truncate leading-tight">{profile?.full_name}</p>
            <p className="text-[10px] font-medium text-blue-100/60 uppercase tracking-wider mt-0.5">Meu Perfil</p>
          </div>
        </NavLink>
        
        <button
          onClick={async () => {
            const { error } = await logout();
            if (error) {
              toast.error("Erro ao sair do sistema");
              return;
            }
            navigate("/login", { replace: true });
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
    </aside>
  );
};

export default Sidebar;