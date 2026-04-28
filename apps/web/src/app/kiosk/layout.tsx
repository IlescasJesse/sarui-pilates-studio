import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiosk | Sarui Studio",
  description: "Terminal de check-in para clientes de Sarui Pilates Studio",
};

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#254F40" }}
    >
      {children}
    </div>
  );
}
