import { jsPDF } from "jspdf";
import { leerLista, leerPrecios } from "./listas";
import { formatearResumenPrecio } from "./precios";
import { NOMBRE_TIPO, TEXTO_ACCIONES, formatearFecha, formatearMonto, rutaDocumento } from "./admin";
import { obtenerEstadoAprobacion } from "./documentacion";
import { textoMotivo } from "./reportes";

const DIAS = [
  ["lunes", "Lunes"],
  ["martes", "Martes"],
  ["miercoles", "Miércoles"],
  ["jueves", "Jueves"],
  ["viernes", "Viernes"],
  ["sabado", "Sábado"],
  ["domingo", "Domingo"]
];

const MARGEN = 15;
const ANCHO = 210 - MARGEN * 2;
const LIMITE_Y = 280;

const turquesa = [31, 122, 116];
const tintaSuave = [91, 107, 106];
const tinta = [30, 40, 40];

export const textoDisponibilidad = (disponibilidad) => {
  const datos = disponibilidad && typeof disponibilidad === "object" ? disponibilidad : {};
  const activos = DIAS.filter(([clave]) => datos[clave]?.activo).map(
    ([clave, nombre]) => `${nombre} ${datos[clave].desde}-${datos[clave].hasta}`
  );

  return activos.length ? activos.join(", ") : "Sin horarios cargados";
};

export const textoServicios = (usuario) => {
  const precios = leerPrecios(usuario.preciosServicios);

  return leerLista(usuario.servicios)
    .map((servicio) => {
      const resumen = formatearResumenPrecio(precios[servicio], "");
      return `${NOMBRE_TIPO[servicio] || servicio}${resumen ? ` (${resumen})` : ""}`;
    })
    .join(", ");
};

