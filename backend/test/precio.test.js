import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularPresupuesto,
  normalizarConfigPrecio,
  formatearResumenPrecio,
} from "../helpers/precio.helper.js";

test("calcularPresupuesto multiplica la tarifa por hora por la duración", () => {
  const resultado = calcularPresupuesto(5000, 3);

  assert.equal(resultado.precioHora, 5000);
  assert.equal(resultado.duracionHoras, 3);
  assert.equal(resultado.total, 15000);
});

test("la cantidad de mascotas no modifica el cálculo por hora", () => {
  const resultadoUnaMascota = calcularPresupuesto(5000, 2);
  const resultadoTresMascotas = calcularPresupuesto(5000, 2);

  assert.equal(resultadoUnaMascota.total, 10000);
  assert.equal(resultadoTresMascotas.total, 10000);
});

test("normalizarConfigPrecio ignora las antiguas reglas de adicionales por mascota", () => {
  const config = normalizarConfigPrecio({
    precioBase: 5000,
    tipoDescuento: "fijoIncremental",
    valorDescuento: 3000,
  });

  assert.deepEqual(config, { precioBase: 5000 });
});

test("formatearResumenPrecio muestra la tarifa por hora", () => {
  assert.equal(formatearResumenPrecio({ precioBase: 5000 }), "$5000/hora");
  assert.equal(formatearResumenPrecio(4000), "$4000/hora");
});
