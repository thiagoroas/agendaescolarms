import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { escolas } from "../../data/mockData";
import { 
  Calendar, 
  BookOpen, 
  User, 
  Users, 
  Monitor, 
  ClipboardList, 
  Building2, 
  LogOut 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const escola = escolas.find(e => e.id === user?.escola_id);

  const menuItems = [
    { icon: Calendar, label: "Agenda", path: "/agenda" },
    { icon: BookOpen, label: "Minhas Reservas", path: "/minhas-reservas" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ];

  const adminItems = [
    { icon: Users, label: "Professores", path: "/admin/professores", roles: ["admin_lab", "admin_plataforma"] },
    { icon: Monitor, label: "Recursos", path: "/admin/recursos", roles: ["admin_lab", "admin_plataforma"] },
    { icon: ClipboardList, label: "Todas as Reservas", path: "/admin/reservas", roles: ["admin_lab", "admin_plataforma"] },
  ];

  const platformItems = [
    { icon: Building2, label: "Escolas", path: "/admin/escolas", roles: ["admin_plataforma"] },
  ];

  const filteredAdmin = adminItems.filter(i => i.roles.includes(user?.papel || ""));
  const filteredPlatform = platformItems.filter(i => i.roles?.includes(user?.papel || ""));

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-[264px] flex-col border-r bg-white md:flex z-40">
      <div className="flex flex-col p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="rounded-lg bg-blue-600 p-2 text-white shadow-sm">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Agenda Escolar</span>
        </div>
        <p className="text-xs text-slate-500 font-medium px-0.5 truncate">{escola?.nome || "Sem Escola"}</p>
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
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-bold border border-white shadow-sm">
            {user?.nome.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">{user?.nome}</p>
            <p className="text-[10px] font-medium text-slate-500 capitalize truncate">{user?.papel.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={logout}
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
