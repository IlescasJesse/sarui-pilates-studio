"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { CobroDirectoSection } from "./CobroDirectoSection";
import type { PaymentMethod } from "./CobroDirectoSection";
import { Search, CheckCircle, UserPlus, X } from "lucide-react";
import {
  useMotionTokens,
  tokens,
  staggerItem,
} from "@/lib/motion";

interface ClienteOption {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

async function fetchClienteSearch(search: string): Promise<ClienteOption[]> {
  const r = await apiClient.get<{ success: boolean; data: { clientes: ClienteOption[] } }>("/clientes", {
    params: { search, limit: 10 },
  });
  return r.data.data.clientes ?? [];
}

async function fetchClienteMembresias(clientId: string) {
  const r = await apiClient.get<{
    success: boolean;
    data: Array<{ id: string; status: string; sessionsRemaining: number; package: { name: string } }>;
  }>("/membresias", { params: { clientId, status: "ACTIVE" } });
  return r.data.data ?? [];
}

function parseReservaError(err: unknown): string {
  const code = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error?.code;
  const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
  if (code === "ALREADY_RESERVED") return "El cliente ya tiene una reservación para esta clase.";
  if (code === "MEMBERSHIP_MISMATCH") return "La membresía seleccionada no corresponde a este tipo de clase.";
  if (code === "MEMBERSHIP_INVALID") return msg ?? "La membresía no es válida o no tiene sesiones restantes.";
  if (code === "CLASS_TYPE_MISMATCH") return "El tipo de clase no coincide con la membresía seleccionada.";
  return msg ?? "Error al crear la reservación.";
}

interface ReservarLugarPanelProps {
  classId: string;
  disponibles: number;
  onSuccess: () => void;
}

export function ReservarLugarPanel({ classId, disponibles, onSuccess }: ReservarLugarPanelProps) {
  const qc = useQueryClient();
  const mv = useMotionTokens();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null);
  const [selectedMembresiaId, setSelectedMembresiaId] = useState("");
  const [reservaOk, setReservaOk] = useState(false);
  const [reservaError, setReservaError] = useState<string | null>(null);

  // Walk-in payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentAmount, setPaymentAmount] = useState("");

  // New client inline form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: clienteResults = [] } = useQuery({
    queryKey: ["cliente-search", debouncedSearch],
    queryFn: () => fetchClienteSearch(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  const { data: membresias = [] } = useQuery({
    queryKey: ["membresias-cliente", selectedCliente?.id],
    queryFn: () => fetchClienteMembresias(selectedCliente!.id),
    enabled: !!selectedCliente,
  });

  const crearClienteMutation = useMutation({
    mutationFn: async (data: typeof newClient) => {
      const r = await apiClient.post<{ success: boolean; data: { client: ClienteOption } }>("/clientes", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
      });
      return r.data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cliente-search"] });
      const client = (data as any).client ?? data;
      const newCli: ClienteOption = {
        id: client.id ?? (client as any).client?.id,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        phone: newClient.phone || null,
      };
      setSelectedCliente(newCli);
      setSearchTerm(`${newClient.firstName} ${newClient.lastName}`);
      setShowNewClientForm(false);
      setNewClient({ firstName: "", lastName: "", email: "", phone: "" });
    },
  });

