"use client";

import { useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { MembresiasTable } from "@/components/membresias/MembresiasTable";
import { MembresiaForm } from "@/components/membresias/MembresiaForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MembershipStatus } from "@/hooks/useMembresias";

export default function MembresiasPage() {
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#254F40]/10">
            <CreditCard className="w-5 h-5 text-[#254F40]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#254F40]">Membresías</h1>
            <p className="text-sm text-muted-foreground">Membresías activas y vencidas</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-[#254F40] hover:bg-[#254F40]/90">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Membresía
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="Buscar por nombre de cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter((e.target.value as MembershipStatus) || undefined)}
            className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activa</option>
            <option value="EXPIRED">Vencida</option>
            <option value="EXHAUSTED">Agotada</option>
            <option value="SUSPENDED">Suspendida</option>
          </select>
        </div>

        <MembresiasTable statusFilter={statusFilter} searchTerm={searchTerm} />
      </div>

      <MembresiaForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
