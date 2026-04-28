"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { ReservacionesTable } from "@/components/reservaciones/ReservacionesTable";
import type { ReservationStatus } from "@/hooks/useReservaciones";

export default function ReservacionesPage() {
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | undefined>(
    undefined
  );
  const [dateFilter, setDateFilter] = useState<string>("");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#254F40]/10">
          <BookOpen className="w-5 h-5 text-[#254F40]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#254F40]">Reservaciones</h1>
          <p className="text-sm text-muted-foreground">
            Control de reservaciones por clase
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <select
            value={statusFilter || ""}
            onChange={(e) =>
              setStatusFilter(
                (e.target.value as ReservationStatus) || undefined
              )
            }
            className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los estados</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="PENDING_APPROVAL">Pendiente</option>
            <option value="ATTENDED">Asistió</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="NO_SHOW">No asistió</option>
          </select>
        </div>

        <ReservacionesTable statusFilter={statusFilter} dateFilter={dateFilter} />
      </div>
    </div>
  );
}
