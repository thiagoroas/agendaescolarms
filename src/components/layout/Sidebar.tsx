import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEscolas } from "@/hooks/useEscolas";
import { 
  Calendar, 
  BookOpen, 
  User, 
  Users, 
  Monitor, 
  ClipboardList, 
  Building2, 
  LogOut,
  LayoutDashboard,
  CheckCircle,
  ChevronDown,
  Building,
  Bell
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Sidebar = () => {
  const { profile, logout, selectedEscolaId, setSelectedEscolaId } = useAuth();
  const { escolas, loading } = useEscolas();
  const escola = escolas.find(e => e.id === (selectedEscolaId || profile?.escola_id));

  const handleEscolaChange = (id: string) => {
    const novaEscola = escolas.find(e => e.id === id);
    setSelectedEscolaId(id);
    if (novaEscola) {
      toast.success(`Escola ativa alterada para ${novaEscola.nome}`);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Agenda", path: "/agenda" },
    { icon: BookOpen, label: "Minhas Reservas", path: "/minhas-reservas" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ];

  const adminItems = [
    { icon: CheckCircle, label: "Central do Laboratório", path: "/admin/aprovacoes", roles: ["admin_lab", "admin_plataforma"] },
    { icon: Bell, label: "Avisos", path: "/admin/avisos", roles: ["admin_lab", "admin_plataforma"] },
    { icon: Users, label: "Professores", path: "/admin/professores", roles: ["admin_lab", "admin_plataforma"] },
    { icon: Monitor, label: "Recursos", path: "/admin/recursos", roles: ["admin_lab", "admin_plataforma"] },
    { icon: ClipboardList, label: "Todas as Reservas", path: "/admin/reservas", roles: ["admin_lab", "admin_plataforma"] },
  ];

  const platformItems = [
    { icon: Building2, label: "Escolas", path: "/admin/escolas", roles: ["admin_plataforma"] },
  ];

  const filteredAdmin = adminItems.filter(i => i.roles.includes(profile?.role || ""));
  const filteredPlatform = platformItems.filter(i => i.roles?.includes(profile?.role || ""));

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-[264px] flex-col border-r bg-white md:flex z-40">
      <div className="flex flex-col p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-blue-600 p-2 text-white shadow-sm">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Agenda Escolar</span>
        </div>

        {profile?.role === "admin_plataforma" ? (
          <div className="mb-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1.5 block px-1">
              Escola ativa
            </label>
            <div className="relative group">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100/50 transition-all duration-200 cursor-pointer shadow-sm group-hover:shadow group-focus-within:ring-2 group-focus-within:ring-blue-100">
                <div className="bg-blue-600 rounded-lg p-2 text-white shrink-0 shadow-sm">
                  <Building className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-bold text-slate-900 truncate leading-none">
                      {loading ? "Carregando..." : (escola?.nome || "Selecione...")}
                    </p>
                    <ChevronDown className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  </div>
                  <p className="text-[10px] text-blue-600/80 mt-1 font-medium truncate leading-none">
                    Troque para gerenciar outra escola
                  </p>
                </div>
              </div>
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
            </div>
          </div>
        ) : (
          <div className="mb-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block px-1">
              Minha escola
            </label>
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 shadow-sm",
              profile?.role === "admin_lab" 
                ? "bg-emerald-50 border-emerald-100" 
                : "bg-blue-50 border-blue-100"
            )}>
              <div className={cn(
                "rounded-lg p-2 text-white shrink-0 shadow-sm",
                profile?.role === "admin_lab" ? "bg-emerald-600" : "bg-blue-600"
              )}>
                <Building className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate leading-none">
                  {escola?.nome || "Sem Escola"}
                </p>
                <p className={cn(
                  "text-[10px] mt-1 font-medium truncate leading-none capitalize",
                  profile?.role === "admin_lab" ? "text-emerald-600" : "text-blue-600"
                )}>
                  {profile?.role === "admin_lab" ? "Usuário Laboratório" : "Professor"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4">
        <Separator className="bg-slate-100" />
      </div>

      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 group",
                isActive 
                  ? "bg-blue-50 text-blue-700 font-semibold" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-4 w-4 transition-transform", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}

        {filteredAdmin.length > 0 && (
          <>
            <div className="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Administração</div>
            <div className="space-y-0.5">
              {filteredAdmin.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 group",
                      isActive 
                        ? "bg-blue-50 text-blue-700 font-semibold" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("h-4 w-4 transition-transform", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </>
        )}

        {filteredPlatform.length > 0 && (
          <>
            <div className="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Plataforma</div>
            <div className="space-y-0.5">
              {filteredPlatform.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 group",
                      isActive 
                        ? "bg-blue-50 text-blue-700 font-semibold" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("h-4 w-4 transition-transform", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-100">
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 mb-4 px-2 py-2 rounded-lg transition-all duration-200 group",
              isActive ? "bg-slate-50 ring-1 ring-slate-100" : "hover:bg-slate-50"
            )
          }
        >
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-110 transition-transform">
            {profile?.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-blue-700 transition-colors">{profile?.full_name}</p>
            <p className="text-[10px] font-medium text-slate-500 capitalize truncate">Meu Perfil</p>
          </div>
        </NavLink>
        <button
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 group"
        >
          <LogOut className="h-4 w-4" />
          Sair do sistema
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
