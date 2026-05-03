import { NavLink, useLocation } from "react-router-dom";
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
  LayoutDashboard,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { useNavigation } from "@/hooks/useNavigation";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const MobileBottomNav = () => {
  const { profile, logout, selectedEscolaId, setSelectedEscolaId } = useAuth();
  const { escolas, loading } = useEscolas();
  const { sections } = useNavigation();
  const location = useLocation();
  
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
    <nav className="fixed bottom-0 left-0 flex w-full items-center justify-around border-t border-slate-100 bg-white/95 backdrop-blur-xl px-2 py-3 md:hidden z-50 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      {mainNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 p-1 transition-all duration-300 relative",
              isActive ? "text-blue-600 scale-105 font-bold" : "text-slate-400"
            )
          }
        >
          <item.icon className={cn("h-5 w-5 transition-all", "stroke-[2.5px]")} />
          <span className="text-[10px] tracking-tight uppercase font-black">{item.label}</span>
        </NavLink>
      ))}

      <Sheet>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-blue-600 transition-all">
            <Menu className="h-5 w-5 stroke-[2.5px]" />
            <span className="text-[10px] tracking-tight uppercase font-black">Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[85%] p-0 border-l-0 bg-slate-50/98 backdrop-blur-xl">
          <div className="flex flex-col h-full overflow-hidden">
            <SheetHeader className="p-6 bg-white border-b text-left">
              <div className="flex items-center gap-4 mb-6 pr-8">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-200 ring-4 ring-blue-50">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <SheetTitle className="text-lg font-black text-slate-900 truncate tracking-tight">{profile?.full_name}</SheetTitle>
                  <p className="text-xs font-bold text-blue-600/80 uppercase tracking-widest mt-0.5">
                    {profile?.role === "admin_plataforma" ? "Administrador Plataforma" : 
                     profile?.role === "admin_lab" ? "Usuário Laboratório" : "Professor"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block px-1">
                  {isAdminPlataforma ? "Escola Gerenciada" : "Sua Unidade"}
                </label>
                
                {isAdminPlataforma ? (
                  <div className="relative">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
                      <div className="bg-blue-600 rounded-xl p-2 text-white shrink-0 shadow-md shadow-blue-100">
                        <Building className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-black text-slate-900 truncate">
                          {loading ? "Carregando..." : (escola?.nome || "Selecionar...")}
                        </p>
                        <p className="text-[10px] text-blue-600 font-bold mt-0.5 uppercase tracking-wider">Trocar unidade</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-blue-300 shrink-0" />
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
                  <div className={cn(
                    "flex items-center gap-3 p-3.5 rounded-2xl border shadow-sm",
                    profile?.role === "admin_lab" 
                      ? "bg-emerald-50 border-emerald-100" 
                      : "bg-blue-50 border-blue-100"
                  )}>
                    <div className={cn(
                      "rounded-xl p-2 text-white shrink-0 shadow-md",
                      profile?.role === "admin_lab" ? "bg-emerald-600 shadow-emerald-100" : "bg-blue-600 shadow-blue-100"
                    )}>
                      <Building className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {escola?.nome || "Sem Unidade"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <nav className="space-y-8 pb-20">
                {sections.map((section, idx) => (
                  <div key={section.title || idx} className="space-y-3">
                    {section.title && (
                      <div className="px-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                        {section.title}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {section.items.map((item) => (
                        <SheetClose asChild key={item.path}>
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm transition-all duration-300 group",
                                isActive 
                                  ? "bg-white text-blue-700 font-black shadow-md shadow-slate-200/50 ring-1 ring-slate-100" 
                                  : "text-slate-600 hover:bg-white hover:text-slate-900 active:scale-95"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <item.icon className={cn("h-5 w-5 transition-transform", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                                {item.label}
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

            <div className="mt-auto p-6 bg-white border-t space-y-4">
              <button
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 px-4 py-4 text-sm font-black text-red-600 transition-all active:scale-95 border border-red-100"
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