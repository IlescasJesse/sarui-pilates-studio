"use client";

import { LandingNav } from "@/components/landing/LandingNav";
import { ScrollIndicator } from "@/components/landing/ScrollIndicator";
import { HeroSection } from "@/components/landing/HeroSection";
import { BeneficiosSection } from "@/components/landing/BeneficiosSection";
import { TiposPilatesSection } from "@/components/landing/TiposPilatesSection";
import { ClasesSection } from "@/components/landing/ClasesSection";

import { NosotrosSection } from "@/components/landing/NosotrosSection";
import { PreciosSection } from "@/components/landing/PreciosSection";
import { UbicacionSection } from "@/components/landing/UbicacionSection";
import { FooterSection } from "@/components/landing/FooterSection";

export default function LandingPage() {
  return (
    <main className="relative">
      <LandingNav />
      <ScrollIndicator />

      <HeroSection />
      <BeneficiosSection />
      <TiposPilatesSection />
      <ClasesSection />
      <NosotrosSection />
      <PreciosSection />
      <UbicacionSection />
      <FooterSection />
    </main>
  );
}
