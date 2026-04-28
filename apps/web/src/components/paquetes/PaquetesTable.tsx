"use client";

import { useState } from "react";
import { Trash2, Edit2, MoreHorizontal } from "lucide-react";
import { usePaquetes, useDeletePaquete } from "@/hooks/usePaquetes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaquetesTableProps {
  onEdit: (paqueteId: string) => void;
}

const categoryColors: Record<string, "default" | "success" | "warning" | "info"> = {
  REFORMER: "info",
  MAT: "success",
  MIX: "warning",
};

const categoryLabels: Record<string, string> = {
  REFORMER: "Reformer",
  MAT: "Mat",
  MIX: "Mix",
};

export function PaquetesTable({ onEdit }: PaquetesTableProps) {
  const { data, isLoading, error } = usePaquetes();
  const deleteMutation = useDeletePaquete();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDelete(null);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error al cargar los paquetes</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-[#254F40]/8 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sin paquetes registrados</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm">
      <table className="w-full sarui-table">
        <thead>
          <tr>
            <th>Paquete</th>
            <th>Actividad</th>
            <th>Sesiones</th>
            <th>Precio</th>
            <th>Vigencia</th>
            <th>Estado</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((paquete) => (
            <tr key={paquete.id}>
              <td>
                <p className="font-medium">{paquete.name}</p>
                {paquete.description && (
                  <p className="text-xs text-muted-foreground">{paquete.description}</p>
                )}
              </td>
              <td>
                {paquete.tipoActividad ? (
                  <div className="flex items-center gap-2">
                    {paquete.tipoActividad.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: paquete.tipoActividad.color }}
                      />
                    )}
                    <span className="text-sm">{paquete.tipoActividad.nombre}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td>{paquete.sessions}</td>
              <td className="font-medium">{formatCurrency(paquete.price)}</td>
              <td>{paquete.validityDays} días</td>
              <td>
                <Badge variant={paquete.isActive ? "success" : "destructive"}>
                  {paquete.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </td>
              <td>
                <div className="flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(paquete.id)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setConfirmDelete(paquete.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-muted-foreground mb-6">
              ¿Estás seguro de que quieres eliminar este paquete?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
