"use client";

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { PaquetesTable } from "@/components/paquetes/PaquetesTable";
import { PaqueteForm } from "@/components/paquetes/PaqueteForm";
import { Button } from "@/components/ui/button";

export default function PaquetesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPaqueteId, setEditingPaqueteId] = useState<string | undefined>(
    undefined
  );

  const handleEditPaquete = (paqueteId: string) => {
    setEditingPaqueteId(paqueteId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingPaqueteId(undefined);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#254F40]/10">
            <Package className="w-5 h-5 text-[#254F40]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#254F40]">Paquetes</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de paquetes de sesiones
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingPaqueteId(undefined);
            setIsFormOpen(true);
          }}
          className="bg-[#254F40] hover:bg-[#254F40]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Package
        </Button>
      </div>

      <PaquetesTable onEdit={handleEditPaquete} />

      <PaqueteForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        paqueteId={editingPaqueteId}
      />
    </div>
  );
}
