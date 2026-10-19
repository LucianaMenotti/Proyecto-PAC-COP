export const adminMiddleware = (req, res, next) => {
  const rol = req.user?.rol;

  if (!["admin", "administrador"].includes(rol)) {
    return res
      .status(403)
      .json({ mensaje: "Necesitás permisos de administrador" });
  }

  next();
};
