"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, MoreHorizontal } from "lucide-react";
import {
  useReservaciones,
  useCancelReservacion,
  type ReservationStatus,
} from "@/hooks/useReservaciones";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReservacionesTableProps {
  statusFilter?: ReservationStatus;
  dateFilter?: string;
}

const STATUS_ICONS: Record<ReservationStatus, React.ReactNode> = {
  CONFIRMED:        <CheckCircle className="w-4 h-4" />,
  CANCELLED:        <XCircle className="w-4 h-4" />,
  ATTENDED:         <CheckCircle className="w-4 h-4" />,
  NO_SHOW:          <AlertCircle className="w-4 h-4" />,
  PENDING_APPROVAL: <AlertCircle className="w-4 h-4" />,
};

const STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED:        "Confirmada",
  CANCELLED:        "Cancelada",
  ATTENDED:         "Asistió",
  NO_SHOW:          "No asistió",
  PENDING_APPROVAL: "Pendiente",
};

const STATUS_VARIANTS: Record<ReservationStatus, "success" | "destructive" | "warning" | "info"> = {
  CONFIRMED:        "info",
  CANCELLED:        "destructive",
  ATTENDED:         "success",
  NO_SHOW:          "warning",
  PENDING_APPROVAL: "warning",
};

const ORIGIN_LABELS: Record<string, string> = {
  MEMBERSHIP:    "Membresía",
  WALK_IN:       "Entrada directa",
  PORTAL:        "Portal (pago)",
  PORTAL_REQUEST: "Portal (solicitud)",
};

export function ReservacionesTable({ statusFilter, dateFilter }: ReservacionesTableProps) {
  const { data, isLoading, error } = useReservaciones({ status: statusFilter, date: dateFilter });
  const cancelMutation = useCancelReservacion();
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
      setConfirmCancel(null);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (error) return <div className="text-center py-8"><p className="text-destructive">Error al cargar las reservaciones</p></div>;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-12"><p className="text-muted-foreground">No se encontraron reservaciones</p></div>;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full sarui-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Clase</th>
            <th>Fecha y hora</th>
            <th>Origen</th>
            <th>Estado</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((reservacion) => (
            <tr key={reservacion.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-sm font-medium">
                {reservacion.client.firstName} {reservacion.client.lastName}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="space-y-0.5">
                  <p className="font-medium">{reservacion.class.title ?? reservacion.class.type}</p>
                  <p className="text-xs text-muted-foreground">{reservacion.class.type}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-sm">{formatDateTime(reservacion.class.startAt)}</td>
              <td className="px-4 py-3 text-sm">
                <Badge variant="outline">
                  {ORIGIN_LABELS[reservacion.origin] ?? reservacion.origin}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm">
                <Badge variant={STATUS_VARIANTS[reservacion.status]}>
                  <span className="mr-1">{STATUS_ICONS[reservacion.status]}</span>
                  {STATUS_LABELS[reservacion.status]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {reservacion.status === "CONFIRMED" && (
                        <DropdownMenuItem onClick={() => setConfirmCancel(reservacion.id)} className="text-destructive">
                          Cancelar reservación
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Cancelar reservación</h3>
            <p className="text-muted-foreground mb-6">
              ¿Estás segura de que deseas cancelar esta reservación? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmCancel(null)}>Mantener</Button>
              <Button variant="destructive" onClick={() => handleCancel(confirmCancel)} disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? "Cancelando..." : "Cancelar reservación"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
