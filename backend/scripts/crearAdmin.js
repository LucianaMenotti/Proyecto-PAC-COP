// Otorga el rol de administrador a un usuario ya registrado.
// Uso: npm run crear-admin -- correo@ejemplo.com
// El registro público solo crea dueños y prestadores, así que el primer administrador
// se habilita desde el servidor y los siguientes desde el propio panel (cambio de rol).
import "dotenv/config";
import sequelize from "../config/database.js";
import User from "../models/user.model.js";

const email = String(process.argv[2] || "").trim().toLowerCase();

const finalizar = async (mensaje, codigo = 0) => {
  console[codigo ? "error" : "log"](mensaje);
  await sequelize.close().catch(() => null);
  process.exitCode = codigo;
};

if (!email) {
  await finalizar("Indicá el correo del usuario: npm run crear-admin -- correo@ejemplo.com", 1);
} else {
  try {
    await sequelize.authenticate();

    // Solo se leen columnas que existen desde la primera versión de la tabla
    const usuario = await User.findOne({
      where: { email },
      attributes: ["id", "nombre", "apellido", "rol"],
    });

    if (!usuario) {
      await finalizar(`No existe un usuario con el correo ${email}. Registralo primero desde la aplicación.`, 1);
    } else if (["admin", "administrador"].includes(usuario.rol)) {
      await finalizar(`${usuario.nombre} ${usuario.apellido} ya es administrador.`);
    } else {
      await User.update({ rol: "admin" }, { where: { id: usuario.id }, fields: ["rol"] });
      await finalizar(`${usuario.nombre} ${usuario.apellido} ahora es administrador. Cerrá e iniciá sesión de nuevo.`);
    }
  } catch (error) {
    await finalizar(`No se pudo actualizar el usuario: ${error.message}`, 1);
  }
}
