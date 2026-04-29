"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { DollarSign, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTipoActividades, type TipoActividad } from "@/hooks/useTipoActividades";
import { usePaquetes, useCreatePaquete, useUpdatePaquete, type Paquete } from "@/hooks/usePaquetes";
import { apiClient } from "@/lib/api-client";
import { staggerContainer, staggerItem } from "@/lib/animations";

// ── Tiers de precios ────────────────────────────────────────────────────────

const TIERS = [
  { sessions: 1,  label: "Sesión única", validityDefault: 1  },
  { sessions: 6,  label: "6 sesiones",   validityDefault: 20 },
  { sessions: 8,  label: "8 sesiones",   validityDefault: 20 },
  { sessions: 10, label: "10 sesiones",  validityDefault: 30 },
  { sessions: 20, label: "20 sesiones",  validityDefault: 40 },
] as const;

type TierSessions = (typeof TIERS)[number]["sessions"];

interface TierState {
  packageId?: string;
  price: string;
  validityDays: string;
  enabled: boolean;
}

type FormState = Record<TierSessions, TierState>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialForm(
  actividad: TipoActividad,
  paquetes: Paquete[]
): FormState {
  const porActividad = paquetes.filter((p) => p.tipoActividadId === actividad.id);
  const bySession: Record<number, Paquete> = {};
  for (const p of porActividad) {
    if (!bySession[p.sessions]) bySession[p.sessions] = p;
  }

  return Object.fromEntries(
    TIERS.map((t) => {
      const pkg = bySession[t.sessions];
      return [
        t.sessions,
        {
          packageId: pkg?.id,
          price: pkg ? String(pkg.price) : "",
          validityDays: pkg ? String(pkg.validityDays) : String(t.validityDefault),
          enabled: !!pkg,
        },
      ];
    })
  ) as FormState;
}

function formatMXN(val: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(val);
}

// ── Modal de edición ─────────────────────────────────────────────────────────

interface PreciosModalProps {
  actividad: TipoActividad;
  paquetes: Paquete[];
  onClose: () => void;
  onSaved: () => void;
}

function PreciosModal({ actividad, paquetes, onClose, onSaved }: PreciosModalProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(actividad, paquetes));
  const [saving, setSaving] = useState(false);
  const createMutation = useCreatePaquete();

  const update = (sessions: TierSessions, field: keyof TierState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [sessions]: { ...prev[sessions], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ops: Promise<unknown>[] = [];

      for (const tier of TIERS) {
        const t = form[tier.sessions];
        if (!t.enabled) continue;

        const price = parseFloat(t.price);
        const validityDays = parseInt(t.validityDays, 10);

        if (isNaN(price) || price <= 0) {
          toast.error(`Precio inválido para ${tier.label}`);
          setSaving(false);
          return;
        }
        if (isNaN(validityDays) || validityDays <= 0) {
          toast.error(`Vigencia inválida para ${tier.label}`);
          setSaving(false);
          return;
        }

        if (t.packageId) {
          ops.push(
            apiClient.put(`/paquetes/${t.packageId}`, { price, validityDays, isActive: true })
          );
        } else {
          ops.push(
            createMutation.mutateAsync({
              name: `${actividad.nombre} — ${tier.label}`,
              tipoActividadId: actividad.id,
              sessions: tier.sessions,
              price,
              validityDays,
              isActive: true,
            })
          );
        }
      }

      await Promise.all(ops);
      toast.success("Precios guardados");
      onSaved();
      onClose();
    } catch {
      toast.error("Error al guardar precios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#254F40]">
            {actividad.color && (
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: actividad.color }} />
            )}
            {actividad.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 pt-1">
          {/* Cabecera */}
          <div className="grid grid-cols-[1fr_120px_100px_40px] gap-2 px-2 pb-1">
            <span className="text-xs font-medium text-muted-foreground">Paquete</span>
            <span className="text-xs font-medium text-muted-foreground">Precio (MXN)</span>
            <span className="text-xs font-medium text-muted-foreground">Vigencia (días)</span>
            <span />
          </div>

          {TIERS.map((tier) => {
            const t = form[tier.sessions];
            return (
              <div
                key={tier.sessions}
                className={`grid grid-cols-[1fr_120px_100px_40px] gap-2 items-center rounded-lg px-2 py-2 transition-colors ${
                  t.enabled ? "bg-[#254F40]/5" : "bg-muted/30"
                }`}
              >
                <span className="text-sm font-medium text-gray-800">{tier.label}</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="pl-5 h-8 text-sm"
                    placeholder="0"
                    value={t.price}
                    disabled={!t.enabled}
                    onChange={(e) => update(tier.sessions, "price", e.target.value)}
                  />
                </div>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-sm"
                  value={t.validityDays}
                  disabled={!t.enabled}
                  onChange={(e) => update(tier.sessions, "validityDays", e.target.value)}
                />
                <button
                  type="button"
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                    t.enabled
                      ? "bg-[#254F40] text-white"
                      : "border border-border text-muted-foreground hover:border-[#254F40]"
                  }`}
                  onClick={() => update(tier.sessions, "enabled", !t.enabled)}
                >
                  {t.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          Activa cada paquete con el check y define su precio + vigencia en días.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar precios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tabla principal ───────────────────────────────────────────────────────────

export function PreciosTab() {
  const { data: actividades = [], isLoading: loadingAct } = useTipoActividades();
  const { data: paquetes = [], isLoading: loadingPaq, refetch } = usePaquetes();
  const [editando, setEditando] = useState<TipoActividad | null>(null);

  const isLoading = loadingAct || loadingPaq;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-[#254F40]/8 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (actividades.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-base">Sin tipos de actividad</p>
        <p className="text-sm mt-1">Crea actividades en la pestaña "Tipos de Actividad" primero</p>
      </div>
    );
  }

  const paquetesPorActividad = (actividadId: string) =>
    paquetes.filter((p) => p.tipoActividadId === actividadId);

  const precioTier = (actividadId: string, sessions: number) => {
    const p = paquetes.find((pkg) => pkg.tipoActividadId === actividadId && pkg.sessions === sessions);
    return p ? formatMXN(Number(p.price)) : null;
  };

  return (
    <div>
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        <motion.table
          className="w-full sarui-table text-sm"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <thead>
            <tr>
              <th>Actividad</th>
              {TIERS.map((t) => (
                <th key={t.sessions} className="text-center whitespace-nowrap">
                  {t.label}
                </th>
              ))}
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividades.map((act) => (
              <motion.tr key={act.id} variants={staggerItem} layout>
                <td>
                  <div className="flex items-center gap-2">
                    {act.color && (
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: act.color }} />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{act.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {paquetesPorActividad(act.id).length} paquetes configurados
                      </p>
                    </div>
                  </div>
                </td>
                {TIERS.map((t) => {
                  const precio = precioTier(act.id, t.sessions);
                  return (
                    <td key={t.sessions} className="text-center">
                      {precio ? (
                        <span className="font-medium text-gray-900">{precio}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => setEditando(act)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      </div>

      {editando && (
        <PreciosModal
          actividad={editando}
          paquetes={paquetes}
          onClose={() => setEditando(null)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}
