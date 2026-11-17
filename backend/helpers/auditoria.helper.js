import AccionAdmin from "../models/accionAdmin.model.js";

// Guarda una acción del panel de administración. Un fallo al registrar no debe
// deshacer la acción ya realizada, por eso solo se informa en la consola.
export const registrarAccion = async ({
  admin,
  accion,
  entidad,
  entidadId = null,
  motivo = null,
  detalle = null,
}) => {
  try {
    return await AccionAdmin.create({
      adminId: admin.id,
      accion,
      entidad,
      entidadId,
      motivo: motivo ? String(motivo).slice(0, 255) : null,
      detalle,
    });
  } catch (error) {
    console.error("No se pudo registrar la acción administrativa:", error);
    return null;
  }
};
