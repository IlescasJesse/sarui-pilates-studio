"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Clock, XCircle, MoreHorizontal } from "lucide-react";
import { useMembresias, useSuspendMembresia, type MembershipStatus } from "@/hooks/useMembresias";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MembresiasTableProps {
  statusFilter?: MembershipStatus;
  clientIdFilter?: string;
}

const statusIcons: Record<MembershipStatus, React.ReactNode> = {
  ACTIVE: <CheckCircle className="w-4 h-4" />,
  EXPIRED: <XCircle className="w-4 h-4" />,
  EXHAUSTED: <AlertCircle className="w-4 h-4" />,
  SUSPENDED: <Clock className="w-4 h-4" />,
};

const statusVariants: Record<MembershipStatus, "success" | "destructive" | "warning" | "info"> = {
  ACTIVE: "success",
  EXPIRED: "destructive",
  EXHAUSTED: "warning",
  SUSPENDED: "info",
};

const STATUS_LABELS: Record<MembershipStatus, string> = {
  ACTIVE:    "Activa",
  EXPIRED:   "Vencida",
  EXHAUSTED: "Agotada",
  SUSPENDED: "Suspendida",
};

export function MembresiasTable({
  statusFilter,
  clientIdFilter,
}: MembresiasTableProps) {
  const { data, isLoading, error } = useMembresias({
    status: statusFilter,
    clientId: clientIdFilter,
  });

  const suspendMutation = useSuspendMembresia();
  const [confirmSuspend, setConfirmSuspend] = useState<string | null>(null);

  const handleSuspend = async (id: string) => {
    try {
      await suspendMutation.mutateAsync(id);
      setConfirmSuspend(null);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error al cargar las membresías</p>
      </div>
    );
  }

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
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontraron membresías</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full sarui-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Paquete</th>
            <th>Sesiones</th>
            <th>Vence</th>
            <th>Estado</th>
            <th>Precio</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((membresia) => (
            <tr
              key={membresia.id}
              className="hover:bg-muted/30 transition-colors"
            >
              <td className="px-4 py-3 text-sm font-medium">
                {membresia.client.firstName} {membresia.client.lastName}
              </td>
              <td className="px-4 py-3 text-sm">{membresia.package.name}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-[#254F40] h-2 rounded-full"
                      style={{
                        width: `${
                          (membresia.sessionsUsed / membresia.totalSessions) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs whitespace-nowrap">
                    {membresia.sessionsRemaining}/{membresia.totalSessions}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm">
                {formatDate(membresia.expiresAt)}
              </td>
              <td className="px-4 py-3 text-sm">
                <Badge variant={statusVariants[membresia.status]}>
                  <span className="mr-1">{statusIcons[membresia.status]}</span>
                  {STATUS_LABELS[membresia.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm">
                ${membresia.pricePaid ?? membresia.package.price}
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
                      {membresia.status === "ACTIVE" && (
                        <DropdownMenuItem
                          onClick={() => setConfirmSuspend(membresia.id)}
                          className="text-destructive"
                        >
                          Suspender
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

      {confirmSuspend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Suspender membresía</h3>
            <p className="text-muted-foreground mb-6">
              ¿Estás segura de que deseas suspender esta membresía?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmSuspend(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleSuspend(confirmSuspend)}
                disabled={suspendMutation.isPending}
              >
                {suspendMutation.isPending ? "Suspendiendo..." : "Suspender"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
