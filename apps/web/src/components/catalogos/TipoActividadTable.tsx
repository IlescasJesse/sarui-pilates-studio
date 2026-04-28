"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Plus } from "lucide-react";
import {
  useTipoActividades,
  useDeleteTipoActividad,
  type TipoActividad,
} from "@/hooks/useTipoActividades";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TipoActividadForm } from "./TipoActividadForm";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { formatCurrency } from "@/lib/utils";

export function TipoActividadTable() {
  const { data = [], isLoading } = useTipoActividades();
  const deleteMutation = useDeleteTipoActividad();
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<TipoActividad | null>(null);

  const handleEdit = (t: TipoActividad) => {
    setEditando(t);
    setFormOpen(true);
  };

  const handleNuevo = () => {
    setEditando(null);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-[#254F40]/8 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleNuevo}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva actividad
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-base">Sin tipos de actividad registrados</p>
          <p className="text-sm mt-1">Crea el primer tipo usando el botón de arriba</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <motion.table
            className="w-full sarui-table"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Modalidad</th>
                <th>Sesiones</th>
                <th>Costo</th>
                <th>Color</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {data.map((t) => (
                  <motion.tr key={t.id} variants={staggerItem} layout>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{t.nombre}</p>
                        {t.descripcion && (
                          <p className="text-xs text-muted-foreground">{t.descripcion}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={t.modalidad === "POR_PAQUETE" ? "default" : "secondary"}>
                        {t.modalidad === "POR_PAQUETE" ? "Por paquete" : "Sesión única"}
                      </Badge>
                    </td>
                    <td>{t.sesiones ?? "—"}</td>
                    <td className="font-medium">{formatCurrency(t.costo)}</td>
                    <td>
                      {t.color && (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-border shadow-sm"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="text-xs font-mono text-muted-foreground">{t.color}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant={t.isActive ? "success" : "destructive"}>
                        {t.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(t)}
                          aria-label={`Editar ${t.nombre}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(t.id)}
                          aria-label={`Eliminar ${t.nombre}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </motion.table>
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <TipoActividadForm
            open={formOpen}
            onClose={() => setFormOpen(false)}
            editando={editando}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
