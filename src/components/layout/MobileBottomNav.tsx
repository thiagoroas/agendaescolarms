import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Calendar, BookOpen, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel !== "professor";

  return (
    <nav className="fixed bottom-0 left-0 flex w-full items-center justify-around border-t border-slate-100 bg-white/90 backdrop-blur-lg px-2 py-3 md:hidden z-40 pb-safe">
      <NavLink
        to="/agenda"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center gap-1.5 p-1 transition-all duration-300",
            isActive ? "text-blue-600 scale-110 font-bold" : "text-slate-400"
          )
        }
      >
        <Calendar className={cn("h-6 w-6 transition-all", "stroke-[2.5px]")} />
        <span className="text-[10px] tracking-tight uppercase font-black">Agenda</span>
      </NavLink>
      <NavLink
        to="/minhas-reservas"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center gap-1.5 p-1 transition-all duration-300",
            isActive ? "text-blue-600 scale-110 font-bold" : "text-slate-400"
          )
        }
      >
        <BookOpen className={cn("h-6 w-6 transition-all", "stroke-[2.5px]")} />
        <span className="text-[10px] tracking-tight uppercase font-black">Reservas</span>
      </NavLink>
      <NavLink
        to="/perfil"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center gap-1.5 p-1 transition-all duration-300",
            isActive ? "text-blue-600 scale-110 font-bold" : "text-slate-400"
          )
        }
      >
        <User className={cn("h-6 w-6 transition-all", "stroke-[2.5px]")} />
        <span className="text-[10px] tracking-tight uppercase font-black">Perfil</span>
      </NavLink>
      {isAdmin && (
        <NavLink
          to="/admin/professores"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1.5 p-1 transition-all duration-300",
              isActive ? "text-blue-600 scale-110 font-bold" : "text-slate-400"
            )
          }
        >
          <Settings className={cn("h-6 w-6 transition-all", "stroke-[2.5px]")} />
          <span className="text-[10px] tracking-tight uppercase font-black">Painel</span>
        </NavLink>
      )}
    </nav>
  );
};

export default MobileBottomNav;
