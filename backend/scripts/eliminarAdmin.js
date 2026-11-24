// Retira el rol administrativo desde la consola del servidor.
// Uso: npm run eliminar-admin -- correo@ejemplo.com
import "dotenv/config";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import User from "../models/user.model.js";

const email = String(process.argv[2] || "").trim().toLowerCase();

const finalizar = async (mensaje, codigo = 0) => {
  console[codigo ? "error" : "log"](mensaje);
  await sequelize.close().catch(() => null);
  process.exitCode = codigo;
};

if (!email) {
  await finalizar("Indicá el correo: npm run eliminar-admin -- correo@ejemplo.com", 1);
} else {
  try {
    await sequelize.authenticate();
    const usuario = await User.findOne({ where: { email }, attributes: ["id", "nombre", "apellido", "rol"] });

    if (!usuario) {
      await finalizar(`No existe un usuario con el correo ${email}.`, 1);
    } else if (!["admin", "administrador"].includes(usuario.rol)) {
      await finalizar(`${usuario.nombre} ${usuario.apellido} no tiene rol administrativo. No se hicieron cambios.`);
    } else {
      const cantidad = await User.count({ where: { rol: { [Op.in]: ["admin", "administrador"] } } });
      if (cantidad <= 1) {
        await finalizar("No se puede retirar el último administrador.", 1);
      } else {
        await User.update({ rol: "dueño" }, { where: { id: usuario.id }, fields: ["rol"] });
        await finalizar(`${usuario.nombre} ${usuario.apellido} ya no es administrador; su rol ahora es dueño.`);
      }
    }
  } catch (error) {
    await finalizar(`No se pudo actualizar el usuario: ${error.message}`, 1);
  }
}
