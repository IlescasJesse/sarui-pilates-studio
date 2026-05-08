"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ManualAdmin } from "@/components/ayuda/ManualAdmin";
import { ManualCliente } from "@/components/ayuda/ManualCliente";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AyudaPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-8 h-8 text-[#254F40]" />
          <h1 className="text-3xl font-light text-[#254F40]">
            Centro de Ayuda
          </h1>
        </div>
        <p className="text-[#749390]">
          Guías y manuales para administrar tu studio de Pilates
        </p>
      </motion.div>

      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-[#FDFFEC] border border-[#254F40]/10">
          <TabsTrigger
            value="admin"
            className="data-[state=active]:bg-[#254F40] data-[state=active]:text-white"
          >
            Manual Admin
          </TabsTrigger>
          <TabsTrigger
            value="cliente"
            className="data-[state=active]:bg-[#254F40] data-[state=active]:text-white"
          >
            Manual Cliente
          </TabsTrigger>
        </TabsList>
        <TabsContent value="admin">
          <ManualAdmin />
        </TabsContent>
        <TabsContent value="cliente">
          <ManualCliente />
        </TabsContent>
      </Tabs>
    </div>
  );
}
