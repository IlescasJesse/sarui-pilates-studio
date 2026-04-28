"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/animations";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFFEC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#254F40] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div
        className={cn(
          "flex flex-col flex-1 overflow-hidden transition-all duration-300",
          sidebarOpen ? "md:ml-60" : "md:ml-16"
        )}
      >
        <Topbar />
        <AnimatePresence mode="wait">
          <motion.main
            className="flex-1 overflow-y-auto p-6"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            key="main-content"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
