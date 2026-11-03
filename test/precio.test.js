import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularPresupuesto,
  normalizarConfigPrecio,
  formatearResumenPrecio,
} from "../src/helpers/precio.helper.js";

test("calcularPresupuesto con 1 sola mascota devuelve el precio base", () => {
  const resultado = calcularPresupuesto(5000, 1, {
    tipoDescuento: "porcentaje",
    valorDescuento: 20,
  });

  assert.equal(resultado.total, 5000);
  assert.equal(resultado.descuentoTotal, 0);
  assert.equal(resultado.cantidadMascotas, 1);
});

test("calcularPresupuesto con Opción A: Porcentaje en adicionales (ej: 10% en 2da+)", () => {
  // 1ra mascota: $5000
  // 2da mascota: $5000 * 0.9 = $4500
  // Total: $9500 (ahorro: $500)
  const resultado = calcularPresupuesto(5000, 2, {
    tipoDescuento: "porcentaje",
    valorDescuento: 10,
  });

  assert.equal(resultado.total, 9500);
  assert.equal(resultado.descuentoTotal, 500);
  assert.equal(resultado.costoMascotasExtra, 4500);
});

test("calcularPresupuesto con Opción B: Fijo incremental por mascota extra (ej: +$3000)", () => {
  // 1ra mascota: $5000
  // 2da y 3ra mascota: 2 * $3000 = $6000
  // Total: $11000 (subtotal sin descuento: $15000, ahorro: $4000)
  const resultado = calcularPresupuesto(5000, 3, {
    tipoDescuento: "fijoIncremental",
    valorDescuento: 3000,
  });

  assert.equal(resultado.total, 11000);
  assert.equal(resultado.costoMascotasExtra, 6000);
  assert.equal(resultado.descuentoTotal, 4000);
});

test("formatearResumenPrecio genera las descripciones solicitadas", () => {
  assert.equal(
    formatearResumenPrecio({
      precioBase: 5000,
      tipoDescuento: "porcentaje",
      valorDescuento: 15,
    }),
    "$5000/u (2da+ con 15% desc)",
  );

  assert.equal(
    formatearResumenPrecio({
      precioBase: 5000,
      tipoDescuento: "fijoIncremental",
      valorDescuento: 3000,
    }),
    "$5000/u (+$3000 por extra)",
  );

  assert.equal(formatearResumenPrecio(4000), "$4000/u");
});
