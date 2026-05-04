import React from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import MobileBottomNav from "./MobileBottomNav";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAgenda = location.pathname === "/agenda" || location.pathname === "/";

  return (
    <div className="h-screen flex overflow-hidden bg-[#f7f8fb]">
      <Sidebar />
      <main className="flex-1 lg:ml-[264px] md:ml-[80px] relative flex flex-col min-h-0 h-full transition-[margin] duration-300">
        <TopHeader />
        <div className={cn(
          "flex-1 w-full min-h-0",
          isAgenda ? "flex flex-col overflow-hidden" : "mx-auto max-w-7xl p-4 md:p-6 lg:p-8 overflow-y-auto"
        )}>
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;