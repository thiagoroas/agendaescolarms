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
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r bg-white md:flex">
      <div className="flex flex-col p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="rounded-lg bg-blue-600 p-1.5 text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">Agenda Escolar</span>
        </div>
        <p className="text-xs text-slate-500 font-medium truncate">{escola?.nome || "Sem Escola"}</p>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600 rounded-l-none" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}

        {filteredAdmin.length > 0 && (
          <>
            <div className="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Administração</div>
            {filteredAdmin.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600 rounded-l-none" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}

        {filteredPlatform.length > 0 && (
          <>
            <div className="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Plataforma</div>
            {filteredPlatform.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600 rounded-l-none" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto p-4 border-t">
        <div className="flex flex-col gap-1 mb-4 px-3">
          <p className="text-sm font-semibold text-slate-900 truncate">{user?.nome}</p>
          <p className="text-xs text-slate-500 capitalize">{user?.papel.replace("_", " ")}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
