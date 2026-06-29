"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startOfWeek, addWeeks, format, eachDayOfInterval, endOfWeek, isFuture, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  useAsistenciaSemana,
  useMarcarAsistenciaAdmin,
} from "@/hooks/usePersonal";
import { useAuth } from "@/hooks/useAuth";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DIAS_ABREV = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function formatRangoSemana(inicio: Date, fin: Date): string {
  const inicioFmt = format(inicio, "d MMM", { locale: es });
  const finFmt = format(fin, "d MMM yyyy", { locale: es });
  return `${inicioFmt} – ${finFmt}`;
}

// ─── TabAsistencia ─────────────────────────────────────────────────────────────

export function TabAsistencia() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "instructor";

  const [semanaInicio, setSemanaInicio] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const semanaFin = endOfWeek(semanaInicio, { weekStartsOn: 1 });
  const diasSemana = eachDayOfInterval({ start: semanaInicio, end: semanaFin });
  const semanaInicioStr = format(semanaInicio, "yyyy-MM-dd");

  const { data: asistencias, isLoading } = useAsistenciaSemana(semanaInicioStr);
  const marcar = useMarcarAsistenciaAdmin();

  // Track which cells are pending: key = `${staffId}_${fechaISO}`
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  // Build O(1) lookup map: `${staffId}_${fechaISO}` -> presente
  const asistenciaMap = new Map<string, boolean>();
  if (asistencias) {
    for (const row of asistencias) {
      for (const dia of row.dias) {
        asistenciaMap.set(`${row.staff.id}_${dia.fecha.split("T")[0]}`, dia.presente);
      }
    }
  }

  const handleCheck = (staffId: string, fechaISO: string, presente: boolean) => {
    const cellKey = `${staffId}_${fechaISO}`;
    setPendingCells((prev) => new Set(prev).add(cellKey));

    marcar.mutate(
      { staffId, fecha: fechaISO, presente },
      {
        onSuccess: () => {
          toast.success("Asistencia guardada");
          setPendingCells((prev) => {
            const next = new Set(prev);
            next.delete(cellKey);
            return next;
          });
        },
        onError: () => {
          toast.error("No se pudo guardar la asistencia");
          setPendingCells((prev) => {
            const next = new Set(prev);
            next.delete(cellKey);
            return next;
          });
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Registro semanal de asistencia</h2>
            {/* Selector de semana */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSemanaInicio((d) => addWeeks(d, -1))}
                aria-label="Semana anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[160px] text-center">
                {formatRangoSemana(semanaInicio, semanaFin)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSemanaInicio((d) => addWeeks(d, 1))}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !asistencias || asistencias.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No hay empleados activos para mostrar.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 bg-muted/50 px-4 py-3 text-left font-medium min-w-[160px] z-10">
                    Empleado
                  </th>
                  {diasSemana.map((dia, i) => {
                    const esHoy = isToday(dia);
                    return (
                      <th
                        key={i}
                        className={`px-2 py-3 text-center font-medium min-w-[56px] ${
                          esHoy ? "text-primary font-semibold" : "text-muted-foreground"
                        }`}
                      >
                        {DIAS_ABREV[i]}
                        <br />
                        <span className="text-xs font-normal">
                          {format(dia, "d")}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {asistencias.map((row) => {
                  const esMiPropia = row.staff.userId === user?.id;
                  return (
                    <tr
                      key={row.staff.id}
                      className={`border-t border-border ${
                        esMiPropia ? "bg-accent/30" : ""
                      }`}
                    >
                      {/* Nombre columna sticky */}
                      <td
                        className={`sticky left-0 px-4 py-0 font-medium z-10 ${
                          esMiPropia ? "bg-accent/30" : "bg-background"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-h-[44px]">
                          <div className="w-7 h-7 rounded-full bg-[#254F40]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-[#254F40]">
                              {row.staff.nombre[0]}
                              {row.staff.apellido[0]}
                            </span>
                          </div>
                          <span className="text-sm">
                            {row.staff.nombre} {row.staff.apellido}
                          </span>
                        </div>
                      </td>

                      {/* Columnas de días */}
                      {diasSemana.map((dia, i) => {
                        const fechaISO = format(dia, "yyyy-MM-dd");
                        const cellKey = `${row.staff.id}_${fechaISO}`;
                        const presente = asistenciaMap.get(cellKey) ?? false;
                        const esFuturo = isFuture(dia) && !isToday(dia);
                        const esHoy = isToday(dia);
                        const isPending = pendingCells.has(cellKey);

                        // Regla de permisos: no-admin solo puede editar HOY en su propia fila
                        const disabled =
                          esFuturo ||
                          (!isAdmin && !(esMiPropia && esHoy));

                        return (
                          <td
                            key={i}
                            className={`px-2 py-0 text-center min-h-[44px] ${
                              presente ? "bg-accent/60" : ""
                            }`}
                          >
                            <div className="flex items-center justify-center min-h-[44px]">
                              {isPending ? (
                                <Loader2 className="h-[14px] w-[14px] animate-spin text-muted-foreground" />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={presente}
                                  disabled={disabled}
                                  className={`h-5 w-5 rounded border-input accent-[#254F40] ${
                                    disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                  }`}
                                  onChange={(e) => {
                                    if (disabled) return;
                                    handleCheck(
                                      row.staff.id,
                                      fechaISO,
                                      e.target.checked
                                    );
                                  }}
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
