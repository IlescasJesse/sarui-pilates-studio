"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Wallet, Target, Plus, Trash2, Loader2, ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useEstadoResultados, useFlujoEfectivo, useBalanceGeneral, useKpis,
  useInversiones, useCrearInversion, useEliminarInversion,
  useRegistrarPagoInversion, useEliminarPagoInversion,
} from "@/hooks/useFinanzas";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CAT_LABELS: Record<string, string> = {
  EQUIPO: "Equipo", LOCAL: "Local/Renta", REMODELACION: "Remodelación", TECNOLOGIA: "Tecnología", OTRO: "Otro",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function Pct({ v, good = true }: { v: number; good?: boolean }) {
  const positive = v >= 0;
  const color = good ? (positive ? "text-emerald-600" : "text-red-500") : (positive ? "text-red-500" : "text-emerald-600");
  return <span className={`font-semibold ${color}`}>{v.toFixed(1)}%</span>;
}

type Tab = "pl" | "flujo" | "balance" | "kpis";

const inversionSchema = z.object({
  concepto:   z.string().min(1, "Requerido"),
  montoTotal: z.coerce.number().positive("Debe ser mayor a 0"),
  fecha:      z.string().min(1, "Requerido"),
  categoria:  z.enum(["EQUIPO", "LOCAL", "REMODELACION", "TECNOLOGIA", "OTRO"]),
  notas:      z.string().optional(),
});

const pagoSchema = z.object({
  monto: z.coerce.number().positive("Debe ser mayor a 0"),
  fecha: z.string().min(1, "Requerido"),
  nota:  z.string().optional(),
});

export default function FinanzasPage() {
  const hoy = new Date();
  const [mes, setMes]   = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [tab, setTab]   = useState<Tab>("pl");
  const [invOpen, setInvOpen]   = useState(false);
  const [pagoOpen, setPagoOpen] = useState<string | null>(null);
  const [expandedInv, setExpandedInv] = useState<string | null>(null);

  const { data: er,      isLoading: loadingER  } = useEstadoResultados(mes, anio);
  const { data: flujo,   isLoading: loadingFl  } = useFlujoEfectivo(mes, anio);
  const { data: balance, isLoading: loadingBal } = useBalanceGeneral();
  const { data: kpis,    isLoading: loadingKpi } = useKpis(mes, anio);
  const { data: inversiones } = useInversiones();

  const crearInv   = useCrearInversion();
  const eliminarInv = useEliminarInversion();
  const registrarPago = useRegistrarPagoInversion();
  const eliminarPago  = useEliminarPagoInversion();

  const invForm  = useForm({ resolver: zodResolver(inversionSchema) });
  const pagoForm = useForm({ resolver: zodResolver(pagoSchema) });

  const onCrearInv = invForm.handleSubmit(async (d) => {
    try {
      await crearInv.mutateAsync({ ...d, fecha: new Date(d.fecha).toISOString() } as any);
      toast.success("Inversión registrada");
      setInvOpen(false); invForm.reset();
    } catch { toast.error("Error al registrar inversión"); }
  });

  const onPago = pagoForm.handleSubmit(async (d) => {
    if (!pagoOpen) return;
    try {
      await registrarPago.mutateAsync({ id: pagoOpen, ...d, fecha: new Date(d.fecha).toISOString() } as any);
      toast.success("Pago registrado");
      setPagoOpen(null); pagoForm.reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? "Error al registrar pago");
    }
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "pl",      label: "Ingresos vs Gastos",   icon: <TrendingUp className="w-4 h-4" /> },
    { id: "flujo",   label: "Flujo de Dinero",      icon: <Wallet className="w-4 h-4" /> },
    { id: "balance", label: "Qué tengo / Qué debo", icon: <DollarSign className="w-4 h-4" /> },
    { id: "kpis",    label: "Rendimiento por Clase", icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/contabilidad" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-lg bg-[#254F40]/10">
          <BarChart3 className="w-5 h-5 text-[#254F40]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#254F40]">Análisis Financiero</h1>
          <p className="text-sm text-muted-foreground">Estado del negocio con términos simples</p>
        </div>
        <div className="ml-auto flex gap-2">
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
            className="px-3 py-2 border border-input rounded-md text-sm">
            {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}
            className="px-3 py-2 border border-input rounded-md text-sm">
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === id ? "border-[#254F40] text-[#254F40]" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── TAB: Estado de Resultados (P&L) ─────────────────────────────── */}
      {tab === "pl" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground bg-[#F6FFB5]/60 border border-[#254F40]/20 rounded-lg p-3">
            <strong>¿Qué es esto?</strong> Muestra cuánto ganó el negocio en el mes. Ingresos menos gastos = utilidad. Si es positivo, el negocio generó dinero. Si es negativo, gastó más de lo que entró.
          </p>
          {loadingER ? <div className="flex justify-center py-16"><Loader2 className="animate-spin w-6 h-6 text-[#254F40]" /></div> : er ? (
            <div className="space-y-4">
              {/* Semáforo */}
              <Card className={er.esBeneficio ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}>
                <CardContent className="p-5 flex items-center gap-4">
                  {er.esBeneficio
                    ? <TrendingUp className="w-10 h-10 text-emerald-600 shrink-0" />
                    : <TrendingDown className="w-10 h-10 text-red-600 shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {er.esBeneficio ? "El negocio tuvo beneficio" : "El negocio tuvo pérdida"} en {MESES[mes-1]} {anio}
                    </p>
                    <p className={`text-3xl font-bold ${er.esBeneficio ? "text-emerald-700" : "text-red-600"}`}>
                      {fmt(er.utilidadNeta)}
                    </p>
                    <p className="text-sm text-muted-foreground">Margen neto: <Pct v={er.margenNeto} /></p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Ingresos */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-700">+ Ingresos</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Registrados manual</span><span>{fmt(er.ingresos.manuales)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Membresías MercadoPago</span><span>{fmt(er.ingresos.membresiasMP)}</span></div>
                    <div className="flex justify-between font-semibold border-t pt-2"><span>Total ingresos</span><span className="text-emerald-600">{fmt(er.ingresos.total)}</span></div>
                  </CardContent>
                </Card>

                {/* Gastos */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">− Gastos totales</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {er.costoServicio.total > 0 && (
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Costos de servicio</span><span>{fmt(er.costoServicio.total)}</span></div>
                    )}
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gastos operativos</span><span>{fmt(er.gastosOperativos.total)}</span></div>
                    <div className="flex justify-between font-semibold border-t pt-2"><span>Total gastos</span><span className="text-red-600">{fmt(er.costoServicio.total + er.gastosOperativos.total)}</span></div>
                  </CardContent>
                </Card>
              </div>

              {/* Resumen */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span>Utilidad bruta (ingresos - costos servicio)</span><span className="font-medium">{fmt(er.utilidadBruta)} <Pct v={er.margenBruto} /></span></div>
                  <div className="flex justify-between font-semibold text-base border-t pt-2"><span>Ganancia final del mes</span><span className={er.esBeneficio ? "text-emerald-600" : "text-red-600"}>{fmt(er.utilidadNeta)} <Pct v={er.margenNeto} /></span></div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* ── TAB: Flujo de Efectivo ───────────────────────────────────────── */}
      {tab === "flujo" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground bg-[#F6FFB5]/60 border border-[#254F40]/20 rounded-lg p-3">
            <strong>¿Qué es esto?</strong> El dinero real que entró y salió. La utilidad puede ser positiva, pero si estás pagando equipos o deudas, el efectivo disponible puede ser menor. Aquí registras los abonos a la inversión inicial del estudio.
          </p>
          {loadingFl ? <div className="flex justify-center py-16"><Loader2 className="animate-spin w-6 h-6 text-[#254F40]" /></div> : flujo ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: "Flujo operativo", desc: "Lo que entró por ventas menos gastos", value: flujo.operativo.neto, icon: <TrendingUp className="w-6 h-6" /> },
                  { label: "Pagos a inversiones", desc: "Abonos a equipos o renta inicial", value: flujo.inversion.neto, icon: <Wallet className="w-6 h-6" />, negative: true },
                  { label: "Flujo neto del mes", desc: "Lo que realmente cambió en tu caja", value: flujo.flujoNeto, icon: <DollarSign className="w-6 h-6" /> },
                ].map(({ label, desc, value, icon, negative }) => {
                  const good = negative ? value === 0 : value >= 0;
                  return (
                    <Card key={label} className={good ? "border-emerald-200" : "border-amber-200"}>
                      <CardContent className="p-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${good ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{icon}</div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={`text-xl font-bold ${value >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmt(value)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {flujo.inversion.detalle.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Pagos a inversiones este mes</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <table className="sarui-table w-full">
                      <thead><tr><th>Inversión</th><th>Categoría</th><th>Nota</th><th className="text-right">Monto</th></tr></thead>
                      <tbody>
                        {flujo.inversion.detalle.map((p, i) => (
                          <tr key={i}>
                            <td className="font-medium">{p.concepto}</td>
                            <td><Badge variant="outline" className="text-xs">{CAT_LABELS[p.categoria]}</Badge></td>
                            <td className="text-sm text-muted-foreground">{p.nota ?? "—"}</td>
                            <td className="text-right text-red-600 font-medium">{fmt(p.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          {/* Inversiones config */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#254F40]">Inversiones registradas</h3>
                <p className="text-xs text-muted-foreground">Equipo, local, remodelaciones — registra el monto total y ve abonando conforme pagas</p>
              </div>
              <Button onClick={() => setInvOpen(true)} className="bg-[#254F40] hover:bg-[#254F40]/90">
                <Plus className="w-4 h-4 mr-1" /> Nueva inversión
              </Button>
            </div>

            {(inversiones ?? []).map(inv => (
              <Card key={inv.id} className={inv.liquidada ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedInv(expandedInv === inv.id ? null : inv.id)}>
                      {expandedInv === inv.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <div>
                        <p className="font-medium">{inv.concepto}</p>
                        <p className="text-xs text-muted-foreground">{CAT_LABELS[inv.categoria]} · {new Date(inv.fecha).toLocaleDateString("es-MX")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total: {fmt(inv.montoTotal)}</p>
                      <p className="text-sm text-emerald-600">Pagado: {fmt(inv.pagado)}</p>
                      {inv.pendiente > 0
                        ? <p className="text-sm font-semibold text-amber-600">Pendiente: {fmt(inv.pendiente)}</p>
                        : <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Liquidada</Badge>}
                    </div>
                    <div className="flex gap-1 ml-4">
                      {!inv.liquidada && (
                        <Button variant="outline" size="sm" onClick={() => setPagoOpen(inv.id)}>Abonar</Button>
                      )}
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-red-500"
                        onClick={() => { if (confirm("¿Eliminar inversión y todos sus pagos?")) eliminarInv.mutate(inv.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#254F40] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (inv.pagado / inv.montoTotal) * 100)}%` }} />
                  </div>

                  {/* Historial de pagos */}
                  {expandedInv === inv.id && inv.pagos.length > 0 && (
                    <div className="mt-3 space-y-1 border-t pt-3">
                      {inv.pagos.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{new Date(p.fecha).toLocaleDateString("es-MX")} {p.nota ? `— ${p.nota}` : ""}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 font-medium">{fmt(Number(p.monto))}</span>
                            <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground hover:text-red-500"
                              onClick={() => eliminarPago.mutate({ invId: inv.id, pagoId: p.id })}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {(inversiones ?? []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                Sin inversiones registradas. Agrega el costo del equipo, la renta inicial, etc.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Balance General ─────────────────────────────────────────── */}
      {tab === "balance" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground bg-[#F6FFB5]/60 border border-[#254F40]/20 rounded-lg p-3">
            <strong>¿Qué es esto?</strong> Una foto de qué tiene el negocio (activos) y qué debe (pasivos). La diferencia es tu patrimonio. La caja es estimada sumando todos los ingresos históricos menos gastos y abonos a inversiones.
          </p>
          {loadingBal ? <div className="flex justify-center py-16"><Loader2 className="animate-spin w-6 h-6 text-[#254F40]" /></div> : balance ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-1"><CardTitle className="text-sm text-blue-700">Lo que tienes (Activos)</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Caja estimada</span><span>{fmt(balance.activos.caja)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Equipo registrado</span><span>{fmt(balance.activos.equipo)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1"><span>Total activos</span><span className="text-blue-700">{fmt(balance.activos.totalActivos)}</span></div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-1"><CardTitle className="text-sm text-orange-700">Lo que debes (Pasivos)</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Inversiones pendientes</span><span>{fmt(balance.pasivos.inversionesPendientes)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1"><span>Total debes</span><span className="text-orange-700">{fmt(balance.pasivos.totalPasivos)}</span></div>
                  </CardContent>
                </Card>
                <Card className={balance.capital.patrimonio >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}>
                  <CardHeader className="pb-1"><CardTitle className={`text-sm ${balance.capital.patrimonio >= 0 ? "text-emerald-700" : "text-red-700"}`}>Tu patrimonio (Capital)</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Invertido</span><span>{fmt(balance.capital.totalInvertido)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ya pagado</span><span className="text-emerald-600">{fmt(balance.capital.totalPagado)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1"><span>Patrimonio neto</span><span className={balance.capital.patrimonio >= 0 ? "text-emerald-700" : "text-red-600"}>{fmt(balance.capital.patrimonio)}</span></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── TAB: KPIs / Unit Economics ───────────────────────────────────── */}
      {tab === "kpis" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground bg-[#F6FFB5]/60 border border-[#254F40]/20 rounded-lg p-3">
            <strong>¿Qué es esto?</strong> Métricas específicas del estudio: qué tan llenas van las clases, cuánto genera cada clase en promedio, cuánto le cuesta al negocio cada clase y qué tan rentables son.
          </p>
          {loadingKpi ? <div className="flex justify-center py-16"><Loader2 className="animate-spin w-6 h-6 text-[#254F40]" /></div> : kpis ? (
            <div className="space-y-4">
              {/* Ocupación */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Ocupación de clases — {MESES[mes-1]} {anio}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-4xl font-bold text-[#254F40]">{kpis.clases.tasaOcupacion}%</p>
                      <p className="text-sm text-muted-foreground">tasa de ocupación</p>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1 pb-1">
                      <p>{kpis.clases.total} clases impartidas</p>
                      <p>{kpis.clases.spotsOcupados} / {kpis.clases.spotsDisponibles} lugares</p>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#254F40] rounded-full"
                      style={{ width: `${kpis.clases.tasaOcupacion}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {kpis.clases.tasaOcupacion >= 80 ? "✅ Excelente — el estudio está muy ocupado"
                      : kpis.clases.tasaOcupacion >= 60 ? "🟡 Bueno — margen para crecer"
                      : "🔴 Bajo — considera promociones o ajuste de horarios"}
                  </p>
                </CardContent>
              </Card>

              {/* Unit Economics */}
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "Ingreso promedio por clase", value: kpis.unitEconomics.ingresoPromedioPorClase, desc: "Cuánto genera en promedio cada clase impartida", color: "text-emerald-600" },
                  { label: "Ingreso promedio por lugar", value: kpis.unitEconomics.ingresoPromedioPorSpot, desc: "Cuánto vale cada lugar reservado en promedio", color: "text-emerald-600" },
                  { label: "Costo promedio por clase", value: kpis.unitEconomics.costoPromedioPorClase, desc: "Cuánto cuesta al negocio impartir cada clase (prorrateo de gastos)", color: "text-red-500" },
                  { label: "Margen promedio por clase", value: kpis.unitEconomics.margenPromedioPorClase, desc: "% que queda de ganancia por clase después de gastos", isPercent: true },
                ].map(({ label, value, desc, color, isPercent }) => (
                  <Card key={label}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className={`text-2xl font-bold mt-1 ${color ?? (value >= 0 ? "text-[#254F40]" : "text-red-500")}`}>
                        {isPercent ? <Pct v={value} /> : fmt(value)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Clientes */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Clientes</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div><p className="text-xs text-muted-foreground">Clientes activos</p><p className="text-xl font-bold text-[#254F40]">{kpis.clientes.activos}</p></div>
                  <div><p className="text-xs text-muted-foreground">Ticket promedio/cliente</p><p className="text-xl font-bold text-[#254F40]">{fmt(kpis.clientes.ticketPromedio)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Reservaciones confirmadas</p><p className="text-xl font-bold text-[#254F40]">{kpis.clientes.reservacionesConfirmadas}</p></div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* Dialog: Nueva Inversión */}
      {invOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#254F40]">Registrar inversión de capital</h3>
            <p className="text-xs text-muted-foreground">Ejemplo: compra de Reformers por $80,000. Después vas abonando conforme pagas.</p>
            <form onSubmit={onCrearInv} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">¿Qué compraste / en qué invertiste?</label>
                <Input {...invForm.register("concepto")} placeholder="Ej: 4 Reformers marca Balanced Body" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Monto total (MXN)</label>
                  <Input type="number" step="0.01" {...invForm.register("montoTotal")} placeholder="80000" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fecha de compra</label>
                  <Input type="date" {...invForm.register("fecha")} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Categoría</label>
                <select {...invForm.register("categoria")} className="w-full px-3 py-2 border border-input rounded-md text-sm">
                  {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notas (opcional)</label>
                <Input {...invForm.register("notas")} placeholder="Proveedor, número de serie, etc." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setInvOpen(false); invForm.reset(); }}>Cancelar</Button>
                <Button type="submit" disabled={crearInv.isPending} className="flex-1 bg-[#254F40] hover:bg-[#254F40]/90">
                  {crearInv.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Registrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Registrar Pago */}
      {pagoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#254F40]">Registrar abono</h3>
            <form onSubmit={onPago} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Monto abonado</label>
                  <Input type="number" step="0.01" {...pagoForm.register("monto")} placeholder="10000" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fecha del pago</label>
                  <Input type="date" {...pagoForm.register("fecha")} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Nota (opcional)</label>
                <Input {...pagoForm.register("nota")} placeholder="Pago mensual, transferencia, etc." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setPagoOpen(null); pagoForm.reset(); }}>Cancelar</Button>
                <Button type="submit" disabled={registrarPago.isPending} className="flex-1 bg-[#254F40] hover:bg-[#254F40]/90">
                  {registrarPago.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Abonar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
