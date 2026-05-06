import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEscolas } from "@/hooks/useEscolas";
import { 
  Calendar, 
  BookOpen, 
  User, 
  Menu, 
  LogOut,
  Building,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Sheet, 
  SheetContent, 
  SheetTitle, 
  SheetTrigger,
  SheetClose,
  SheetDescription
} from "@/components/ui/sheet";
import { useNavigation } from "@/hooks/useNavigation";
import { toast } from "sonner";

const MobileBottomNav = () => {
  const { profile, logout, selectedEscolaId, setSelectedEscolaId } = useAuth();
  const navigate = useNavigate();
  const { escolas, loading } = useEscolas();
  const { sections } = useNavigation();
  
  const escola = escolas.find(e => e.id === (selectedEscolaId || profile?.escola_id));
  const isAdminPlataforma = profile?.role === "admin_plataforma";

  const handleEscolaChange = (id: string) => {
    const novaEscola = escolas.find(e => e.id === id);
    setSelectedEscolaId(id);
    if (novaEscola) {
      toast.success(`Escola ativa alterada para ${novaEscola.nome}`);
    }
  };

  const mainNavItems = [
    { icon: LayoutDashboard, label: "Início", path: "/dashboard" },
    { icon: Calendar, label: "Agenda", path: "/agenda" },
    { icon: BookOpen, label: "Reservas", path: "/minhas-reservas" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 flex w-full items-center justify-around border-t border-slate-100 bg-white/95 backdrop-blur-md px-2 py-3 md:hidden z-50 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      {mainNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 p-1 transition-all duration-200",
              isActive ? "text-blue-600 font-bold" : "text-slate-400"
            )
          }
        >
          <item.icon className={cn("h-5 w-5", "stroke-[2.2px]")} />
          <span className="text-[10px] tracking-tight uppercase font-bold">{item.label}</span>
        </NavLink>
      ))}

      <Sheet>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-blue-600 transition-all">
            <Menu className="h-5 w-5 stroke-[2.2px]" />
            <span className="text-[10px] tracking-tight uppercase font-bold">Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[min(85vw,360px)] p-0 border-l-0 bg-gradient-to-b from-[#1E3A8A] via-[#2563EB] to-[#1E1B4B] shadow-2xl overflow-hidden flex flex-col">
          {/* Header similar à Sidebar Desktop */}
          <div className="p-6 pb-8 text-white relative shrink-0 border-b border-white/10">
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl font-bold shadow-lg border border-white/20">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <SheetTitle className="text-xl font-black text-white truncate leading-tight">
                  {profile?.full_name}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Menu de navegação e configurações do usuário
                </SheetDescription>
                <p className="text-[10px] font-bold text-[#BFDBFE] uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {profile?.role === "admin_plataforma" ? "Admin Plataforma" : 
                   profile?.role === "admin_lab" ? "Admin Laboratório" : "Professor"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 relative z-20 overflow-hidden">
            <div className="p-6 pb-2 shrink-0">
              {/* Unidade Ativa Card - Estilo Sidebar Desktop */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C7D2FE] block px-1">
                  {isAdminPlataforma ? "Unidade em Gestão" : "Minha Unidade"}
                </label>
                
                <div className="relative group overflow-hidden">
                  <div className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 shadow-lg backdrop-blur-md border",
                    !escola 
                      ? "bg-red-500/20 border-red-400/30" 
                      : "bg-white/10 border-white/20 active:bg-white/20 active:border-white/30"
                  )}>
                    <div className={cn(
                      "rounded-xl p-2.5 text-white shrink-0 shadow-md",
                      !escola ? "bg-red-500" : "bg-blue-500/60 backdrop-blur-sm"
                    )}>
                      <Building className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[13px] font-extrabold text-[#FFFFFF] truncate leading-tight">
                        {loading ? "Carregando..." : (escola?.nome || "Sem Unidade")}
                      </p>
                      <p className={cn(
                        "text-[11px] font-bold mt-1 uppercase tracking-wider",
                        !escola ? "text-red-300" : "text-[#BFDBFE]"
                      )}>
                        {!escola ? "Vínculo ausente" : "Toque para trocar"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#DBEAFE] shrink-0" />
                  </div>
                  <select 
                    value={selectedEscolaId || ""} 
                    onChange={(e) => handleEscolaChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  >
                    {!escola && <option value="">Selecionar...</option>}
                    {escolas.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
              <nav className="space-y-8 pb-8">
                {sections.map((section, idx) => (
                  <div key={section.title || idx} className="space-y-3">
                    {section.title && (
                      <div className="px-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#C7D2FE] truncate">
                        {section.title}
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-2">
                      {section.items.map((item) => (
                        <SheetClose asChild key={item.path}>
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              cn(
                                "flex flex-row items-center gap-4 rounded-2xl px-4 py-3.5 w-full transition-all duration-300 group border border-transparent font-medium",
                                isActive 
                                  ? "bg-white/20 text-[#FFFFFF] font-bold border-white/22 shadow-lg backdrop-blur-sm" 
                                  : "text-[#DBEAFE] hover:bg-white/10 hover:text-white"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                  isActive 
                                    ? "bg-white text-blue-700 shadow-md" 
                                    : "bg-white/15 text-[#BFDBFE]"
                                )}>
                                  <item.icon className={cn("h-5 w-5 shrink-0")} />
                                </div>
                                <span className="text-[15px] font-bold tracking-tight">{item.label}</span>
                                {item.badge && item.badge > 0 && (
                                  <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg border border-red-400/20">
                                    {item.badge}
                                  </span>
                                )}
                              </>
                            )}
                          </NavLink>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Logout Estilo Sidebar Desktop */}
            <div className="p-5 mt-auto border-t border-white/10 bg-black/20 backdrop-blur-md">
              <button
                onClick={async () => {
                  try {
                    await logout();
                    navigate("/login", { replace: true });
                  } catch (error) {
                    toast.error("Erro ao sair");
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-500/10 px-4 py-4 text-[15px] font-bold text-red-400 transition-all active:scale-[0.98] border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 shadow-sm uppercase tracking-widest"
              >
                <LogOut className="h-5 w-5" />
                SAIR DO SISTEMA
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MobileBottomNav;