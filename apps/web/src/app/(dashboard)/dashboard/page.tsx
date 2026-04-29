"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  CreditCard,
  Activity,
  Clock,
  User,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { apiClient } from "@/lib/api-client";
import { fadeInUp, slideInLeft, slideInRight } from "@/lib/animations";
import { formatDateTime } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalClientes: number;
    clientesActivos: number;
    membresiasActivas: number;
    reservasHoy: number;
    clasesHoy: number;
    clasesEsteMes: number;
  };
  clasesHoy: Array<{
    id: string;
    title?: string;
    type: string;
    subtype: string;
    startAt: string;
    endAt: string;
    capacity: number;
    spotsBooked: number;
    instructor: { id: string; firstName: string; lastName: string };
  }>;
}

async function fetchDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<{ success: boolean; data: DashboardData }>("/dashboard");
  return response.data.data;
}

// Animaciones
const pageEnter = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const headerVariant = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 340, damping: 28 } },
};

const cardGridVariant = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 320, damping: 26 } },
};

const classeItemVariant = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 5,
  });

  const metrics = [
    {
      title: "Clientes activos",
      value: isLoading ? "—" : data?.stats.clientesActivos ?? 0,
      description: "Con membresía o paquete vigente",
      icon: Users,
      trend: null,
      color: "green" as const,
    },
    {
      title: "Clases hoy",
      value: isLoading ? "—" : data?.stats.clasesHoy ?? 0,
      description: "Programadas para hoy",
      icon: CalendarCheck,
      trend: null,
      color: "blue" as const,
    },
    {
      title: "Membresías activas",
      value: isLoading ? "—" : data?.stats.membresiasActivas ?? 0,
      description: "En estado activo",
      icon: CreditCard,
      trend: null,
      color: "amber" as const,
    },
    {
      title: "Sesiones del mes",
      value: isLoading ? "—" : data?.stats.clasesEsteMes ?? 0,
      description: "Clases impartidas este mes",
      icon: Activity,
      trend: null,
      color: "purple" as const,
    },
  ];

  return (
    <motion.div
      className="space-y-8"
      variants={pageEnter}
      initial="hidden"
      animate="visible"
    >
      {/* Encabezado */}
      <motion.div variants={headerVariant}>
        <h1 className="text-2xl font-bold text-[#254F40]">Panel general</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen operativo de Sarui Pilates Studio
        </p>
      </motion.div>

      {/* Tarjetas de métricas */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        variants={cardGridVariant}
      >
        {metrics.map((metric) => (
          <motion.div key={metric.title} variants={cardVariant}>
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </motion.div>

      {/* Paneles inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Clases de hoy — entra desde la izquierda */}
        <motion.div
          className="rounded-xl border border-border bg-card overflow-hidden"
          variants={slideInLeft}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              Próximas clases de hoy
            </h2>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-16 bg-muted rounded-lg"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            ) : error ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Error al cargar las clases
              </p>
            ) : data?.clasesHoy && data.clasesHoy.length > 0 ? (
              <motion.div
                className="space-y-3"
                variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.55 } } }}
                initial="hidden"
                animate="visible"
              >
                {data.clasesHoy.map((clase) => (
                  <motion.div
                    key={clase.id}
                    className="flex items-start justify-between gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    variants={classeItemVariant}
                    whileHover={{ x: 3 }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {clase.title ?? clase.subtype}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(clase.startAt).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {clase.instructor.firstName} {clase.instructor.lastName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {clase.spotsBooked}/{clase.capacity}
                      </p>
                      <p className="text-xs text-muted-foreground">lugares</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.p
                className="text-center text-sm text-muted-foreground py-8"
                variants={fadeInUp}
              >
                No hay clases programadas para hoy
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Últimas reservaciones — entra desde la derecha */}
        <motion.div
          className="rounded-xl border border-border bg-card overflow-hidden"
          variants={slideInRight}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.55 }}
        >
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Últimas reservaciones
            </h2>
          </div>

          <div className="p-6">
            <motion.p
              className="text-center text-sm text-muted-foreground py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Próximamente
            </motion.p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
