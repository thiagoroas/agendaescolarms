import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Calendar, BookOpen, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel !== "professor";

  return (
    <nav className="fixed bottom-0 left-0 flex w-full items-center justify-around border-t bg-white p-2 md:hidden z-40">
      <NavLink
        to="/agenda"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center gap-1 p-2 text-[10px]",
            isActive ? "text-blue-600" : "text-slate-400"
          )
        }
      >
        <Calendar className="h-6 w-6" />
        Agenda
      </NavLink>
      <NavLink
        to="/minhas-reservas"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center gap-1 p-2 text-[10px]",
            isActive ? "text-blue-600" : "text-slate-400"
          )
        }
      >
        <BookOpen className="h-6 w-6" />
        Reservas
      </NavLink>
      <NavLink
        to="/perfil"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center gap-1 p-2 text-[10px]",
            isActive ? "text-blue-600" : "text-slate-400"
          )
        }
      >
        <User className="h-6 w-6" />
        Perfil
      </NavLink>
      {isAdmin && (
        <NavLink
          to="/admin/professores"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 p-2 text-[10px]",
              isActive ? "text-blue-600" : "text-slate-400"
            )
          }
        >
          <Settings className="h-6 w-6" />
          Admin
        </NavLink>
      )}
    </nav>
  );
};

export default MobileBottomNav;
