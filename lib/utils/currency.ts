/**
 * Formateador oficial de moneda en Soles Peruanos (S/)
 * Garantiza consistencia en toda la interfaz y comprobantes
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('PEN', 'S/').trim();
}

/**
 * Desglosa un monto total con IGV incluido (18% en Perú)
 * Total = Subtotal * 1.18
 */
export function calculateTaxBreakdown(totalWithTax: number, taxPercentage = 18) {
  const subtotal = Number((totalWithTax / (1 + taxPercentage / 100)).toFixed(2));
  const taxes = Number((totalWithTax - subtotal).toFixed(2));
  return {
    subtotal,
    taxes,
    total: totalWithTax,
  };
}

export function calculateIgvBreakdown(totalWithTax: number, taxPercentage = 18) {
  const res = calculateTaxBreakdown(totalWithTax, taxPercentage);
  return {
    subtotal: res.subtotal,
    igv: res.taxes,
    total: res.total,
  };
}

