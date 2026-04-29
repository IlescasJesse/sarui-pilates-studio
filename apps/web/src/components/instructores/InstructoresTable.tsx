"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Edit2, MoreHorizontal } from "lucide-react";
import { useInstructores, useDeleteInstructor } from "@/hooks/useInstructores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InstructoresTableProps {
  onEdit: (instructorId: string) => void;
}

// Mapeo de valores internos a etiquetas en español con color
const ACTIVIDAD_LABELS: Record<string, { label: string; color: string }> = {
  REFORMER: { label: "Reformer", color: "bg-[#254F40]/10 text-[#254F40] border-[#254F40]/20" },
  MAT:      { label: "Mat",      color: "bg-purple-50 text-purple-700 border-purple-200" },
  BARRE:    { label: "Barre",    color: "bg-pink-50 text-pink-700 border-pink-200" },
  // compatibilidad con valores legacy del seed anterior
  FLOW:     { label: "Reformer", color: "bg-[#254F40]/10 text-[#254F40] border-[#254F40]/20" },
  POWER:    { label: "Reformer", color: "bg-[#254F40]/10 text-[#254F40] border-[#254F40]/20" },
  MOBILITY: { label: "Reformer", color: "bg-[#254F40]/10 text-[#254F40] border-[#254F40]/20" },
  GAP:      { label: "Mat GAP",  color: "bg-purple-50 text-purple-700 border-purple-200" },
};

export function InstructoresTable({ onEdit }: InstructoresTableProps) {
  const { data, isLoading, error } = useInstructores();
  const deleteMutation = useDeleteInstructor();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (error) return <div className="text-center py-8"><p className="text-destructive">Error al cargar las instructoras</p></div>;

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
    return <div className="text-center py-12"><p className="text-muted-foreground">No hay instructoras registradas</p></div>;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full sarui-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Actividades</th>
            <th>Estado</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((instructor) => (
            <tr key={instructor.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#254F40]/10 flex items-center justify-center text-xs font-semibold text-[#254F40]">
                    {getInitials(`${instructor.firstName} ${instructor.lastName}`)}
                  </div>
                  <span>{instructor.firstName} {instructor.lastName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {instructor.user.email}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {instructor.phone || "—"}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex flex-wrap gap-1">
                  {instructor.specialties && instructor.specialties.length > 0 ? (
                    // Deduplica por label para no mostrar Reformer 3 veces si tiene FLOW+POWER+MOBILITY
                    [...new Map(
                      instructor.specialties
                        .map((s) => ACTIVIDAD_LABELS[s] ?? { label: s, color: "bg-gray-100 text-gray-600 border-gray-200" })
                        .map((a) => [a.label, a])
                    ).values()].map(({ label, color }) => (
                      <span key={label} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">Sin asignar</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm">
                <Badge variant={instructor.user.isActive ? "success" : "destructive"}>
                  {instructor.user.isActive ? "Activa" : "Inactiva"}
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
                      <DropdownMenuItem onClick={() => onEdit(instructor.id)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setConfirmDelete(instructor.id)} className="text-destructive">
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
          <div className="bg-white rounded-lg p-6 max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-muted-foreground mb-6">¿Estás segura de que deseas eliminar esta instructora?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDelete(confirmDelete)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
