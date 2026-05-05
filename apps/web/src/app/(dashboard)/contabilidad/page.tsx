"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useCuentas, useGastos, useIngresos, useReporteContable,
  useCrearGasto, useCrearIngreso, useEliminarGasto, useEliminarIngreso,
  useCrearCuenta,
  type TipoCuenta, type OrigenIngreso,
} from "@/hooks/useContabilidad";
import { useAuth } from "@/hooks/useAuth";

const gastoSchema = z.object({
  cuentaContableId: z.string().min(1, "Selecciona una cuenta"),
  concepto: z.string().min(1, "Requerido").max(200),
  monto: z.coerce.number().positive("Debe ser mayor a 0"),
  fecha: z.string().min(1, "Requerido"),
  comprobante: z.string().optional(),
  notas: z.string().optional(),
});

const ingresoSchema = z.object({
  cuentaContableId: z.string().min(1, "Selecciona una cuenta"),
  concepto: z.string().min(1, "Requerido").max(200),
  monto: z.coerce.number().positive("Debe ser mayor a 0"),
  fecha: z.string().min(1, "Requerido"),
  origen: z.enum(["MEMBRESIA_MANUAL", "PAQUETE_MANUAL", "PORTAL_MERCADOPAGO", "WALK_IN", "OTRO"]),
  comprobante: z.string().optional(),
  notas: z.string().optional(),
});

const cuentaSchema = z.object({
  codigo: z.string().min(1).max(10),
  nombre: z.string().min(1).max(120),
  tipo: z.enum(["ACTIVO", "PASIVO", "CAPITAL", "INGRESO", "COSTO", "GASTO"]),
  descripcion: z.string().optional(),
});

const TIPO_CUENTA_LABELS: Record<TipoCuenta, string> = {
  ACTIVO: "Activo", PASIVO: "Pasivo", CAPITAL: "Capital",
  INGRESO: "Ingreso", COSTO: "Costo", GASTO: "Gasto",
};

const TIPO_CUENTA_COLORS: Record<TipoCuenta, string> = {
  ACTIVO: "bg-blue-50 text-blue-700 border-blue-200",
  PASIVO: "bg-orange-50 text-orange-700 border-orange-200",
  CAPITAL: "bg-purple-50 text-purple-700 border-purple-200",
  INGRESO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COSTO: "bg-yellow-50 text-yellow-700 border-yellow-200",
  GASTO: "bg-red-50 text-red-700 border-red-200",
};

