import { test } from "node:test";
import assert from "node:assert/strict";
import { parsearRango, resumirServicios, tipoBase } from "../helpers/metricas.helper.js";

test("el rango por defecto cubre los últimos 30 días completos", () => {
  const { desde, hasta } = parsearRango({}, new Date("2026-03-31T15:00:00"));

  assert.equal(hasta.getHours(), 23);
  assert.equal(desde.getHours(), 0);
  assert.equal(Math.round((hasta - desde) / 86400000), 30);
});

test("el rango rechaza fechas inválidas o invertidas", () => {
  assert.throws(() => parsearRango({ desde: "no-es-fecha" }));
  assert.throws(() => parsearRango({ desde: "2026-05-10", hasta: "2026-05-01" }));
});

test("los tipos de demostración se agrupan con su tipo base", () => {
  assert.equal(tipoBase("Paseo · 1 hora"), "Paseo");
  assert.equal(tipoBase("guarderia"), "Guarderia");
  assert.equal(tipoBase("Otro servicio"), "Otro");
});

test("el resumen ordena los servicios más solicitados primero", () => {
  const resumen = resumirServicios([
    { tipo: "Paseo", estado: "finalizado", cantidad: 2, monto: 2000 },
    { tipo: "Traslado", estado: "programado", cantidad: 5, monto: 9000 },
    { tipo: "Paseo", estado: "cancelado", cantidad: 1, monto: 1000 },
  ]);

  assert.equal(resumen.total, 8);
  assert.equal(resumen.porEstado.finalizado, 2);
  assert.equal(resumen.porTipo[0].tipo, "Traslado");
  assert.deepEqual(resumen.porTipo[1], {
    tipo: "Paseo",
    cantidad: 3,
    finalizados: 2,
    montoReservado: 3000,
  });
});
