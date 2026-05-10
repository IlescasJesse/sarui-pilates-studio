import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda — Sarui Studio",
  description: "Agenda tu sesión de Pilates en Sarui Studio",
};

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FDFFEC]">
      {/* Navbar de la tienda */}
      <header className="bg-[#254F40] text-[#F6FFB5]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Sarui Studio</span>
            <span className="text-xs opacity-60 border-l border-[#F6FFB5]/30 pl-2">Tienda</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/tienda/clases" className="opacity-80 hover:opacity-100 transition-opacity">
              Clases
            </a>
            <a href="/tienda/mis-agendas" className="opacity-80 hover:opacity-100 transition-opacity">
              Mis Agendas
            </a>
            <a href="/tienda/membresia" className="opacity-80 hover:opacity-100 transition-opacity">
              Membresía
            </a>
            <a
              href="/tienda/login"
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
