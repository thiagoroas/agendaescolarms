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
        <SheetContent side="right" className="w-[min(85vw,360px)] p-0 border-l-0 bg-slate-50 shadow-2xl overflow-hidden flex flex-col">
          {/* Header com Degradê similar à Sidebar */}
          <div className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] p-6 pb-8 text-white relative shrink-0">
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
                <p className="text-[10px] font-bold text-blue-100/70 uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {profile?.role === "admin_plataforma" ? "Admin Plataforma" : 
                   profile?.role === "admin_lab" ? "Admin Laboratório" : "Professor"}
                </p>
              </div>
            </div>
            {/* Elemento decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-slate-50 -mt-4 rounded-t-2xl relative z-20 overflow-hidden">
            <div className="p-6 pb-2 shrink-0">
              {/* Unidade Ativa Card */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 block px-1">
                  {isAdminPlataforma ? "Unidade em Gestão" : "Minha Unidade"}
                </label>
                
                {isAdminPlataforma ? (
                  <div className="relative group overflow-hidden">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 group-active:scale-[0.98] group-active:bg-slate-50 transition-all shadow-sm">
                      <div className="bg-blue-600 rounded-xl p-2.5 text-white shrink-0 shadow-md">
                        <Building className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-[13px] font-extrabold text-slate-900 truncate leading-tight">
                          {loading ? "Carregando..." : (escola?.nome || "Selecionar...")}
                        </p>
                        <p className="text-[11px] text-blue-600 font-bold mt-1">Toque para trocar unidade</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <select 
                      value={selectedEscolaId || ""} 
                      onChange={(e) => handleEscolaChange(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      {escolas.map(e => (
                        <option key={e.id} value={e.id}>{e.nome}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="bg-slate-800 rounded-xl p-2.5 text-white shrink-0">
                      <Building className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-extrabold text-slate-900 truncate">
                        {escola?.nome || "Sem Unidade"}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Unidade vinculada</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <nav className="space-y-8 pb-8">
                {sections.map((section, idx) => (
                  <div key={section.title || idx} className="space-y-3">
                    {section.title && (
                      <div className="px-1 flex items-center gap-2">
                        <div className="h-[1px] flex-1 bg-slate-200" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
                          {section.title}
                        </span>
                        <div className="h-[1px] flex-1 bg-slate-200" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-2.5">
                      {section.items.map((item) => (
                        <SheetClose asChild key={item.path}>
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              cn(
                                "flex flex-row items-center gap-4 rounded-2xl px-4 py-4 min-h-[60px] w-full transition-all duration-300 group border",
                                isActive 
                                  ? "bg-white text-blue-700 font-bold shadow-md border-blue-100 ring-2 ring-blue-50" 
                                  : "bg-white text-slate-600 border-slate-100 hover:border-blue-200 active:scale-[0.98] shadow-sm"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                  isActive ? "bg-blue-600 text-white shadow-blue-200 shadow-lg" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600"
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

            {/* Bloco 4: Ação de Sair */}
            <div className="p-5 bg-white border-t border-slate-100 shrink-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
              <button
                onClick={async () => {
                  try {
                    await logout();
                    navigate("/login", { replace: true });
                  } catch (error) {
                    toast.error("Erro ao sair");
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 px-4 py-4.5 text-[15px] font-extrabold text-red-600 transition-all active:scale-[0.98] border border-red-100 hover:bg-red-100/50 shadow-sm"
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