"use client";

import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { CalendarioClases } from "@/components/clases/CalendarioClases";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function ClasesPage() {
  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div className="flex items-center gap-3" variants={staggerItem}>
        <div className="p-2 rounded-lg bg-[#254F40]/10">
          <CalendarDays className="w-5 h-5 text-[#254F40]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#254F40]">Clases</h1>
          <p className="text-sm text-muted-foreground">
            Calendario de clases del estudio
          </p>
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <CalendarioClases />
      </motion.div>
    </motion.div>
  );
}
