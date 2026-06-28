"use client";

import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabPersonal } from "./_components/TabPersonal";
import { TabAsistencia } from "./_components/TabAsistencia";
import { TabNomina } from "./_components/TabNomina";

export default function PersonalPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#254F40]/10">
          <Users className="w-5 h-5 text-[#254F40]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#254F40]">Personal y Nómina</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de empleados, asistencia semanal y cálculo de nómina
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="nomina">Nómina</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <TabPersonal />
        </TabsContent>

        <TabsContent value="asistencia" className="mt-4">
          <TabAsistencia />
        </TabsContent>

        <TabsContent value="nomina" className="mt-4">
          <TabNomina />
        </TabsContent>
      </Tabs>
    </div>
  );
}
