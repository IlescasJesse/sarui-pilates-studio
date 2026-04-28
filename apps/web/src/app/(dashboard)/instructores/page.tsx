"use client";

import { useState } from "react";
import { UserCheck, Plus } from "lucide-react";
import { InstructoresTable } from "@/components/instructores/InstructoresTable";
import { InstructorForm } from "@/components/instructores/InstructorForm";
import { Button } from "@/components/ui/button";

export default function InstructoresPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructorId, setEditingInstructorId] = useState<
    string | undefined
  >(undefined);

  const handleEditInstructor = (instructorId: string) => {
    setEditingInstructorId(instructorId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingInstructorId(undefined);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#254F40]/10">
            <UserCheck className="w-5 h-5 text-[#254F40]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#254F40]">Instructores</h1>
            <p className="text-sm text-muted-foreground">
              Equipo de instructoras del estudio
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingInstructorId(undefined);
            setIsFormOpen(true);
          }}
          className="bg-[#254F40] hover:bg-[#254F40]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Instructora
        </Button>
      </div>

      <InstructoresTable onEdit={handleEditInstructor} />

      <InstructorForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        instructorId={editingInstructorId}
      />
    </div>
  );
}
