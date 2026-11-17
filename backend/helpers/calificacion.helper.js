import { Op } from "sequelize";
import Calificacion from "../models/calificacion.model.js";
import User from "../models/user.model.js";

// Reseñas que se muestran al público (las filas anteriores a la moderación tienen oculta en null)
export const condicionResenaVisible = () => ({
  [Op.or]: [{ oculta: false }, { oculta: null }],
});

// Recalcula promedio y cantidad de reseñas del prestador con las reseñas visibles
export const recalcularCalificacionPrestador = async (providerId) => {
  const calificaciones = await Calificacion.findAll({
    where: { providerId, ...condicionResenaVisible() },
    attributes: ["puntuacion"],
  });

  const cantidad = calificaciones.length;
  const promedio = cantidad
    ? calificaciones.reduce((total, item) => total + Number(item.puntuacion), 0) / cantidad
    : 0;

  await User.update(
    { calificacion: Number(promedio.toFixed(2)), resenas: cantidad },
    { where: { id: providerId } },
  );

  return { promedio, cantidad };
};
