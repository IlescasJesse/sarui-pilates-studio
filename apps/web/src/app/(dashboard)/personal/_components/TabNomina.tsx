"use client";

import { useState } from "react";
import { Plus, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useNomina,
  useCrearPeriodo,
  useAjustarDetalle,
  useAprobarNomina,
  useMarcarPagado,
  type PeriodoNomina,
  type NominaDetalle,
  type EstadoNomina,
} from "@/hooks/usePersonal";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtFecha(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function badgeClasses(estado: EstadoNomina) {
  switch (estado) {
    case "BORRADOR":
      return "bg-accent text-accent-foreground border border-accent-foreground/20";
    case "APROBADO":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "PAGADO":
      return "bg-muted text-muted-foreground border border-border";
  }
}

function badgeLabel(estado: EstadoNomina) {
  switch (estado) {
    case "BORRADOR":
      return "Borrador";
    case "APROBADO":
      return "Aprobado";
    case "PAGADO":
      return "Pagado";
  }
}

// ─── Skeleton Cards ────────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="h-40 w-full animate-pulse bg-muted rounded-lg" />
      ))}
    </div>
  );
}

// ─── Dialog: Crear Período ─────────────────────────────────────────────────────

interface CrearPeriodoDialogProps {
  open: boolean;
  onClose: () => void;
}

