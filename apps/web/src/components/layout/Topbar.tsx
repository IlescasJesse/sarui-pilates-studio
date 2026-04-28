"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, User, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { user, logout } = useAuth();
  const { toggle } = useUIStore();
  const router = useRouter();

  async function handleLogout() {
    logout();
    router.replace("/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Left: hamburger */}
      <button
        onClick={toggle}
        className="p-2 rounded-lg hover:bg-muted transition-colors md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors outline-none"
              aria-label="Menú de usuario"
            >
              <div className="w-8 h-8 rounded-full bg-[#254F40] flex items-center justify-center text-xs font-bold text-[#F6FFB5] flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground leading-tight">
                  {user?.name ?? "Usuario"}
                </span>
                <span className="text-xs text-muted-foreground capitalize leading-tight">
                  {user?.role ?? "admin"}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{user?.name ?? "Usuario"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/perfil")}
              className="cursor-pointer"
            >
              <User className="w-4 h-4 mr-2" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
