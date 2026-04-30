"use client";

import { useState } from "react";
import { Users, Plus, Globe, ClipboardList } from "lucide-react";
import { ClientesTable } from "@/components/clientes/ClientesTable";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { AgendasPortalTable } from "@/components/clientes/AgendasPortalTable";
import { SolicitudesTable } from "@/components/clientes/SolicitudesTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "clientes" | "portal" | "solicitudes";

export default function ClientesPage() {
  const [tab, setTab] = useState<Tab>("clientes");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleEditCliente = (clienteId: string) => {
    setEditingClienteId(clienteId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingClienteId(undefined);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#254F40]/10">
            <Users className="w-5 h-5 text-[#254F40]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#254F40]">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gestión de clientes del estudio</p>
          </div>
        </div>
        {tab === "clientes" && (
          <Button
            onClick={() => {
              setEditingClienteId(undefined);
              setIsFormOpen(true);
            }}
            className="bg-[#254F40] hover:bg-[#254F40]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#254F40]/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("clientes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "clientes"
              ? "bg-[#254F40] text-[#F6FFB5] shadow-sm"
              : "text-[#254F40]/60 hover:text-[#254F40]"
          }`}
        >
          <Users className="w-4 h-4" />
          Todos los clientes
        </button>
        <button
          onClick={() => setTab("portal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "portal"
              ? "bg-[#254F40] text-[#F6FFB5] shadow-sm"
              : "text-[#254F40]/60 hover:text-[#254F40]"
          }`}
        >
          <Globe className="w-4 h-4" />
          Agendas del Portal
        </button>
        <button
          onClick={() => setTab("solicitudes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "solicitudes"
              ? "bg-[#254F40] text-[#F6FFB5] shadow-sm"
              : "text-[#254F40]/60 hover:text-[#254F40]"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Solicitudes
        </button>
      </div>

      {/* Contenido con animación */}
      <AnimatePresence mode="wait">
        {tab === "clientes" ? (
          <motion.div
            key="clientes"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <Input
              placeholder="Buscar por nombre, correo o teléfono..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
            />
            <ClientesTable
              onEdit={handleEditCliente}
              searchTerm={searchTerm}
              currentPage={currentPage}
            />
          </motion.div>
        ) : tab === "portal" ? (
          <motion.div
            key="portal"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <AgendasPortalTable />
          </motion.div>
        ) : (
          <motion.div
            key="solicitudes"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <SolicitudesTable />
          </motion.div>
        )}
      </AnimatePresence>

      <ClienteForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        clienteId={editingClienteId}
        onSuccess={() => setCurrentPage(1)}
      />
    </div>
  );
}