// Convierte la imagen servida por la API en JPEG para incrustarla (admite también WEBP)
const cargarImagen = async (ruta) => {
  const respuesta = await fetch(ruta, { credentials: "include" });

  if (!respuesta.ok || !respuesta.headers.get("content-type")?.startsWith("image/")) {
    return null;
  }

  const url = URL.createObjectURL(await respuesta.blob());

  try {
    const imagen = await new Promise((resolver, rechazar) => {
      const elemento = new Image();
      elemento.onload = () => resolver(elemento);
      elemento.onerror = rechazar;
      elemento.src = url;
    });

    const lienzo = document.createElement("canvas");
    const escala = Math.min(1, 800 / Math.max(imagen.width, imagen.height));
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

    return { datos: lienzo.toDataURL("image/jpeg", 0.85), ancho: lienzo.width, alto: lienzo.height };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
};

// Legajo virtual del usuario para la administración: datos, perfil profesional,
// documentación, actividad, reseñas, reclamos y decisiones tomadas.
export async function descargarLegajo({
  usuario,
  estadisticas,
  servicios,
  calificaciones,
  reclamos,
  reportes = [],
  mascotas,
  acciones
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 18;

  const saltoSiHaceFalta = (alto) => {
    if (y + alto > LIMITE_Y) {
      doc.addPage();
      y = 18;
    }
  };

  const titulo = (texto) => {
    saltoSiHaceFalta(14);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...turquesa);
    doc.text(texto, MARGEN, y);
    y += 2;
    doc.setDrawColor(...turquesa);
    doc.line(MARGEN, y, MARGEN + ANCHO, y);
    y += 6;
  };

  const fila = (etiqueta, valor) => {
    const lineas = doc.splitTextToSize(String(valor ?? "-") || "-", ANCHO - 50);
    saltoSiHaceFalta(lineas.length * 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...tintaSuave);
    doc.text(etiqueta, MARGEN, y);
    doc.setTextColor(...tinta);
    doc.text(lineas, MARGEN + 50, y);
    y += lineas.length * 5;
  };

  const parrafo = (texto) => {
    const lineas = doc.splitTextToSize(texto, ANCHO);
    saltoSiHaceFalta(lineas.length * 4.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...tinta);
    doc.text(lineas, MARGEN, y);
    y += lineas.length * 4.5 + 1.5;
  };

  const nombre = `${usuario.nombre} ${usuario.apellido}`;
  const esPrestador = usuario.rol === "prestador";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...turquesa);
  doc.text("Pac-Cop", MARGEN, y);
  doc.setFontSize(10);
  doc.setTextColor(...tintaSuave);
  doc.text(`Legajo de ${esPrestador ? "prestador" : "usuario"} · uso interno`, MARGEN + ANCHO, y, { align: "right" });
  y += 8;
  doc.setFontSize(15);
  doc.setTextColor(...tinta);
  doc.text(nombre, MARGEN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...tintaSuave);
  doc.text(`Usuario #${usuario.id} · Generado el ${formatearFecha(new Date())}`, MARGEN, y);
  y += 4;

  titulo("Datos personales");
  fila("Rol", usuario.rol);
  fila("DNI", usuario.dni);
  fila("Fecha de nacimiento", usuario.fechaNacimiento);
  fila("Correo electrónico", usuario.email);
  fila("Teléfono", usuario.telefono);
  fila("Fecha de alta", formatearFecha(usuario.createdAt));
  fila(
    "Estado de la cuenta",
    usuario.estadoCuenta === "suspendida"
      ? `Suspendida el ${formatearFecha(usuario.suspendidoEn)}: ${usuario.motivoSuspension || "sin motivo"}`
      : "Activa"
  );

  if (esPrestador) {
    titulo("Perfil profesional");
    fila("Verificación", obtenerEstadoAprobacion(usuario.estadoAprobacion).texto);
    if (usuario.motivoRechazo) fila("Motivo del rechazo", usuario.motivoRechazo);
    fila("Revisado el", formatearFecha(usuario.aprobacionRevisadaEn));
    fila("Zona", usuario.zona);
    fila("Servicios y precios", textoServicios(usuario) || "Sin servicios");
    fila("Vehículo", usuario.vehiculo || "Sin vehículo");
    fila("Disponibilidad", textoDisponibilidad(usuario.disponibilidad));
    fila("Tamaños aceptados", leerLista(usuario.tamanosAceptados).join(", ") || "Todos");
    fila("Razas excluidas", leerLista(usuario.restricciones).join(", ") || "Ninguna");
    fila("Calificación", `${Number(usuario.calificacion || 0).toFixed(1)} (${usuario.resenas || 0} reseñas)`);
    fila("Experiencia", usuario.experiencia || "Sin informar");
    fila(
      "Documentación",
      ["documento", "selfie", "cv"]
        .map((tipo) => `${tipo}: ${usuario.documentacion?.[tipo] ? "cargado" : "falta"}`)
        .join(" · ")
    );

    const imagenes = (
      await Promise.all(
        ["documento", "selfie"]
          .filter((tipo) => usuario.documentacion?.[tipo])
          .map((tipo) => cargarImagen(rutaDocumento(usuario.id, tipo)))
      )
    ).filter(Boolean);

    if (imagenes.length) {
      saltoSiHaceFalta(55);
      let x = MARGEN;

      imagenes.forEach((imagen) => {
        const alto = 50;
        const ancho = Math.min((imagen.ancho / imagen.alto) * alto, ANCHO / 2 - 4);
        doc.addImage(imagen.datos, "JPEG", x, y, ancho, alto);
        x += ancho + 6;
      });

      y += 55;
    }
  }

  if (mascotas?.length) {
    titulo("Mascotas registradas");
    mascotas.forEach((mascota) =>
      parrafo(
        `${mascota.nombre} · ${mascota.especie}${mascota.raza ? `, ${mascota.raza}` : ""}${mascota.tamano ? `, ${mascota.tamano}` : ""}${mascota.edad ? `, ${mascota.edad} años` : ""}`
      )
    );
  }

  titulo("Actividad");
  fila(
    "Servicios por estado",
    Object.entries(estadisticas.serviciosPorEstado)
      .map(([estado, cantidad]) => `${estado}: ${cantidad}`)
      .join(" · ") || "Sin servicios"
  );
  if (esPrestador) fila("Cobrado como prestador", formatearMonto(estadisticas.cobradoComoPrestador));
  if (estadisticas.pagadoComoDueno) fila("Pagado como dueño", formatearMonto(estadisticas.pagadoComoDueno));
  fila("Reclamos recibidos", estadisticas.reclamosRecibidos);
  fila("Reportes recibidos", estadisticas.reportesRecibidos ?? reportes.length);

  if (servicios.length) {
    titulo("Últimos servicios");
    servicios.forEach((servicio) =>
      parrafo(
        `#${servicio.id} · ${formatearFecha(servicio.horaProgramada)} · ${servicio.tipo} · ${servicio.estado} · ${formatearMonto(servicio.monto)} · Dueño: ${servicio.dueno || "-"} · Prestador: ${servicio.prestador || "-"}`
      )
    );
  }

  if (calificaciones.length) {
    titulo("Reseñas");
    calificaciones.forEach((calificacion) =>
      parrafo(
        `${calificacion.recibida ? "Recibida de" : "Escrita a"} ${calificacion.recibida ? calificacion.autor : calificacion.prestador} · ${calificacion.puntuacion}/5 · ${formatearFecha(calificacion.fecha, false)}${calificacion.oculta ? " · OCULTA" : ""}${calificacion.comentario ? ` · "${calificacion.comentario}"` : ""}`
      )
    );
  }

  if (reclamos.length) {
    titulo("Reclamos");
    reclamos.forEach((reclamo) =>
      parrafo(
        `#${reclamo.id} (servicio #${reclamo.servicioId}) · ${reclamo.recibido ? "Recibido de" : "Emitido contra"} ${reclamo.recibido ? reclamo.reclamante : reclamo.reclamado} · ${reclamo.estado} · ${formatearFecha(reclamo.fecha, false)}: ${reclamo.descripcion}`
      )
    );
  }

  if (reportes.length) {
    titulo("Reportes recibidos");
    reportes.forEach((reporte) =>
      parrafo(
        `#${reporte.id} · ${textoMotivo(reporte.tipo, reporte.motivo)} · de ${reporte.reportante} · ${reporte.estado} · ${formatearFecha(reporte.fecha, false)}${reporte.detalle ? `: ${reporte.detalle}` : ""}`
      )
    );
  }

  if (acciones.length) {
    titulo("Decisiones de la administración");
    acciones.forEach((accion) =>
      parrafo(
        `${formatearFecha(accion.fecha)} · ${TEXTO_ACCIONES[accion.accion] || accion.accion} · ${accion.admin}${accion.motivo ? ` · Motivo: ${accion.motivo}` : ""}`
      )
    );
  }

  const paginas = doc.getNumberOfPages();

  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFontSize(8);
    doc.setTextColor(...tintaSuave);
    doc.text(`Documento confidencial · Página ${pagina} de ${paginas}`, MARGEN + ANCHO, 290, { align: "right" });
  }

  doc.save(`legajo-pac-cop-${usuario.id}-${usuario.apellido}.pdf`.toLowerCase().replace(/\s+/g, "-"));
}
