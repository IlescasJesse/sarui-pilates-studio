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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", birthDate: "", notes: "" },
  });

  useEffect(() => {
    if (isEditMode && existingCliente) {
      reset({
        firstName: existingCliente.firstName,
        lastName: existingCliente.lastName,
        phone: existingCliente.phone || "",
        birthDate: existingCliente.birthDate ? existingCliente.birthDate.split("T")[0] : "",
        notes: "",
      });
    } else {
      reset();
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
            <Input type="date" {...register("birthDate")} aria-invalid={!!errors.birthDate} />
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
