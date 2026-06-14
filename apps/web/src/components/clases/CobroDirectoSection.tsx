"use client";

import { Input } from "@/components/ui/input";

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

interface CobroDirectoSectionProps {
  paymentMethod: PaymentMethod | "";
  amount: string;
  onPaymentMethodChange: (v: PaymentMethod | "") => void;
  onAmountChange: (v: string) => void;
  error?: string | null;
}

/**
 * Payment section shown when a client books without a membership (walk-in).
 * Uses inputMode="decimal" + manual sanitization — never type="number".
 */
export function CobroDirectoSection({
  paymentMethod,
  amount,
  onPaymentMethodChange,
  onAmountChange,
  error,
}: CobroDirectoSectionProps) {
  function handleAmountChange(raw: string) {
    // Allow only digits and a single decimal point, max 2 decimal places
    let v = raw.replace(/[^\d.]/g, "");
    const parts = v.split(".");
    if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
    if (parts[1] !== undefined && parts[1].length > 2) {
      v = parts[0] + "." + parts[1].slice(0, 2);
    }
    onAmountChange(v);
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-800">Cobro de entrada directa</p>

      {/* Método de pago */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Método de pago</label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onPaymentMethodChange(paymentMethod === m ? "" : m)}
              className={`text-xs rounded-md border px-2 py-1.5 transition-colors ${
                paymentMethod === m
                  ? "bg-[#254F40] text-[#F6FFB5] border-[#254F40]"
                  : "bg-white text-foreground border-input hover:border-[#254F40]/40"
              }`}
            >
              {PAYMENT_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Monto — solo visible cuando se eligió método */}
      {paymentMethod && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Monto cobrado (MXN)</label>
          <Input
            inputMode="decimal"
            className="h-8 text-xs"
            placeholder="0.00"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {!paymentMethod && (
        <p className="text-xs text-amber-700">
          Selecciona el método para registrar el cobro (opcional, pero recomendado).
        </p>
      )}
    </div>
  );
}
