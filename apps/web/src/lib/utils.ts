import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Merge Tailwind CSS class names, resolving conflicts automatically.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a monetary amount as Mexican Pesos.
 * formatCurrency(1200) → "$1,200.00 MXN"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("MX$", "$") + " MXN";
}

/**
 * Format a date into a human-readable Spanish string.
 * Accepts a Date object, ISO string, or timestamp number.
 * formatDate(new Date()) → "25 de abril de 2026"
 */
export function formatDate(
  date: Date | string | number,
  pattern = "d 'de' MMMM 'de' yyyy"
): string {
  const d =
    typeof date === "string"
      ? parseISO(date)
      : date instanceof Date
      ? date
      : new Date(date);

  if (!isValid(d)) return "—";

  return format(d, pattern, { locale: es });
}

/**
 * Format a date + time.
 * formatDateTime(new Date()) → "25 abr 2026, 14:30"
 */
export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, "d MMM yyyy, HH:mm");
}

/**
 * Return initials from a full name (up to 2 letters).
 * getInitials("Ana García") → "AG"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

/**
 * Truncate a string to a maximum length, adding an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}
