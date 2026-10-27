import { format, differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Calcula la cantidad exacta de noches entre dos fechas (YYYY-MM-DD)
 * Regla oficial del hotel: La fecha de salida no se cuenta como noche adicional.
 * N_noches = F_salida - F_ingreso
 */
export function calculateNights(checkInStr: string, checkOutStr: string): number {
  if (!checkInStr || !checkOutStr) return 0;
  const checkIn = parseDateOnly(checkInStr);
  const checkOut = parseDateOnly(checkOutStr);

  if (!isValid(checkIn) || !isValid(checkOut)) return 0;

  const diff = differenceInCalendarDays(checkOut, checkIn);
  return Math.max(0, diff);
}

/**
 * Convierte un objeto Date a string puro 'YYYY-MM-DD'
 * Evita el desplazamiento de -1 día de toISOString() en husos horarios como Perú (UTC-5)
 */
export function formatDateOnly(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parsea un string 'YYYY-MM-DD' a un Date local sin desfase de horas UTC
 */
export function parseDateOnly(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 12, 0, 0); // Fijar al mediodía para ser inmune a cambios de hora
  }
  return parseISO(dateStr);
}

/**
 * Formatea una fecha para visualización al usuario
 * Ejemplo: "10 de noviembre de 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  try {
    const date = parseDateOnly(dateStr);
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

/**
 * Formato corto: "10 Nov 2026"
 */
export function formatShortDate(dateStr: string): string {
  try {
    const date = parseDateOnly(dateStr);
    return format(date, "d MMM yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}
