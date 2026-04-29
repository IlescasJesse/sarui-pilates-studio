"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Activity, DollarSign, Clock } from "lucide-react";
import { TipoActividadTable } from "@/components/catalogos/TipoActividadTable";
import { PreciosTab } from "@/components/catalogos/PreciosTab";
import { TipoMembresiaTable } from "@/components/catalogos/TipoMembresiaTable";
import { tabTransition, staggerContainer, staggerItem } from "@/lib/animations";

type Tab = "actividades" | "precios" | "membresias";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "actividades", label: "Tipos de Actividad", icon: Activity },
  { id: "precios",     label: "Precios",             icon: DollarSign },
  { id: "membresias",  label: "Membresías",          icon: Clock },
];

export default function CatalogosPage() {
  const [tab, setTab] = useState<Tab>("actividades");

  return (
    <div className="p-6 space-y-6">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-1"
      >
        <motion.div variants={staggerItem} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#254F40] flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#F6FFB5]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Catálogos</h1>
            <p className="text-sm text-muted-foreground">
              Actividades, precios por paquete y tipos de membresía
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Pestañas */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              tab === id ? "text-[#F6FFB5]" : "text-muted-foreground hover:text-gray-700"
            }`}
          >
            {tab === id && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg bg-[#254F40]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          variants={tabTransition}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {tab === "actividades" && <TipoActividadTable />}
          {tab === "precios"     && <PreciosTab />}
          {tab === "membresias"  && <TipoMembresiaTable />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
