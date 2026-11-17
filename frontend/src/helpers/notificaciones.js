import { ROLES_ADMIN, RUTAS } from "../config/rutas";

// A dónde lleva una notificación (tipos que genera el backend: reserva*, mensaje, pago-*, resena,
// reclamo-*, cuenta-*, prestador-pendiente y reporte-nuevo)
export function destinoDeNotificacion(notificacion, usuario) {
  const tipo = notificacion.tipo || "";
  const esPrestador = usuario?.rol === "prestador";

  const esAdmin = ROLES_ADMIN.includes(usuario?.rol);

  if (tipo === "prestador-pendiente" && esAdmin) {
    return { ruta: `${RUTAS.admin}/prestadores`, texto: "Revisar documentación" };
  }

  if (notificacion.reclamoId || tipo.startsWith("reclamo")) {
    if (esAdmin) {
      return { ruta: `${RUTAS.admin}/reclamos`, texto: "Ver reclamos" };
    }

    return {
      ruta: esPrestador ? `${RUTAS.panelPrestador}/reclamos` : RUTAS.misServicios,
      texto: "Ver reclamos"
    };
  }

  if (tipo.startsWith("reserva")) {
    return esPrestador
      ? { ruta: `${RUTAS.panelPrestador}/solicitudes`, texto: "Ver solicitudes" }
      : { ruta: RUTAS.misServicios, texto: "Ver mis reservas" };
  }

  if (tipo === "mensaje" && notificacion.servicioId) {
    return { ruta: `${RUTAS.chat}?servicioId=${notificacion.servicioId}`, texto: "Abrir chat" };
  }

  if (tipo.startsWith("pago")) {
    return esPrestador
      ? { ruta: `${RUTAS.panelPrestador}/cobros`, texto: "Ver cobros" }
      : { ruta: RUTAS.misServicios, texto: "Ver mis reservas" };
  }

  if (tipo.startsWith("cuenta") && esPrestador) {
    return { ruta: `${RUTAS.panelPrestador}/perfil`, texto: "Ver verificación" };
  }

  if (tipo === "resena" && esPrestador) {
    return { ruta: `${RUTAS.panelPrestador}/rendimiento`, texto: "Ver reseñas" };
  }

  return null;
}
