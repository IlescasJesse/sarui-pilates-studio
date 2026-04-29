"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Plus, Clock } from "lucide-react";
import {
  useTipoMembresias,
  useDeleteTipoMembresia,
  type TipoMembresia,
} from "@/hooks/useTipoMembresias";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TipoMembresiaForm } from "./TipoMembresiaForm";
import { staggerContainer, staggerItem } from "@/lib/animations";

function duracionLabel(dias: number) {
  if (dias === 30) return "Mensual";
  if (dias === 60) return "Bimestral";
  if (dias === 90) return "Trimestral";
  if (dias === 180) return "Semestral";
  if (dias === 365) return "Anual";
  return `${dias} días`;
}

export function TipoMembresiaTable() {
  const { data = [], isLoading } = useTipoMembresias();
  const deleteMutation = useDeleteTipoMembresia();
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<TipoMembresia | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-[#254F40]/8 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Las membresías son por <strong>tiempo</strong>, sin importar el número de sesiones.
          Los costos se configurarán próximamente.
        </p>
        <Button onClick={() => { setEditando(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva membresía
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-base">Sin tipos de membresía registrados</p>
          <p className="text-sm mt-1">Crea el primero usando el botón de arriba</p>
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
                <th>Membresía</th>
                <th>Duración</th>
                <th>Actividades incluidas</th>
                <th>Costo</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {data.map((m) => (
                  <motion.tr key={m.id} variants={staggerItem} layout>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{m.nombre}</p>
                        {m.descripcion && (
                          <p className="text-xs text-muted-foreground">{m.descripcion}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {duracionLabel(m.duracionDias)}
                      </Badge>
                    </td>
                    <td>
                      {m.actividades.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Todas</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.actividades.map((a) => (
                            <span
                              key={a.id}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: a.tipoActividad.color
                                  ? `${a.tipoActividad.color}20`
                                  : "#f3f4f6",
                                color: a.tipoActividad.color ?? "#374151",
                              }}
                            >
                              {a.tipoActividad.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground italic">Por definir</span>
                    </td>
                    <td>
                      <Badge variant={m.isActive ? "success" : "destructive"}>
                        {m.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setEditando(m); setFormOpen(true); }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(m.id)}
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
          <TipoMembresiaForm
            open={formOpen}
            onClose={() => setFormOpen(false)}
            editando={editando}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
