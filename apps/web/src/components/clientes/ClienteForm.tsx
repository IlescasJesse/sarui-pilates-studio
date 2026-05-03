"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCliente, useUpdateCliente, useClienteById } from "@/hooks/useClientes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function BirthDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-");
      setYear(y ?? "");
      setMonth(m ? String(parseInt(m)) : "");
      setDay(d ? String(parseInt(d)) : "");
    } else {
      setDay(""); setMonth(""); setYear("");
    }
  }, [value]);

  function emit(d: string, m: string, y: string) {
    if (d && m && y) {
      const mm = m.padStart(2, "0");
      const dd = d.padStart(2, "0");
      onChange(`${y}-${mm}-${dd}`);
    } else {
      onChange("");
    }
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const daysInMonth = month && year
    ? new Date(parseInt(year), parseInt(month), 0).getDate()
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectClass =
    "flex-1 h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground";

  return (
    <div className="flex gap-2">
      <select
        value={day}
        onChange={(e) => { setDay(e.target.value); emit(e.target.value, month, year); }}
        className={selectClass}
      >
        <option value="">Día</option>
        {days.map((d) => (
          <option key={d} value={String(d)}>{d}</option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => { setMonth(e.target.value); emit(day, e.target.value, year); }}
        className={selectClass}
      >
        <option value="">Mes</option>
        {MESES.map((m, i) => (
          <option key={i + 1} value={String(i + 1)}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => { setYear(e.target.value); emit(day, month, e.target.value); }}
        className={selectClass}
      >
        <option value="">Año</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  );
}

const clienteSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId?: string;
  onSuccess?: () => void;
}

export function ClienteForm({ isOpen, onClose, clienteId, onSuccess }: ClienteFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditMode = !!clienteId;
  const { data: existingCliente } = useClienteById(clienteId);
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente(clienteId || "");

  const [birthDateValue, setBirthDateValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", birthDate: "", notes: "" },
  });

  useEffect(() => {
    if (isEditMode && existingCliente) {
      const bd = existingCliente.birthDate ? existingCliente.birthDate.split("T")[0] : "";
      reset({
        firstName: existingCliente.firstName,
        lastName: existingCliente.lastName,
        phone: existingCliente.phone || "",
        birthDate: bd,
        notes: "",
      });
      setBirthDateValue(bd);
    } else {
      reset();
      setBirthDateValue("");
    }
  }, [isEditMode, existingCliente, reset]);

  const onSubmit = async (data: ClienteFormData) => {
    setErrorMessage(null);
    try {
      if (isEditMode) {
        const { email, ...updateData } = data;
        await updateMutation.mutateAsync(updateData);
      } else {
        if (!data.email) {
          setErrorMessage("El correo electrónico es requerido");
          return;
        }
        await createMutation.mutateAsync({ ...data, email: data.email });
      }
      reset();
      onClose();
      onSuccess?.();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>

        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive text-destructive text-sm rounded p-3 flex items-start gap-2">
            <span className="flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Nombre</label>
              <Input placeholder="María" {...register("firstName")} aria-invalid={!!errors.firstName} />
              {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Apellido</label>
              <Input placeholder="González" {...register("lastName")} aria-invalid={!!errors.lastName} />
              {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          {!isEditMode && (
            <div>
              <label className="text-sm font-medium block mb-1">Correo electrónico</label>
              <Input type="email" placeholder="cliente@ejemplo.com" {...register("email")} aria-invalid={!!errors.email} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">Teléfono</label>
            <Input placeholder="951 123 4567" {...register("phone")} aria-invalid={!!errors.phone} />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Fecha de nacimiento</label>
            <BirthDatePicker
              value={birthDateValue}
              onChange={(v) => {
                setBirthDateValue(v);
                setValue("birthDate", v);
              }}
            />
            {errors.birthDate && <p className="text-xs text-destructive mt-1">{errors.birthDate.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Notas</label>
            <textarea
              className="w-full h-20 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Notas adicionales sobre el cliente..."
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending || updateMutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#254F40] hover:bg-[#1d3d32] text-[#F6FFB5]" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
