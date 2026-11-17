// Espejo de backend/helpers/precio.helper.js: el backend recalcula siempre el monto real,
// esto solo se usa para mostrar el presupuesto antes de reservar.

export function normalizarConfigPrecio(precioData) {
  if (precioData === null || precioData === undefined) {
    return { precioBase: 0, tipoDescuento: "ninguno", valorDescuento: 0 };
  }

  if (typeof precioData === "number" || typeof precioData === "string") {
    return {
      precioBase: Number(precioData) || 0,
      tipoDescuento: "ninguno",
      valorDescuento: 0
    };
  }

  return {
    precioBase: Number(precioData.precioBase ?? precioData.precio ?? 0) || 0,
    tipoDescuento: precioData.tipoDescuento || "ninguno",
    valorDescuento: Number(precioData.valorDescuento) || 0
  };
}

export function calcularPresupuesto(precioBase, cantidadMascotas, reglaDescuento = {}) {
  const base = Math.max(0, Number(precioBase) || 0);
  const cantidad = Math.max(0, Math.floor(Number(cantidadMascotas) || 0));

  if (cantidad === 0 || base === 0) {
    return {
      precioBase: base,
      cantidadMascotas: cantidad,
      subtotalSinDescuento: 0,
      descuentoTotal: 0,
      costoMascotasExtra: 0,
      total: 0,
      reglaAplicada: "Sin selección"
    };
  }

  if (cantidad === 1) {
    return {
      precioBase: base,
      cantidadMascotas: 1,
      subtotalSinDescuento: base,
      descuentoTotal: 0,
      costoMascotasExtra: 0,
      total: base,
      reglaAplicada: "Precio base unitario"
    };
  }

  const cantidadExtra = cantidad - 1;
  const subtotalSinDescuento = base * cantidad;
  const tipo = reglaDescuento?.tipoDescuento || "ninguno";
  const valor = Number(reglaDescuento?.valorDescuento) || 0;

  let costoMascotasExtra = 0;
  let reglaAplicada = "Tarifa completa sin descuento";

  if (tipo === "porcentaje" && valor > 0) {
    const factorDescuento = Math.max(0, Math.min(100, valor)) / 100;
    const precioUnitarioExtra = base * (1 - factorDescuento);
    costoMascotasExtra = Math.round(precioUnitarioExtra * cantidadExtra * 100) / 100;
    reglaAplicada = `${valor}% desc. a partir de la 2da mascota`;
  } else if (tipo === "fijoIncremental" && valor >= 0) {
    costoMascotasExtra = valor * cantidadExtra;
    reglaAplicada = `+$${valor} por mascota adicional`;
  } else {
    costoMascotasExtra = base * cantidadExtra;
  }

  const total = Math.round((base + costoMascotasExtra) * 100) / 100;
  const descuentoTotal = Math.max(0, Math.round((subtotalSinDescuento - total) * 100) / 100);

  return {
    precioBase: base,
    cantidadMascotas: cantidad,
    subtotalSinDescuento,
    descuentoTotal,
    costoMascotasExtra,
    total,
    reglaAplicada
  };
}

// Ej.: "$5000/u (2da+ con 15% desc)", "$5000/u (+$3000 por extra)"
export function formatearResumenPrecio(precioData, sinPrecio = "Sin precio") {
  const config = normalizarConfigPrecio(precioData);

  if (!config.precioBase) {
    return sinPrecio;
  }

  if (config.tipoDescuento === "porcentaje" && config.valorDescuento > 0) {
    return `$${config.precioBase}/u (2da+ con ${config.valorDescuento}% desc)`;
  }

  if (config.tipoDescuento === "fijoIncremental" && config.valorDescuento >= 0) {
    return `$${config.precioBase}/u (+$${config.valorDescuento} por extra)`;
  }

  return `$${config.precioBase}/u`;
}

export const formatearPesos = (valor) => `$${Number(valor || 0).toLocaleString("es-AR")}`;