function CrearPeriodoDialog({ open, onClose }: CrearPeriodoDialogProps) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [errors, setErrors] = useState<{ fechaInicio?: string; fechaFin?: string }>({});

  const crearPeriodo = useCrearPeriodo();

  const validate = () => {
    const e: { fechaInicio?: string; fechaFin?: string } = {};
    if (!fechaInicio) e.fechaInicio = "Requerido";
    if (!fechaFin) e.fechaFin = "Requerido";
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      e.fechaFin = "La fecha de fin debe ser igual o posterior a la de inicio";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await crearPeriodo.mutateAsync({ fechaInicio, fechaFin });
      toast.success("Período creado");
      setFechaInicio("");
      setFechaFin("");
      setErrors({});
      onClose();
    } catch {
      toast.error("No se pudo crear el período");
    }
  };

  const handleClose = () => {
    setFechaInicio("");
    setFechaFin("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo período de nómina</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha de inicio</label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
            {errors.fechaInicio && (
              <p className="text-xs text-destructive">{errors.fechaInicio}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha de fin</label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
            {errors.fechaFin && (
              <p className="text-xs text-destructive">{errors.fechaFin}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            Se calcularán los días trabajados automáticamente según los registros de asistencia del período.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={crearPeriodo.isPending}
            className="bg-[#254F40] hover:bg-[#254F40]/90"
          >
            {crearPeriodo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear período
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: Confirmar Aprobar ─────────────────────────────────────────────────

interface ConfirmAprobarDialogProps {
  periodo: PeriodoNomina | null;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}

function ConfirmAprobarDialog({ periodo, onConfirm, onClose, isPending }: ConfirmAprobarDialogProps) {
  return (
    <Dialog open={!!periodo} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Aprobar nómina</DialogTitle>
        </DialogHeader>
        {periodo && (
          <p className="text-sm text-muted-foreground">
            ¿Aprobar el período del {fmtFecha(periodo.fechaInicio)} al {fmtFecha(periodo.fechaFin)}?{" "}
            Se registrarán {periodo.detalles.length} gastos en contabilidad. Esta acción no se puede deshacer.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-[#254F40] hover:bg-[#254F40]/90"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Aprobar nómina
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: Confirmar Marcar Pagado ──────────────────────────────────────────

interface ConfirmPagadoDialogProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}

function ConfirmPagadoDialog({ open, onConfirm, onClose, isPending }: ConfirmPagadoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar como pagado</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          ¿Confirmar que este período ya fue pagado a los empleados?
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-[#254F40] hover:bg-[#254F40]/90"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tabla de Detalles ─────────────────────────────────────────────────────────

interface DetallesTableProps {
  detalles: NominaDetalle[];
  esBorrador: boolean;
}

function DetallesTable({ detalles, esBorrador }: DetallesTableProps) {
  const ajustarDetalle = useAjustarDetalle();

  const handleAjuste = async (
    detalle: NominaDetalle,
    campo: "deducciones" | "netoAPagar",
    valor: string
  ) => {
    const num = parseFloat(valor);
    if (isNaN(num)) return;

    // Calcular el neto resultante para validar
    let netoResultante = detalle.netoAPagar;
    if (campo === "netoAPagar") {
      netoResultante = num;
    } else {
      // Si cambia deducciones, neto = bruto - nuevas deducciones
      netoResultante = detalle.salarioBruto - num;
    }

    if (netoResultante < 0) {
      toast.error("Ajuste inválido: el neto a pagar no puede ser negativo.");
      return;
    }

    try {
      await ajustarDetalle.mutateAsync({
        id: detalle.id,
        data: { [campo === "netoAPagar" ? "netoAPagar" : "deducciones"]: num },
      });
    } catch {
      toast.error("No se pudo guardar el ajuste");
    }
  };

  const totalNeto = detalles.reduce((sum, d) => sum + d.netoAPagar, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Empleado</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Puesto</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Días</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Bruto</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">
              {esBorrador ? "Deducciones (ajuste manual)" : "Deducciones"}
            </th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Neto a pagar</th>
          </tr>
        </thead>
        <tbody>
          {detalles.map((detalle) => (
            <tr key={detalle.id} className="border-b border-border/50">
              <td className="py-2 px-3">
                {detalle.staff.nombre} {detalle.staff.apellido}
              </td>
              <td className="py-2 px-3 text-muted-foreground">
                {detalle.staff.puesto?.nombre ?? "Sin puesto"}
              </td>
              <td className="py-2 px-3 text-right tabular-nums">
                {detalle.diasTrabajados}
              </td>
              <td className="py-2 px-3 text-right tabular-nums">
                {fmt(detalle.salarioBruto)}
              </td>
              <td className="py-2 px-3 text-right">
                {esBorrador ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={detalle.deducciones}
                    className="w-28 text-right tabular-nums ml-auto"
                    onBlur={(e) => handleAjuste(detalle, "deducciones", e.target.value)}
                  />
                ) : (
                  <span className="tabular-nums">{fmt(detalle.deducciones)}</span>
                )}
              </td>
              <td className="py-2 px-3 text-right">
                {esBorrador ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={detalle.netoAPagar}
                    className="w-28 text-right tabular-nums ml-auto"
                    onBlur={(e) => handleAjuste(detalle, "netoAPagar", e.target.value)}
                  />
                ) : (
                  <span className="tabular-nums">{fmt(detalle.netoAPagar)}</span>
                )}
              </td>
            </tr>
          ))}

          {/* Fila totales */}
          <tr className="font-semibold bg-muted/50">
            <td className="py-2 px-3" colSpan={5}>
              Total neto
            </td>
            <td className="py-2 px-3 text-right tabular-nums">
              {fmt(totalNeto)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Card de Período ───────────────────────────────────────────────────────────

interface PeriodoCardProps {
  periodo: PeriodoNomina;
  onAprobar: (p: PeriodoNomina) => void;
  onPagar: (p: PeriodoNomina) => void;
}

function PeriodoCard({ periodo, onAprobar, onPagar }: PeriodoCardProps) {
  const esBorrador = periodo.estado === "BORRADOR";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-base">
              {fmtFecha(periodo.fechaInicio)} – {fmtFecha(periodo.fechaFin)}
            </span>
            <Badge variant="outline" className={badgeClasses(periodo.estado)}>
              {badgeLabel(periodo.estado)}
            </Badge>
          </div>

          <div className="flex gap-2">
            {esBorrador && (
              <>
                <Button
                  onClick={() => onAprobar(periodo)}
                  className="bg-[#254F40] hover:bg-[#254F40]/90"
                  size="sm"
                >
                  Aprobar nómina
                </Button>
              </>
            )}
            {periodo.estado === "APROBADO" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPagar(periodo)}
              >
                Marcar como pagado
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {periodo.detalles.length > 0 ? (
          <DetallesTable detalles={periodo.detalles} esBorrador={esBorrador} />
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Sin detalles de nómina para este período.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── TabNomina ─────────────────────────────────────────────────────────────────

export function TabNomina() {
  const { data: periodos, isLoading, isError } = useNomina();
  const aprobarNomina = useAprobarNomina();
  const marcarPagado = useMarcarPagado();

  const [crearDialogOpen, setCrearDialogOpen] = useState(false);
  const [confirmAprobar, setConfirmAprobar] = useState<PeriodoNomina | null>(null);
  const [confirmPagar, setConfirmPagar] = useState<PeriodoNomina | null>(null);

  // Separar borradores de histórico
  const borradores = (periodos ?? [])
    .filter((p) => p.estado === "BORRADOR")
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());

  const historico = (periodos ?? [])
    .filter((p) => p.estado !== "BORRADOR")
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());

  const handleAprobar = async () => {
    if (!confirmAprobar) return;
    const n = confirmAprobar.detalles.length;
    try {
      await aprobarNomina.mutateAsync(confirmAprobar.id);
      toast.success(`Nómina aprobada — ${n} gastos registrados en contabilidad`);
    } catch {
      toast.error("No se pudo aprobar la nómina. Intenta de nuevo.");
    } finally {
      setConfirmAprobar(null);
    }
  };

  const handlePagar = async () => {
    if (!confirmPagar) return;
    try {
      await marcarPagado.mutateAsync(confirmPagar.id);
      toast.success("Período marcado como pagado");
    } catch {
      toast.error("No se pudo marcar el período como pagado");
    } finally {
      setConfirmPagar(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex justify-end">
        <Button
          onClick={() => setCrearDialogOpen(true)}
          className="bg-[#254F40] hover:bg-[#254F40]/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Crear período
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            No se pudo cargar los períodos de nómina. Verifica tu conexión e intenta de nuevo.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && <SkeletonCards />}

      {/* Content */}
      {!isLoading && !isError && (
        <>
          {/* Empty state */}
          {(periodos ?? []).length === 0 && (
            <div className="rounded-lg border border-border p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium text-sm">No hay períodos de nómina registrados.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crea el primer período para calcular los pagos del equipo.
              </p>
            </div>
          )}

          {/* Borradores */}
          {borradores.length > 0 && (
            <div className="space-y-4">
              {borradores.map((p) => (
                <PeriodoCard
                  key={p.id}
                  periodo={p}
                  onAprobar={setConfirmAprobar}
                  onPagar={setConfirmPagar}
                />
              ))}
            </div>
          )}

          {/* Historial: APROBADO / PAGADO */}
          {historico.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="historico">
                <AccordionTrigger className="text-sm font-medium">
                  Períodos anteriores ({historico.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {historico.map((p) => (
                      <PeriodoCard
                        key={p.id}
                        periodo={p}
                        onAprobar={setConfirmAprobar}
                        onPagar={setConfirmPagar}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </>
      )}

      {/* Dialogs */}
      <CrearPeriodoDialog
        open={crearDialogOpen}
        onClose={() => setCrearDialogOpen(false)}
      />

      <ConfirmAprobarDialog
        periodo={confirmAprobar}
        onConfirm={handleAprobar}
        onClose={() => setConfirmAprobar(null)}
        isPending={aprobarNomina.isPending}
      />

      <ConfirmPagadoDialog
        open={!!confirmPagar}
        onConfirm={handlePagar}
        onClose={() => setConfirmPagar(null)}
        isPending={marcarPagado.isPending}
      />
    </div>
  );
}
