"use client";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, CreditCard, XCircle, User } from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  {
    icon: CalendarDays,
    title: "Cómo Reservar una Clase",
    content:
      "Inicia sesión en el portal con tu email y PIN. Navega a 'Clases Disponibles' y busca la clase que te interese. Haz click en 'Reservar' y confirma tu reservación. Si tienes una membresía o paquete activo, la clase se descontará automáticamente de tu saldo.",
  },
  {
    icon: CreditCard,
    title: "Cómo Pagar con MercadoPago",
    content:
      "Al reservar una clase sin saldo disponible, el sistema te mostrará la opción de pagar con MercadoPago. Haz click en 'Pagar Ahora', se abrirá el checkout de MercadoPago. Completa el pago con tarjeta, transferencia o efectivo. Una vez confirmado, tu reservación quedará activa.",
  },
  {
    icon: XCircle,
    title: "Cómo Cancelar una Reservación",
    content:
      "Ve a 'Mis Reservaciones' en el portal. Busca la clase que deseas cancelar y haz click en 'Cancelar'. Ten en cuenta que algunas membresías tienen políticas de cancelación (ej. con 24h de anticipación). Si cancelas a tiempo, la clase se reembolsará a tu saldo.",
  },
  {
    icon: User,
    title: "Cómo Ver tu Membresía",
    content:
      "En 'Mi Perfil' puedes ver los detalles de tu membresía o paquete actual: fecha de vencimiento, clases restantes, y tipo de plan. También puedes renovar tu membresía desde esta sección si está por vencer.",
  },
];

export function ManualCliente() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-[#254F40]/10">
        <CardHeader>
          <CardTitle className="text-[#254F40]">
            Manual de Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {sections.map((section, idx) => (
              <AccordionItem key={idx} value={`cliente-${idx}`}>
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
