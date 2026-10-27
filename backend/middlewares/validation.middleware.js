const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const validateMascota = (req, res, next) => {
  const { nombre, especie, edad } = req.body;

  if (!nombre?.trim() || !especie?.trim()) {
    return res.status(400).json({
      mensaje: "El nombre y la especie de la mascota son obligatorios",
    });
  }

  if (
    edad !== undefined &&
    edad !== null &&
    (Number.isNaN(Number(edad)) || Number(edad) < 0)
  ) {
    return res
      .status(400)
      .json({ mensaje: "La edad debe ser un número positivo" });
  }

  next();
};

export const validateUser = (req, res, next) => {
  const {
    nombre,
    apellido,
    email,
    password,
    telefono,
    dni,
    fechaNacimiento,
    rol,
  } = req.body;

  if (
    [nombre, apellido, email, password, telefono, dni, fechaNacimiento].some(
      (value) => !String(value ?? "").trim(),
    )
  ) {
    return res
      .status(400)
      .json({ mensaje: "Completá todos los datos obligatorios" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ mensaje: "El correo electrónico no es válido" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ mensaje: "La contraseña debe tener al menos 8 caracteres" });
  }

  if (!isValidDate(fechaNacimiento)) {
    return res
      .status(400)
      .json({ mensaje: "La fecha de nacimiento no es válida" });
  }

  if (rol !== undefined && !["dueño", "prestador"].includes(rol)) {
    return res
      .status(400)
      .json({ mensaje: "El rol seleccionado no es válido" });
  }

  next();
};

const SERVICIOS_VALIDOS = ["Paseo", "Guarderia", "Traslado"];

export const validateActualizarServicios = (req, res, next) => {
  const { servicios, preciosServicios } = req.body;

  if (!Array.isArray(servicios)) {
    return res
      .status(400)
      .json({ mensaje: "La lista de servicios no es válida" });
  }

  if (servicios.some((servicio) => !SERVICIOS_VALIDOS.includes(servicio))) {
    return res
      .status(400)
      .json({ mensaje: "Hay un servicio no reconocido en la lista" });
  }

  if (typeof preciosServicios !== "object" || preciosServicios === null) {
    return res
      .status(400)
      .json({ mensaje: "Faltan los precios de los servicios" });
  }

  for (const servicio of servicios) {
    const valor = preciosServicios[servicio];

    if (
      valor !== undefined &&
      (!Number.isFinite(Number(valor)) || Number(valor) <= 0)
    ) {
      return res
        .status(400)
        .json({ mensaje: `Indicá un precio válido para ${servicio}` });
    }
  }

  next();
};