const ORIGEN_LABELS: Record<OrigenIngreso, string> = {
  MEMBRESIA_MANUAL: "Membresía manual",
  PAQUETE_MANUAL: "Paquete manual",
  PORTAL_MERCADOPAGO: "Portal / MercadoPago",
  WALK_IN: "Sesión suelta",
  OTRO: "Otro",
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

type Tab = "reporte" | "gastos" | "ingresos" | "cuentas";

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default function ContabilidadPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [tab, setTab] = useState<Tab>("reporte");
  const [gastoOpen, setGastoOpen] = useState(false);
  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [cuentaOpen, setCuentaOpen] = useState(false);

  const { data: reporte, isLoading: loadingReporte, refetch } = useReporteContable(mes, anio);
  const { data: gastos,   isLoading: loadingGastos   } = useGastos(mes, anio);
  const { data: ingresos, isLoading: loadingIngresos } = useIngresos(mes, anio);
  const { data: cuentas,  isLoading: loadingCuentas  } = useCuentas();
  const { data: cuentasGasto  } = useCuentas("GASTO");
  const { data: cuentasCosto  } = useCuentas("COSTO");
  const { data: cuentasIngreso } = useCuentas("INGRESO");

  const crearGasto   = useCrearGasto();
  const crearIngreso = useCrearIngreso();
  const eliminarGasto   = useEliminarGasto();
  const eliminarIngreso = useEliminarIngreso();
  const crearCuenta  = useCrearCuenta();

  const gastoForm   = useForm({ resolver: zodResolver(gastoSchema) });
  const ingresoForm = useForm({ resolver: zodResolver(ingresoSchema) });
  const cuentaForm  = useForm({ resolver: zodResolver(cuentaSchema) });

  const cuentasEgreso = [...(cuentasGasto ?? []), ...(cuentasCosto ?? [])];

  const onGuardarGasto = gastoForm.handleSubmit(async (data) => {
    try {
      await crearGasto.mutateAsync({ ...data, fecha: new Date(data.fecha).toISOString() });
      toast.success("Gasto registrado");
      setGastoOpen(false);
      gastoForm.reset();
    } catch { toast.error("Error al registrar gasto"); }
  });

  const onGuardarIngreso = ingresoForm.handleSubmit(async (data) => {
    try {
      await crearIngreso.mutateAsync({ ...data, fecha: new Date(data.fecha).toISOString() } as any);
      toast.success("Ingreso registrado");
      setIngresoOpen(false);
      ingresoForm.reset();
    } catch { toast.error("Error al registrar ingreso"); }
  });

  const onGuardarCuenta = cuentaForm.handleSubmit(async (data) => {
    try {
      await crearCuenta.mutateAsync(data);
      toast.success("Cuenta creada");
      setCuentaOpen(false);
      cuentaForm.reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? "Error al crear cuenta");
    }
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "reporte",   label: "Resumen" },
    { id: "gastos",    label: "Egresos" },
    { id: "ingresos",  label: "Ingresos" },
    { id: "cuentas",   label: "Catálogo SAT" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#254F40]/10">
            <BookOpen className="w-5 h-5 text-[#254F40]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#254F40]">Contabilidad</h1>
            <p className="text-sm text-muted-foreground">Ingresos, egresos y cuentas SAT</p>
          </div>
        </div>
        {/* Selector de período */}
        <div className="flex items-center gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? "border-[#254F40] text-[#254F40]" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >{label}</button>
        ))}
      </div>

      {/* TAB: Reporte */}
      {tab === "reporte" && (
        <div className="space-y-4">
          {loadingReporte ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin w-6 h-6 text-[#254F40]" /></div>
          ) : reporte ? (
            <>
              {/* Cards de resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-emerald-600" />
                      <div>
                        <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide">Total ingresos</p>
                        <p className="text-2xl font-bold text-emerald-700">{fmt(reporte.totalIngresos)}</p>
                        <p className="text-xs text-emerald-600">Membresías: {fmt(reporte.ingresosMembresias)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="w-8 h-8 text-red-600" />
                      <div>
                        <p className="text-xs text-red-700 font-medium uppercase tracking-wide">Total egresos</p>
                        <p className="text-2xl font-bold text-red-700">{fmt(reporte.totalGastos)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className={reporte.balance >= 0 ? "border-[#254F40]/20 bg-[#254F40]/5" : "border-orange-200 bg-orange-50"}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <DollarSign className={`w-8 h-8 ${reporte.balance >= 0 ? "text-[#254F40]" : "text-orange-600"}`} />
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wide ${reporte.balance >= 0 ? "text-[#254F40]" : "text-orange-700"}`}>Balance</p>
                        <p className={`text-2xl font-bold ${reporte.balance >= 0 ? "text-[#254F40]" : "text-orange-600"}`}>{fmt(reporte.balance)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desglose por cuenta */}
              {reporte.desglosePorCuenta.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Desglose por cuenta</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <table className="sarui-table w-full">
                      <thead><tr><th>Cuenta</th><th>Tipo</th><th className="text-right">Total</th></tr></thead>
                      <tbody>
                        {reporte.desglosePorCuenta.map((c) => (
                          <tr key={c.codigo}>
                            <td>{c.codigo} — {c.nombre}</td>
                            <td><span className={`text-xs font-medium ${c.tipo === "ingreso" ? "text-emerald-600" : "text-red-500"}`}>{c.tipo === "ingreso" ? "Ingreso" : "Egreso"}</span></td>
                            <td className={`text-right font-medium ${c.tipo === "ingreso" ? "text-emerald-600" : "text-red-500"}`}>{fmt(c.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              {reporte.desglosePorCuenta.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Sin movimientos en {MESES[mes - 1]} {anio}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* TAB: Egresos */}
      {tab === "gastos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setGastoOpen(true)} className="bg-[#254F40] hover:bg-[#254F40]/90">
              <Plus className="w-4 h-4 mr-2" /> Registrar egreso
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingGastos ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin w-5 h-5 text-[#254F40]" /></div>
              ) : (
                <table className="sarui-table w-full">
                  <thead><tr><th>Fecha</th><th>Concepto</th><th>Cuenta</th><th className="text-right">Monto</th>{isAdmin && <th></th>}</tr></thead>
                  <tbody>
                    {(gastos ?? []).map((g) => (
                      <tr key={g.id}>
                        <td className="text-sm text-muted-foreground">{new Date(g.fecha).toLocaleDateString("es-MX")}</td>
                        <td className="font-medium">{g.concepto}</td>
                        <td className="text-sm text-muted-foreground">{g.cuentaContable.codigo} — {g.cuentaContable.nombre}</td>
                        <td className="text-right font-medium text-red-600">{fmt(Number(g.monto))}</td>
                        {isAdmin && (
                          <td>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-red-500"
                              onClick={() => { if (confirm("¿Eliminar este egreso?")) eliminarGasto.mutate(g.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {!loadingGastos && (gastos ?? []).length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Sin egresos en este período</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: Ingresos */}
      {tab === "ingresos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIngresoOpen(true)} className="bg-[#254F40] hover:bg-[#254F40]/90">
              <Plus className="w-4 h-4 mr-2" /> Registrar ingreso
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingIngresos ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin w-5 h-5 text-[#254F40]" /></div>
              ) : (
                <table className="sarui-table w-full">
                  <thead><tr><th>Fecha</th><th>Concepto</th><th>Origen</th><th>Cuenta</th><th className="text-right">Monto</th>{isAdmin && <th></th>}</tr></thead>
                  <tbody>
                    {(ingresos ?? []).map((i) => (
                      <tr key={i.id}>
                        <td className="text-sm text-muted-foreground">{new Date(i.fecha).toLocaleDateString("es-MX")}</td>
                        <td className="font-medium">{i.concepto}</td>
                        <td className="text-xs text-muted-foreground">{ORIGEN_LABELS[i.origen]}</td>
                        <td className="text-sm text-muted-foreground">{i.cuentaContable.codigo} — {i.cuentaContable.nombre}</td>
                        <td className="text-right font-medium text-emerald-600">{fmt(Number(i.monto))}</td>
                        {isAdmin && (
                          <td>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-red-500"
                              onClick={() => { if (confirm("¿Eliminar este ingreso?")) eliminarIngreso.mutate(i.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {!loadingIngresos && (ingresos ?? []).length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Sin ingresos registrados en este período</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: Catálogo de Cuentas */}
      {tab === "cuentas" && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <Button onClick={() => setCuentaOpen(true)} className="bg-[#254F40] hover:bg-[#254F40]/90">
                <Plus className="w-4 h-4 mr-2" /> Nueva cuenta
              </Button>
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              {loadingCuentas ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin w-5 h-5 text-[#254F40]" /></div>
              ) : (
                <table className="sarui-table w-full">
                  <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Descripción</th></tr></thead>
                  <tbody>
                    {(cuentas ?? []).map((c) => (
                      <tr key={c.id}>
                        <td className="font-mono font-medium">{c.codigo}</td>
                        <td className="font-medium">{c.nombre}</td>
                        <td>
                          <Badge className={`text-xs border ${TIPO_CUENTA_COLORS[c.tipo] ?? ""}`} variant="outline">
                            {TIPO_CUENTA_LABELS[c.tipo]}
                          </Badge>
                        </td>
                        <td className="text-sm text-muted-foreground">{c.descripcion ?? "—"}</td>
                      </tr>
                    ))}
                    {!loadingCuentas && (cuentas ?? []).length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Sin cuentas. Ejecuta el seed SAT para pre-cargar el catálogo.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog: Nuevo Egreso */}
      {gastoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#254F40]">Registrar egreso</h3>
            <form onSubmit={onGuardarGasto} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Concepto</label>
                <Input {...gastoForm.register("concepto")} placeholder="Descripción del egreso" />
                {gastoForm.formState.errors.concepto && <p className="text-xs text-red-500">{gastoForm.formState.errors.concepto.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Monto (MXN)</label>
                  <Input type="number" step="0.01" {...gastoForm.register("monto")} placeholder="0.00" />
                  {gastoForm.formState.errors.monto && <p className="text-xs text-red-500">{gastoForm.formState.errors.monto.message as string}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fecha</label>
                  <Input type="date" {...gastoForm.register("fecha")} />
                  {gastoForm.formState.errors.fecha && <p className="text-xs text-red-500">{gastoForm.formState.errors.fecha.message as string}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cuenta contable</label>
                <select {...gastoForm.register("cuentaContableId")} className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seleccionar cuenta</option>
                  {cuentasEgreso.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                </select>
                {gastoForm.formState.errors.cuentaContableId && <p className="text-xs text-red-500">{gastoForm.formState.errors.cuentaContableId.message as string}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Comprobante / Folio</label>
                <Input {...gastoForm.register("comprobante")} placeholder="Número de factura (opcional)" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setGastoOpen(false); gastoForm.reset(); }}>Cancelar</Button>
                <Button type="submit" disabled={crearGasto.isPending} className="flex-1 bg-[#254F40] hover:bg-[#254F40]/90">
                  {crearGasto.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Nuevo Ingreso */}
      {ingresoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#254F40]">Registrar ingreso</h3>
            <form onSubmit={onGuardarIngreso} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Concepto</label>
                <Input {...ingresoForm.register("concepto")} placeholder="Descripción del ingreso" />
                {ingresoForm.formState.errors.concepto && <p className="text-xs text-red-500">{ingresoForm.formState.errors.concepto.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Monto (MXN)</label>
                  <Input type="number" step="0.01" {...ingresoForm.register("monto")} placeholder="0.00" />
                  {ingresoForm.formState.errors.monto && <p className="text-xs text-red-500">{ingresoForm.formState.errors.monto.message as string}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fecha</label>
                  <Input type="date" {...ingresoForm.register("fecha")} />
                  {ingresoForm.formState.errors.fecha && <p className="text-xs text-red-500">{ingresoForm.formState.errors.fecha.message as string}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Origen del ingreso</label>
                <select {...ingresoForm.register("origen")} className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seleccionar origen</option>
                  {Object.entries(ORIGEN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {ingresoForm.formState.errors.origen && <p className="text-xs text-red-500">{ingresoForm.formState.errors.origen.message as string}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cuenta contable</label>
                <select {...ingresoForm.register("cuentaContableId")} className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seleccionar cuenta</option>
                  {(cuentasIngreso ?? []).map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                </select>
                {ingresoForm.formState.errors.cuentaContableId && <p className="text-xs text-red-500">{ingresoForm.formState.errors.cuentaContableId.message as string}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Comprobante / Folio</label>
                <Input {...ingresoForm.register("comprobante")} placeholder="Número de folio (opcional)" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setIngresoOpen(false); ingresoForm.reset(); }}>Cancelar</Button>
                <Button type="submit" disabled={crearIngreso.isPending} className="flex-1 bg-[#254F40] hover:bg-[#254F40]/90">
                  {crearIngreso.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Nueva Cuenta (solo admin) */}
      {cuentaOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#254F40]">Nueva cuenta contable</h3>
            <form onSubmit={onGuardarCuenta} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Código SAT</label>
                  <Input {...cuentaForm.register("codigo")} placeholder="Ej: 610" />
                  {cuentaForm.formState.errors.codigo && <p className="text-xs text-red-500">{cuentaForm.formState.errors.codigo.message as string}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tipo</label>
                  <select {...cuentaForm.register("tipo")} className="w-full px-3 py-2 border border-input rounded-md text-sm">
                    <option value="">Tipo</option>
                    {Object.entries(TIPO_CUENTA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {cuentaForm.formState.errors.tipo && <p className="text-xs text-red-500">{cuentaForm.formState.errors.tipo.message as string}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Nombre</label>
                <Input {...cuentaForm.register("nombre")} placeholder="Nombre de la cuenta" />
                {cuentaForm.formState.errors.nombre && <p className="text-xs text-red-500">{cuentaForm.formState.errors.nombre.message as string}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Descripción</label>
                <Input {...cuentaForm.register("descripcion")} placeholder="Opcional" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setCuentaOpen(false); cuentaForm.reset(); }}>Cancelar</Button>
                <Button type="submit" disabled={crearCuenta.isPending} className="flex-1 bg-[#254F40] hover:bg-[#254F40]/90">
                  {crearCuenta.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Crear
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
