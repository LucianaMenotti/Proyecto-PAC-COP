// Roles con permisos de administración (mismo criterio que ROLES_ADMIN del frontend)
export const ROLES_ADMIN = ["admin", "administrador"];

export const esAdministrador = (usuario) => ROLES_ADMIN.includes(usuario?.rol);

export const adminMiddleware = (req, res, next) => {
  if (!esAdministrador(req.user)) {
    return res
      .status(403)
      .json({ mensaje: "Necesitás permisos de administrador" });
  }

  next();
};
