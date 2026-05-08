"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  CreditCard,
  CalendarDays,
  BookOpen,
  UserCheck,
  Monitor,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Catálogos", href: "/catalogos", icon: Layers },
  { label: "Membresías", href: "/membresias", icon: CreditCard },
  { label: "Clases", href: "/clases", icon: CalendarDays },
  { label: "Reservaciones", href: "/reservaciones", icon: BookOpen },
  { label: "Instructores", href: "/instructores", icon: UserCheck },
  { label: "Ayuda", href: "/ayuda", icon: HelpCircle },
  { label: "Kiosco", href: "/kiosk", icon: Monitor },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggle } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={toggle}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-30 flex flex-col",
          "bg-[#254F40] text-white",
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-60" : "w-16",
          // On mobile: slide in/out
          "md:translate-x-0",
          !sidebarOpen && "max-md:-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-white/10 px-3">
          {sidebarOpen ? (
            <Image
              src="/logo.png"
              alt="Sarui Pilates Studio"
              width={130}
              height={48}
              style={{ height: "auto" }}
              className="object-contain"
              priority
            />
          ) : (
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F6FFB5]/15 border border-[#F6FFB5]/30"
              aria-label="Sarui"
            >
              <span className="text-[#F6FFB5] text-sm font-bold leading-none select-none">S</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-0.5 px-2">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center rounded-lg px-2 py-2.5 text-sm font-medium transition-all duration-150",
                      "hover:bg-white/10",
                      isActive
                        ? "bg-[#F6FFB5]/15 text-[#F6FFB5]"
                        : "text-white/70 hover:text-white",
                      !sidebarOpen && "justify-center"
                    )}
                    title={!sidebarOpen ? label : undefined}
                  >
                    <Icon
                      className={cn(
                        "flex-shrink-0 w-5 h-5",
                        isActive ? "text-[#F6FFB5]" : "text-white/60",
                        sidebarOpen && "mr-3"
                      )}
                    />
                    {sidebarOpen && (
                      <span className="truncate">{label}</span>
                    )}
                    {isActive && sidebarOpen && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F6FFB5]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Toggle button */}
        <div className="border-t border-white/10 p-2">
          <button
            onClick={toggle}
            className={cn(
              "flex items-center w-full rounded-lg px-2 py-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm",
              !sidebarOpen && "justify-center"
            )}
            aria-label={sidebarOpen ? "Colapsar menú" : "Expandir menú"}
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Colapsar</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