  const reservarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCliente) throw new Error("Sin cliente seleccionado");
      const body: Record<string, unknown> = {
        clientId: selectedCliente.id,
        classId,
        membershipId: selectedMembresiaId || undefined,
        origin: selectedMembresiaId ? "MEMBERSHIP" : "WALK_IN",
      };
      if (!selectedMembresiaId && paymentMethod) {
        const parsed = parseFloat(paymentAmount);
        if (!paymentAmount || isNaN(parsed) || parsed <= 0) {
          throw Object.assign(new Error("Ingresa un monto válido para el cobro de entrada directa."), { isLocal: true });
        }
        body.paymentMethod = paymentMethod;
        body.amount = parsed;
      }
      await apiClient.post("/reservaciones", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clase-detalle", classId] });
      qc.invalidateQueries({ queryKey: ["clases"] });
      setReservaOk(true);
      setReservaError(null);
      onSuccess();
    },
    onError: (err: unknown) => {
      if ((err as { isLocal?: boolean }).isLocal) {
        setReservaError((err as Error).message);
        return;
      }
      setReservaError(parseReservaError(err));
    },
  });

  const showCobroDirecto = !!selectedCliente && !selectedMembresiaId && membresias !== undefined;

  // ── Success state §2.7 ────────────────────────────────────────────────────
  if (reservaOk) {
    return (
      <motion.div
        className="flex flex-col items-center gap-3 py-8 text-center"
        variants={mv.successPop}
        initial="hidden"
        animate="visible"
      >
        {/* Check icon: delayed protagonista §2.7 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            mv.reduced
              ? { duration: 0.12 }
              : { ...tokens.spring.calm, delay: 0.08 }
          }
        >
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </motion.div>

        {/* Confirmation text: delay 120ms §2.7 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            mv.reduced
              ? { duration: 0.12 }
              : { duration: tokens.duration.quick, delay: 0.12, ease: tokens.easing.easeOut }
          }
          className="flex flex-col gap-1"
        >
          <p className="font-medium text-emerald-700">¡Reservación creada!</p>
          <p className="text-xs text-muted-foreground">
            {selectedMembresiaId
              ? "La sesión fue descontada de la membresía"
              : "Registrada como entrada directa"}
          </p>
        </motion.div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setReservaOk(false);
            setSelectedCliente(null);
            setSearchTerm("");
            setSelectedMembresiaId("");
            setPaymentMethod("");
            setPaymentAmount("");
            setReservaError(null);
          }}
          className="mt-2"
        >
          Agregar otra
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Buscar cliente ── */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
          Buscar cliente
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Nombre o apellido..."
            className="pl-8 text-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedCliente(null);
              setSelectedMembresiaId("");
              setPaymentMethod("");
              setPaymentAmount("");
              setReservaError(null);
            }}
          />
        </div>

        {/* ── Resultados autocomplete §2.3 ── */}
        <AnimatePresence>
          {debouncedSearch.length >= 2 && !selectedCliente && clienteResults.length > 0 && (
            <motion.ul
              className="mt-1 border border-border rounded-lg overflow-hidden shadow-sm"
              variants={mv.listReveal}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {clienteResults.slice(0, 8).map((c, idx) => (
                <motion.li
                  key={c.id}
                  variants={idx < 8 ? staggerItem : undefined}
                >
                  <motion.button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#254F40]/5 transition-colors"
                    whileTap={mv.reduced ? undefined : { scale: 0.99, transition: { duration: tokens.duration.instant } }}
                    onClick={() => {
                      setSelectedCliente(c);
                      setSearchTerm(`${c.firstName} ${c.lastName}`);
                    }}
                  >
                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                    {c.phone && <span className="text-muted-foreground text-xs ml-2">{c.phone}</span>}
                  </motion.button>
                </motion.li>
              ))}
              {/* Items beyond 8 enter without stagger delay */}
              {clienteResults.slice(8).map((c) => (
                <li key={c.id}>
                  <motion.button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#254F40]/5 transition-colors"
                    whileTap={mv.reduced ? undefined : { scale: 0.99, transition: { duration: tokens.duration.instant } }}
                    onClick={() => {
                      setSelectedCliente(c);
                      setSearchTerm(`${c.firstName} ${c.lastName}`);
                    }}
                  >
                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                    {c.phone && <span className="text-muted-foreground text-xs ml-2">{c.phone}</span>}
                  </motion.button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* ── Sin coincidencias / nuevo cliente §2.3 ── */}
        <AnimatePresence mode="wait">
          {debouncedSearch.length >= 2 && !selectedCliente && clienteResults.length === 0 && (
            <div className="mt-2">
              {!showNewClientForm ? (
                <motion.div
                  key="no-results"
                  variants={mv.fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col items-center gap-2 py-3 bg-muted/30 rounded-lg border border-dashed border-border"
                >
                  <p className="text-xs text-muted-foreground">Sin coincidencias para &quot;{debouncedSearch}&quot;</p>
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#254F40] hover:text-[#1d3d32] transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Crear cliente nuevo
                  </button>
                </motion.div>
              ) : (
                /* New client form — layout expand authorized by spec §2.3 */
                <motion.div
                  key="new-client-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: mv.reduced ? 0.12 : tokens.duration.smooth,
                    ease: tokens.easing.easeOut,
                  }}
                  className="mt-1 border border-[#254F40]/20 rounded-lg p-3 bg-[#254F40]/3 space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-[#254F40] flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" /> Nuevo cliente
                    </p>
                    <button onClick={() => setShowNewClientForm(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nombre *"
                      className="text-xs h-8"
                      value={newClient.firstName}
                      onChange={(e) => setNewClient((p) => ({ ...p, firstName: e.target.value }))}
                    />
                    <Input
                      placeholder="Apellido *"
                      className="text-xs h-8"
                      value={newClient.lastName}
                      onChange={(e) => setNewClient((p) => ({ ...p, lastName: e.target.value }))}
                    />
                  </div>
                  <Input
                    placeholder="Correo electrónico *"
                    type="email"
                    className="text-xs h-8"
                    value={newClient.email}
                    onChange={(e) => setNewClient((p) => ({ ...p, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Teléfono (opcional)"
                    className="text-xs h-8"
                    value={newClient.phone}
                    onChange={(e) => setNewClient((p) => ({ ...p, phone: e.target.value }))}
                  />
                  {crearClienteMutation.isError && (
                    <motion.p
                      variants={mv.fadeInUp}
                      initial="hidden"
                      animate="visible"
                      className="text-xs text-destructive"
                    >
                      {(crearClienteMutation.error as Error)?.message ?? "Error al crear el cliente"}
                    </motion.p>
                  )}
                  <motion.div
                    whileHover={mv.reduced ? undefined : { scale: 1.02, transition: { duration: tokens.duration.quick } }}
                    whileTap={mv.reduced ? undefined : { scale: 0.98, transition: { duration: tokens.duration.instant } }}
                  >
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs bg-[#254F40] hover:bg-[#1d3d32] text-[#F6FFB5]"
                      disabled={!newClient.firstName || !newClient.lastName || !newClient.email || crearClienteMutation.isPending}
                      onClick={() => crearClienteMutation.mutate(newClient)}
                    >
                      {crearClienteMutation.isPending ? "Creando..." : "Crear y seleccionar"}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Cliente seleccionado + membresías §2.4 ── */}
      <AnimatePresence>
        {selectedCliente && (
          <motion.div
            variants={mv.successPop}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="rounded-lg border border-[#254F40]/20 bg-[#254F40]/5 px-3 py-2 mb-3">
              <p className="text-sm font-medium text-[#254F40]">{selectedCliente.firstName} {selectedCliente.lastName}</p>
            </div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
              Membresía / paquete
            </label>
            {membresias.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Sin membresías activas — se registrará como entrada directa.
              </p>
            ) : (
              <select
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                value={selectedMembresiaId}
                onChange={(e) => {
                  setSelectedMembresiaId(e.target.value);
                  if (e.target.value) {
                    setPaymentMethod("");
                    setPaymentAmount("");
                  }
                }}
              >
                <option value="">Sin membresía (entrada directa)</option>
                {membresias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.package?.name} — {m.sessionsRemaining} sesiones restantes
                  </option>
                ))}
              </select>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cobro directo §3.3 ── */}
      <AnimatePresence>
        {showCobroDirecto && (
          <motion.div
            variants={mv.fadeInUp}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <CobroDirectoSection
              paymentMethod={paymentMethod}
              amount={paymentAmount}
              onPaymentMethodChange={setPaymentMethod}
              onAmountChange={setPaymentAmount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error inline §3.3 — no shake, opacity+y only ── */}
      <AnimatePresence>
        {reservaError && (
          <motion.p
            key="reserva-error"
            variants={mv.fadeInUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
          >
            {reservaError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Botón reservar §3.1 ── */}
      <motion.div
        whileHover={mv.reduced ? undefined : { scale: 1.02, transition: { duration: tokens.duration.quick, ease: tokens.easing.easeOut } }}
        whileTap={mv.reduced ? undefined : { scale: 0.98, transition: { duration: tokens.duration.instant } }}
      >
        <Button
          className="w-full bg-[#254F40] hover:bg-[#1d3d32] text-[#F6FFB5]"
          disabled={!selectedCliente || reservarMutation.isPending || disponibles <= 0}
          onClick={() => {
            setReservaError(null);
            reservarMutation.mutate();
          }}
        >
          {reservarMutation.isPending ? "Reservando..." :
           disponibles <= 0 ? "Clase llena" : "Confirmar reservación"}
        </Button>
      </motion.div>

      <p className="text-xs text-center text-muted-foreground">
        Si no encuentras al cliente, puedes crearlo directamente desde aquí.
      </p>
    </div>
  );
}
