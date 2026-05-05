import { 
  Calendar, 
  BookOpen, 
  User, 
  Users, 
  Monitor, 
  ClipboardList, 
  Building2, 
  LayoutDashboard,
  CheckCircle,
  Bell,
  Clock,
  LucideIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  roles?: string[];
  badge?: number;
}

export interface NavigationSection {
  title?: string;
  items: MenuItem[];
}

export const useNavigation = () => {
  const { profile } = useAuth();
  const role = profile?.role || "";

  const mainItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Agenda", path: "/agenda" },
    { 
      icon: BookOpen, 
      label: role === "professor" ? "Minhas Reservas" : "Gerenciar Reservas", 
      path: "/minhas-reservas" 
    },
    { icon: User, label: "Perfil", path: "/perfil" },
  ];

  const adminItems: MenuItem[] = [
    { icon: CheckCircle, label: "Central do Laboratório", path: "/admin/aprovacoes", roles: ["admin_lab", "admin_plataforma"] },
    { icon: Bell, label: "Avisos", path: "/admin/avisos", roles: ["admin_lab", "admin_plataforma"] },
    { icon: Clock, label: "Horários", path: "/admin/horarios", roles: ["admin_lab", "admin_plataforma"] },
    { icon: Users, label: "Professores", path: "/admin/professores", roles: ["admin_lab", "admin_plataforma"] },
    { icon: Monitor, label: "Recursos", path: "/admin/recursos", roles: ["admin_lab", "admin_plataforma"] },
    { icon: ClipboardList, label: "Todas as Reservas", path: "/admin/reservas", roles: ["admin_lab", "admin_plataforma"] },
  ];

  const platformItems: MenuItem[] = [
    { icon: Building2, label: "Escolas", path: "/admin/escolas", roles: ["admin_plataforma"] },
  ];

  const filterItems = (items: MenuItem[]) => 
    items.filter(item => !item.roles || item.roles.includes(role));

  const sections: NavigationSection[] = [
    { items: filterItems(mainItems) },
    { title: "Administração", items: filterItems(adminItems) },
    { title: "Plataforma", items: filterItems(platformItems) },
  ].filter(section => section.items.length > 0);

  return { sections, role };
};
