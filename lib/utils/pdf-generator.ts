import { jsPDF } from 'jspdf';
import { Reservation } from '@/types/hotel.types';
import { HOTEL_INFO } from '@/lib/constants/hotel-info';
import { formatCurrency, calculateIgvBreakdown } from './currency';
import { formatDisplayDate } from './dates';

/**
 * Genera y descarga un comprobante de reserva en PDF oficial del Hotel Nova Inn
 */
export function generateReservationPDF(reservation: Reservation): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const appleBlue = [10, 132, 255] as const; // #0a84ff Cupertino Blue
  const obsidianNavy = [7, 11, 18] as const; // #070b12 Apple Deep Space
  const slateGray = [100, 116, 139] as const;

  // Encabezado con franja decorativa estilo Apple
  doc.setFillColor(...obsidianNavy);
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setFillColor(...appleBlue);
  doc.rect(0, 42, pageWidth, 3, 'F');

  // Título del Hotel
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(HOTEL_INFO.name.toUpperCase(), 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(218, 225, 235);
  doc.text(`RUC: ${HOTEL_INFO.ruc} | ${HOTEL_INFO.address}`, 14, 26);
  doc.text(`Tel: ${HOTEL_INFO.phone} | WhatsApp: ${HOTEL_INFO.whatsapp} | ${HOTEL_INFO.email}`, 14, 32);

  // Recuadro Código de Reserva
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 65, 10, 51, 24, 2, 2, 'F');
  doc.setTextColor(...obsidianNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CÓDIGO DE RESERVA', pageWidth - 60, 16);
  doc.setFontSize(11);
  doc.setTextColor(...appleBlue);
  doc.text(reservation.reservation_code, pageWidth - 60, 24);
  doc.setFontSize(7);
  doc.setTextColor(...slateGray);
  doc.text(`Estado: ${reservation.status.toUpperCase()}`, pageWidth - 60, 30);

  let currentY = 58;

  // Título del documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...obsidianNavy);
  doc.text('COMPROBANTE DE RESERVA DE HOSPEDAJE', 14, currentY);
  currentY += 8;

  // Sección Datos del Huésped
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...appleBlue);
  doc.text('INFORMACIÓN DEL HUÉSPED TITULAR', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...obsidianNavy);
  const guestName =
    reservation.guests?.full_name ||
    `${reservation.guests?.first_name || ''} ${reservation.guests?.last_name || ''}`.trim() ||
    'Huésped Registrado';
  const guestDoc = `${reservation.guests?.doc_type?.toUpperCase() || 'DOC'}: ${reservation.guests?.doc_number || '-'}`;
  const guestEmail = `Email: ${reservation.guests?.email || '-'}`;
  const guestPhone = `Tel: ${reservation.guests?.phone || '-'}`;

  doc.text(`Nombre: ${guestName}`, 18, currentY + 13);
  doc.text(`Documento: ${guestDoc}`, 18, currentY + 20);
  doc.text(guestEmail, 110, currentY + 13);
  doc.text(guestPhone, 110, currentY + 20);

  currentY += 36;

  // Sección Datos de la Estancia
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 34, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 34, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...appleBlue);
  doc.text('DETALLES DE LA ESTADÍA Y HABITACIÓN', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...obsidianNavy);
  doc.text(`Check-in: ${formatDisplayDate(reservation.check_in_date)} (${HOTEL_INFO.checkInTime})`, 18, currentY + 13);
  doc.text(`Check-out: ${formatDisplayDate(reservation.check_out_date)} (${HOTEL_INFO.checkOutTime})`, 18, currentY + 20);
  doc.text(`Noches: ${reservation.total_nights}`, 110, currentY + 13);
  doc.text(`Huéspedes: ${reservation.guests_count} personas`, 110, currentY + 20);

  const roomNames = reservation.reservation_rooms
    ?.map((rr) => {
      const name = rr.room_types?.name || 'Habitación';
      const num = rr.rooms?.room_number ? ` (Hab. ${rr.rooms.room_number})` : '';
      return `${name}${num}`;
    })
    .filter(Boolean)
    .join(', ') || 'Habitación Confort Nova Inn';

  doc.setFont('helvetica', 'bold');
  doc.text(`Habitación:`, 18, currentY + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(roomNames, 38, currentY + 27);

  currentY += 42;

  // Tabla de desglose financiero
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...obsidianNavy);
  doc.text('RESUMEN DE PAGO Y FACTURACIÓN (SOLES - PEN)', 14, currentY);
  currentY += 6;

  const breakdown = calculateIgvBreakdown(reservation.total_amount_pen);

  doc.setFillColor(...obsidianNavy);
  doc.rect(14, currentY, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('CONCEPTO', 18, currentY + 5);
  doc.text('TOTAL', pageWidth - 36, currentY + 5, { align: 'right' });
  currentY += 7;

  // Filas
  const rows = [
    { desc: `Hospedaje Nova Inn (${reservation.total_nights} noches, ${reservation.guests_count} personas)`, amount: formatCurrency(breakdown.subtotal) },
    { desc: 'IGV Aplicable (18.00% Ley Tributaria del Perú)', amount: formatCurrency(breakdown.igv) },
  ];

  const discountAmount = reservation.discount_amount_pen ?? reservation.discount_pen ?? 0;
  if (discountAmount > 0) {
    rows.push({
      desc: 'Descuento Promocional Aplicado',
      amount: `-${formatCurrency(discountAmount)}`,
    });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...obsidianNavy);

  rows.forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(14, currentY, pageWidth - 28, 7, 'F');
    doc.text(r.desc, 18, currentY + 5);
    doc.text(r.amount, pageWidth - 36, currentY + 5, { align: 'right' });
    currentY += 7;
  });

  // Fila Total estilo Apple
  doc.setFillColor(235, 245, 255); // Cupertino Blue 50
  doc.rect(14, currentY, pageWidth - 28, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...obsidianNavy);
  doc.text('TOTAL GENERAL PAGADO / POR ABONAR:', 18, currentY + 6);
  doc.setTextColor(...appleBlue);
  doc.text(formatCurrency(reservation.total_amount_pen), pageWidth - 36, currentY + 6, { align: 'right' });
  currentY += 16;

  // Políticas y Reglas del Hotel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...obsidianNavy);
  doc.text('TÉRMINOS Y CONDICIONES DEL HOSPEDAJE:', 14, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slateGray);
  const terms = [
    `1. Check-in a partir de las ${HOTEL_INFO.checkInTime} hrs. Presentar DNI, Carné de Extranjería o Pasaporte en recepción.`,
    `2. Check-out hasta las ${HOTEL_INFO.checkOutTime} hrs. El retraso no coordinado genera cargos adicionales.`,
    '3. Está terminantemente prohibido fumar en las habitaciones según Ley N° 25357.',
    '4. Las cancelaciones deben solicitarse con mínimo 48 horas de anticipación.',
    '5. Para cualquier consulta o coordinación de llegada tardía, contáctenos al WhatsApp +51 987 654 321.',
  ];

  terms.forEach((t) => {
    doc.text(t, 14, currentY);
    currentY += 4;
  });

  // Pie de página
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 275, pageWidth - 14, 275);
  doc.setFontSize(7);
  doc.setTextColor(...slateGray);
  doc.text('Hotel Nova Inn - Sistema Integral de Reservas Digitales | Comprobante no válido como Factura SUNAT electrónica.', 14, 282);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`, pageWidth - 14, 282, { align: 'right' });

  // Guardar archivo
  doc.save(`Voucher_Reserva_${reservation.reservation_code}.pdf`);
}
