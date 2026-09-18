const isValidDate = (value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
};

export const validateMascota = (req, res, next) => {
    const { nombre, especie, edad } = req.body;

    if (!nombre?.trim() || !especie?.trim()) {
        return res.status(400).json({
            mensaje: "El nombre y la especie de la mascota son obligatorios"
        });
    }

    if (edad !== undefined && edad !== null && (Number.isNaN(Number(edad)) || Number(edad) < 0)) {
        return res.status(400).json({ mensaje: "La edad debe ser un número positivo" });
    }

    next();
};

export const validateUser = (req, res, next) => {
    const { nombre, apellido, email, password, telefono, dni, fechaNacimiento } = req.body;

    if ([nombre, apellido, email, password, telefono, dni, fechaNacimiento].some((value) => !String(value ?? "").trim())) {
        return res.status(400).json({ mensaje: "Completá todos los datos obligatorios" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ mensaje: "El correo electrónico no es válido" });
    }

    if (password.length < 8) {
        return res.status(400).json({ mensaje: "La contraseña debe tener al menos 8 caracteres" });
    }

    if (!isValidDate(fechaNacimiento)) {
        return res.status(400).json({ mensaje: "La fecha de nacimiento no es válida" });
    }

    next();
};
