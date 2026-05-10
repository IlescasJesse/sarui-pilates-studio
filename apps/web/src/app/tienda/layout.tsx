"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    function check() { setLoggedIn(!!localStorage.getItem("sarui_token")); }
    check();
    window.addEventListener("auth-change", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("auth-change", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFFEC] flex flex-col">
      <header className="bg-[#254F40] text-[#F6FFB5]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/tienda" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Sarui Studio" width={32} height={32} className="rounded" />
            <span className="text-lg font-bold tracking-tight">Sarui Studio</span>
            <span className="text-[10px] opacity-60 border-l border-[#F6FFB5]/30 pl-2 leading-none">Tienda</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {loggedIn && (
              <>
                <a href="/tienda/clases" className="opacity-80 hover:opacity-100 transition-opacity">
                  Clases
                </a>
                <a href="/tienda/mis-agendas" className="opacity-80 hover:opacity-100 transition-opacity">
                  Mis Agendas
                </a>
                <a href="/tienda/membresia" className="opacity-80 hover:opacity-100 transition-opacity">
                  Membresía
                </a>
              </>
            )}
            {loggedIn ? (
              <button
                onClick={() => {
                  localStorage.removeItem("sarui_token");
                  localStorage.removeItem("sarui_user");
                  window.location.href = "/tienda";
                }}
                className="bg-[#F6FFB5] text-[#254F40] font-semibold px-3 py-1.5 rounded-lg text-sm hover:bg-[#F6FFB5]/90 transition-colors"
              >
                Cerrar sesión
              </button>
            ) : (
              <a
                href="/tienda/login"
                className="bg-[#F6FFB5] text-[#254F40] font-semibold px-3 py-1.5 rounded-lg text-sm hover:bg-[#F6FFB5]/90 transition-colors"
              >
                Iniciar sesión
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>

      <footer className="border-t border-[#254F40]/10 py-4 text-center text-xs text-[#254F40]/40">
        Sarui Studio · Oaxaca, México
      </footer>
    </div>
  );
}
