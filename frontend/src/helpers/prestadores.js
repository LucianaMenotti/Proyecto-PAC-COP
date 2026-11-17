import { leerLista, leerPrecios } from "./listas";
import { normalizarConfigPrecio } from "./precios";

export function obtenerServicios(servicios) {
  return leerLista(servicios);
}

// preciosServicios[tipo] puede ser un número o un objeto { precioBase, tipoDescuento, valorDescuento }
export function configPrecioDe(prestador, tipo) {
  return normalizarConfigPrecio(leerPrecios(prestador.preciosServicios)?.[tipo]);
}

export function precioDe(prestador, tipo) {
  return configPrecioDe(prestador, tipo).precioBase;
}
