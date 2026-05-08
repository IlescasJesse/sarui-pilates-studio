"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ManualAdmin, adminSections } from "@/components/ayuda/ManualAdmin";
import { ManualCliente, clienteSections } from "@/components/ayuda/ManualCliente";
import { useManualFilter } from "@/components/ayuda/useManualFilter";
import { HelpCircle, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function AyudaPage() {
  const [activeTab, setActiveTab] = useState("admin");
  const adminFilter = useManualFilter(adminSections);
  const clienteFilter = useManualFilter(clienteSections);

  const currentFilter =
    activeTab === "admin" ? adminFilter : clienteFilter;

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

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#749390]" />
        <Input
          placeholder="Buscar en el manual..."
          className="pl-10 border-[#254F40]/20 focus-visible:ring-[#254F40]/30"
          value={currentFilter.filterText}
          onChange={(e) => currentFilter.setFilterText(e.target.value)}
        />
      </div>

      <Tabs
        defaultValue="admin"
        className="w-full"
        onValueChange={(v) => setActiveTab(v)}
      >
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
          <ManualAdmin sections={adminFilter.filteredSections} />
        </TabsContent>
        <TabsContent value="cliente">
          <ManualCliente sections={clienteFilter.filteredSections} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
