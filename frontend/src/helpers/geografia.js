export const PUNTO_INICIAL = [-26.1849, -58.1731];

export const distanciaHaversine = ([lat1, lon1], [lat2, lon2]) => {
  const radioTierra = 6371;
  const aRadianes = (grados) => (grados * Math.PI) / 180;
  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLon / 2) ** 2;

  return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatearHora = (fecha) =>
  new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });

export const formatearCronometro = (segundos) => {
  const minutos = String(Math.floor(segundos / 60)).padStart(2, "0");
  const segundosRestantes = String(segundos % 60).padStart(2, "0");

  return `${minutos}:${segundosRestantes}`;
};
