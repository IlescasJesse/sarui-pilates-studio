"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { MembresiasTable } from "@/components/membresias/MembresiasTable";
import { Input } from "@/components/ui/input";
import type { MembershipStatus } from "@/hooks/useMembresias";

export default function MembresiasPage() {
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | undefined>(
    undefined
  );
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#254F40]/10">
          <CreditCard className="w-5 h-5 text-[#254F40]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#254F40]">Membresías</h1>
          <p className="text-sm text-muted-foreground">
            Membresías activas y vencidas
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <select
            value={statusFilter || ""}
            onChange={(e) =>
              setStatusFilter(
                (e.target.value as MembershipStatus) || undefined
              )
            }
            className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="EXHAUSTED">Exhausted</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <MembresiasTable statusFilter={statusFilter} />
      </div>
    </div>
  );
}
