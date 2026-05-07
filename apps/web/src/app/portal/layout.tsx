import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal de Clientes — Sarui Studio",
  description: "Agenda tu sesión de Pilates en Sarui Studio",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FDFFEC]">
      {/* Navbar del portal */}
      <header className="bg-[#254F40] text-[#F6FFB5]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Sarui Studio</span>
            <span className="text-xs opacity-60 border-l border-[#F6FFB5]/30 pl-2">Portal</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/portal/clases" className="opacity-80 hover:opacity-100 transition-opacity">
              Clases
            </a>
            <a href="/portal/mis-agendas" className="opacity-80 hover:opacity-100 transition-opacity">
              Mis Agendas
            </a>
            <a href="/portal/membresia" className="opacity-80 hover:opacity-100 transition-opacity">
              Membresía
            </a>
            <a
              href="/portal/login"
              className="bg-[#F6FFB5] text-[#254F40] font-semibold px-3 py-1.5 rounded-lg text-sm hover:bg-[#F6FFB5]/90 transition-colors"
            >
              Iniciar sesión
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>

      <footer className="border-t border-[#254F40]/10 mt-16 py-6 text-center text-sm text-[#254F40]/50">
        © {new Date().getFullYear()} Sarui Studio · Oaxaca, México
      </footer>
    </div>
  );
}
