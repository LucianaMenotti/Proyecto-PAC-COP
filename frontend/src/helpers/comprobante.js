import { jsPDF } from "jspdf";

export function descargarComprobante({ reserva, transaccion, fechaTexto, montoFormateado }) {
  const doc = new jsPDF({ unit: "mm", format: [100, 150] });

  const turquesa = [31, 122, 116];
  const coral = [255, 111, 82];
  const tintaSuave = [91, 107, 106];
  const linea = [220, 213, 196];

  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...turquesa);
  doc.text("Pac-Cop", 50, y, { align: "center" });

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...tintaSuave);
  doc.text("Comprobante de pago", 50, y, { align: "center" });

  y += 4;
  doc.setDrawColor(...linea);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(8, y, 92, y);

  const filas = [
    ["N.º de transacción", transaccion.id],
    ["Fecha de pago", fechaTexto],
    ["Reserva", `#${reserva.id}`],
    ["Servicio", reserva.tipo],
    ["Prestador", reserva.prestador],
    ["Mascota", reserva.mascota],
    ["Método de pago", transaccion.metodo],
    ["Estado", transaccion.estado]
  ];

  y += 8;
  doc.setFontSize(9);

  filas.forEach(([etiqueta, valor]) => {
    doc.setTextColor(...tintaSuave);
    doc.text(etiqueta, 8, y);
    doc.setTextColor(30, 40, 40);
    doc.text(String(valor), 92, y, { align: "right" });
    y += 6;
  });

  y += 2;
  doc.setDrawColor(...linea);
  doc.line(8, y, 92, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...tintaSuave);
  doc.text("Total pagado", 8, y);
  doc.setFontSize(14);
  doc.setTextColor(...coral);
  doc.text(`$${montoFormateado}`, 92, y, { align: "right" });

  doc.save(`comprobante-pac-cop-${transaccion.id}.pdf`);
}
