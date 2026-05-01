import React from "react";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAgenda = location.pathname === "/agenda" || location.pathname === "/";

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#f7f8fb' }}>
      <Sidebar />
      <main className="flex-1 md:ml-[264px] relative overflow-hidden h-full">
        <div className={cn(
          "h-full w-full",
          !isAgenda && "mx-auto max-w-7xl p-4 md:p-8 overflow-y-auto"
        )}>
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;