"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { isClientLoggedIn, clearSession, dispatchAuthChange } from "@/lib/auth-client";

const NO_AUTH_PAGES = ["/tienda/login", "/tienda/restablecer-contrasena", "/tienda/crear-contrasena"];

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage = NO_AUTH_PAGES.some((p) => pathname.startsWith(p));
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    function check() { setLoggedIn(isClientLoggedIn()); }
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
      <header className="bg-[#254F40] text-[#F6FFB5] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/tienda" className="flex items-center gap-2 shrink-0">
            <Image src="/sarui-logo.svg" alt="Sarui" width={100} height={36} priority />
          </Link>

          {loggedIn ? (
            <button
              onClick={() => {
                clearSession();
                dispatchAuthChange();
                router.push("/tienda/login");
              }}
              className="bg-[#F6FFB5] text-[#254F40] font-semibold px-3 py-1.5 rounded-lg text-sm hover:bg-[#F6FFB5]/90 transition-colors"
            >
              Salir
            </button>
          ) : !isPublicPage && (
            <Link
              href="/tienda/login"
              className="bg-[#F6FFB5] text-[#254F40] font-semibold px-3 py-1.5 rounded-lg text-sm hover:bg-[#F6FFB5]/90 transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>

      <footer className="border-t border-[#254F40]/10 py-4 text-center text-xs text-[#254F40]/40">
        Sarui Studio · Oaxaca, México
      </footer>
    </div>
  );
}
