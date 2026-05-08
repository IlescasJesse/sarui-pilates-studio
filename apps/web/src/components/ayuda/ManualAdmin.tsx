"use client";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, CalendarDays, UserCheck, CreditCard, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  {
    icon: Users,
    title: "Gestión de Clientes",
    content:
      "Para registrar un nuevo cliente, navega a la sección 'Clientes' en el sidebar y haz click en 'Nuevo Cliente'. Completa el formulario con nombre, email, teléfono y PIN de 4 dígitos. El PIN permite al cliente acceder al portal y realizar reservaciones.",
  },
  {
    icon: CalendarDays,
    title: "Gestión de Clases",
    content:
      "Ve a 'Clases' en el sidebar. Usa el calendario para seleccionar fecha y hora. Haz click en 'Nueva Clase', selecciona el tipo de actividad, instructor y capacidad. Puedes arrastrar en el calendario para seleccionar un rango de tiempo rápidamente.",
  },
  {
    icon: UserCheck,
    title: "Gestión de Instructores",
    content:
      "En la sección 'Instructores' puedes dar de alta nuevos instructores. Completa su información y asígnales tipos de actividades que pueden impartir. El instructor aparecerá automáticamente en el dropdown al crear una clase.",
  },
  {
    icon: CreditCard,
    title: "Gestión de Membresías y Paquetes",
    content:
      "Las membresías se gestionan en la sección 'Membresías'. Puedes crear diferentes planes (mensual, trimestral, anual) con número de clases incluidas. Los paquetes son opciones pre-pagadas de clases individuales. Al asignar una membresía a un cliente, el sistema decrementa las sesiones automáticamente.",
  },
  {
    icon: BookOpen,
    title: "Gestión de Reservaciones",
    content:
      "Las reservaciones se listan en 'Reservaciones'. Para asignar un cliente a una clase, haz click en 'Asignar Cliente', busca al cliente y selecciona la clase. El portal también permite a los clientes reservar por su cuenta. Las reservaciones consumen sesiones de la membresía o paquete del cliente.",
  },
];

export function ManualAdmin() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-[#254F40]/10">
        <CardHeader>
          <CardTitle className="text-[#254F40]">
            Manual de Administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {sections.map((section, idx) => (
              <AccordionItem key={idx} value={`admin-${idx}`}>
                <AccordionTrigger className="text-[#254F40] hover:text-[#254F40]/80">
                  <div className="flex items-center gap-2">
                    <section.icon className="w-5 h-5" />
                    {section.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-[#749390] leading-relaxed">
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
}
