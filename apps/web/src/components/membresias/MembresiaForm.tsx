"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateMembresia } from "@/hooks/useMembresias";
import { useClientes } from "@/hooks/useClientes";
import { usePaquetes } from "@/hooks/usePaquetes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const membresiaSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  packageId: z.string().min(1, "Selecciona un paquete"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]).optional(),
  pricePaid: z.coerce.number().positive("El precio debe ser mayor a 0").optional(),
  notes: z.string().optional(),
});

type MembresiaFormData = z.infer<typeof membresiaSchema>;

interface MembresiaFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
  onSuccess?: () => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

export function MembresiaForm({ isOpen, onClose, defaultClientId, onSuccess }: MembresiaFormProps) {
  const createMutation = useCreateMembresia();
  const { data: clientesData } = useClientes({ page: 1 });
  const { data: paquetes } = usePaquetes();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MembresiaFormData>({
    resolver: zodResolver(membresiaSchema),
    defaultValues: {
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (defaultClientId) setValue("clientId", defaultClientId);
  }, [defaultClientId, setValue]);

  useEffect(() => {
    if (!isOpen) reset({ startDate: new Date().toISOString().split("T")[0] });
  }, [isOpen, reset]);

  const onSubmit = async (data: MembresiaFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        startDate: new Date(data.startDate + "T00:00:00").toISOString(),
      });
      toast.success("Membresía creada correctamente");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const clientes = clientesData?.clientes ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Membresía</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Cliente */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Cliente</label>
            <select
              {...register("clientId")}
              disabled={!!defaultClientId}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
          </div>

          {/* Paquete */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Paquete</label>
            <select
              {...register("packageId")}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Seleccionar paquete...</option>
              {paquetes?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.sessions} sesiones
                </option>
              ))}
            </select>
            {errors.packageId && <p className="text-xs text-destructive">{errors.packageId.message}</p>}
          </div>

          {/* Fecha inicio */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha de inicio</label>
            <Input type="date" {...register("startDate")} />
            {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
          </div>

          {/* Método de pago */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Método de pago</label>
            <select
              {...register("paymentMethod")}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sin especificar</option>
              {Object.entries(PAYMENT_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Precio pagado */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Precio pagado (opcional)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="Deja vacío para usar precio del paquete"
              {...register("pricePaid")}
            />
            {errors.pricePaid && <p className="text-xs text-destructive">{errors.pricePaid.message}</p>}
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Notas (opcional)</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Observaciones..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-[#254F40] hover:bg-[#254F40]/90"
            >
              {createMutation.isPending ? "Guardando..." : "Crear Membresía"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
