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
  LayoutDashboard
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
import { toast } from "sonner";

const MobileBottomNav = () => {
  const { profile, logout, selectedEscolaId, setSelectedEscolaId } = useAuth();
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
    <nav className="fixed bottom-0 left-0 flex w-full items-center justify-around border-t border-slate-100 bg-white/95 backdrop-blur-md px-2 py-3 md:hidden z-50 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
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
        <SheetContent side="right" className="w-[85%] sm:w-[400px] p-0 border-l border-slate-100 bg-white shadow-2xl">
          <div className="flex flex-col h-full overflow-hidden">
            <SheetHeader className="p-6 border-b border-slate-50 text-left bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4 mb-6 pr-10">
                <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xl font-bold">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <SheetTitle className="text-lg font-bold text-slate-900 truncate">{profile?.full_name}</SheetTitle>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    {profile?.role === "admin_plataforma" ? "Administrador Plataforma" : 
                     profile?.role === "admin_lab" ? "Usuário Laboratório" : "Professor"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block px-1">
                  {isAdminPlataforma ? "Unidade Ativa" : "Sua Unidade"}
                </label>
                
                {isAdminPlataforma ? (
                  <div className="relative">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors active:bg-slate-100">
                      <div className="bg-slate-900 rounded-lg p-2 text-white shrink-0">
                        <Building className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {loading ? "Carregando..." : (escola?.nome || "Selecionar...")}
                        </p>
                        <p className="text-[10px] text-blue-600 font-bold mt-0.5">Tocar para trocar unidade</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
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
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="bg-slate-900 rounded-lg p-2 text-white shrink-0">
                      <Building className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {escola?.nome || "Sem Unidade"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <nav className="space-y-8 pb-10">
                {sections.map((section, idx) => (
                  <div key={section.title || idx} className="space-y-3">
                    {section.title && (
                      <div className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        {section.title}
                      </div>
                    )}
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <SheetClose asChild key={item.path}>
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3.5 rounded-xl px-4 py-3 min-h-[48px] transition-all duration-200",
                                isActive 
                                  ? "bg-blue-50 text-blue-700 font-bold" 
                                  : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <item.icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-400")} />
                                <span className="text-sm">{item.label}</span>
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

            <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-20">
              <button
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-50 px-4 py-4 text-sm font-bold text-red-600 transition-all active:scale-[0.98] border border-red-100"
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