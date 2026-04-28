"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateInstructor,
  useUpdateInstructor,
  useInstructorById,
} from "@/hooks/useInstructores";
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

const instructorSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
  phone: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

type InstructorFormData = z.infer<typeof instructorSchema>;

// Actividades del estudio
const ACTIVIDADES = [
  { value: "REFORMER", label: "Reformer" },
  { value: "MAT",      label: "Mat" },
  { value: "BARRE",    label: "Barre" },
];

interface InstructorFormProps {
  isOpen: boolean;
  onClose: () => void;
  instructorId?: string;
  onSuccess?: () => void;
}

export function InstructorForm({ isOpen, onClose, instructorId, onSuccess }: InstructorFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const isEditMode = !!instructorId;
  const { data: existingInstructor } = useInstructorById(instructorId);
  const createMutation = useCreateInstructor();
  const updateMutation = useUpdateInstructor(instructorId || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", phone: "", bio: "", specialties: [] },
  });

  useEffect(() => {
    if (isEditMode && existingInstructor) {
      reset({
        firstName: existingInstructor.firstName,
        lastName: existingInstructor.lastName,
        phone: existingInstructor.phone || "",
        bio: existingInstructor.bio || "",
        specialties: existingInstructor.specialties || [],
      });
      setSelectedSpecialties(existingInstructor.specialties || []);
    } else {
      reset();
      setSelectedSpecialties([]);
    }
  }, [isEditMode, existingInstructor, reset]);

  const toggleSpecialty = (value: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const onSubmit = async (data: InstructorFormData) => {
    setErrorMessage(null);
    try {
      const payload = { ...data, specialties: selectedSpecialties };
      if (isEditMode) {
        const { email, password, ...updateData } = payload;
        await updateMutation.mutateAsync(updateData as any);
      } else {
        if (!data.email || !data.password) {
          setErrorMessage("El correo y la contraseña son requeridos");
          return;
        }
        await createMutation.mutateAsync(payload as any);
      }
      reset();
      setSelectedSpecialties([]);
      onClose();
      onSuccess?.();
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar instructora" : "Nueva instructora"}
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
              <Input placeholder="Sofía" {...register("firstName")} aria-invalid={!!errors.firstName} />
              {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Apellido</label>
              <Input placeholder="Ramírez" {...register("lastName")} aria-invalid={!!errors.lastName} />
              {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          {!isEditMode && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Correo electrónico</label>
                <Input type="email" placeholder="instructora@sarui.mx" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Contraseña</label>
                <Input type="password" placeholder="••••••••" {...register("password")} aria-invalid={!!errors.password} />
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">Teléfono</label>
            <Input placeholder="951 123 4567" {...register("phone")} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Biografía</label>
            <textarea
              className="w-full h-20 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Certificaciones, años de experiencia, especialización..."
              {...register("bio")}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Actividades que imparte</label>
            <div className="flex flex-wrap gap-2">
              {ACTIVIDADES.map(({ value, label }) => {
                const active = selectedSpecialties.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleSpecialty(value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      active
                        ? "bg-[#254F40] text-[#F6FFB5] border-[#254F40]"
                        : "bg-white text-[#254F40] border-[#254F40]/30 hover:border-[#254F40]/70"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
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
