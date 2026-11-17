import { useCallback, useEffect, useState } from "react";
import { apiJson, enviarDatos } from "../../config/api";
import EncabezadoSeccion from "./EncabezadoSeccion";

const formatearFecha = (valor) =>
  valor ? new Date(valor).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function SeccionCobros({ usuario, servicios, alActualizar, alActualizarServicios }) {
  const cuenta = usuario.cuentaCobro || {};

  const [tipoCuenta, setTipoCuenta] = useState(cuenta.tipo || "banco");
  const [titular, setTitular] = useState(cuenta.titular || "");
  const [cbu, setCbu] = useState(cuenta.cbu || "");
  const [alias, setAlias] = useState(cuenta.alias || "");
  const [guardandoCuenta, setGuardandoCuenta] = useState(false);
  const [mensajeCuenta, setMensajeCuenta] = useState(null);
  const [errorCuenta, setErrorCuenta] = useState(null);

  const [liquidaciones, setLiquidaciones] = useState({ total: 0, pagos: [] });
  const [cargandoLiquidaciones, setCargandoLiquidaciones] = useState(true);
  const [guarderiaEnProceso, setGuarderiaEnProceso] = useState(null);

  const cargarLiquidaciones = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson("/api/pagos/liquidaciones");

      if (ok) {
        setLiquidaciones(datos);
      }
    } finally {
      setCargandoLiquidaciones(false);
    }
  }, []);

  useEffect(() => {
    cargarLiquidaciones();
  }, [cargarLiquidaciones]);

  const guardarCuenta = async (evento) => {
    evento.preventDefault();
    setMensajeCuenta(null);
    setErrorCuenta(null);

    if (!titular.trim() || (!cbu.trim() && !alias.trim())) {
      setErrorCuenta("Completá el titular y al menos el CBU o Alias.");
      return;
    }

    setGuardandoCuenta(true);

    try {
      await enviarDatos("/api/users/me/cuenta-cobro", "PUT", {
        tipo: tipoCuenta,
        titular: titular.trim(),
        cbu: cbu.trim(),
        alias: alias.trim()
      }, "Error al guardar cuenta");

      setMensajeCuenta("Datos bancarios guardados con éxito.");
      await alActualizar();
    } catch (error) {
      setErrorCuenta(error.message || "Error al guardar cuenta");
    } finally {
      setGuardandoCuenta(false);
    }
  };

  const registrarGuarderia = async (servicioId, accion) => {
    setGuarderiaEnProceso(servicioId);

    try {
      await enviarDatos(`/api/servicios/${servicioId}/${accion}`, "POST", {}, `Error en ${accion}`);
      await alActualizarServicios();
    } catch (error) {
      alert(error.message || "Error al registrar estado de guardería");
    } finally {
      setGuarderiaEnProceso(null);
    }
  };

  const guarderias = (servicios || []).filter(
    (servicio) => servicio.tipo === "Guarderia" && ["aceptado", "en-curso"].includes(servicio.estado)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <EncabezadoSeccion
        etiqueta="Finanzas y control de estadías"
        titulo="Cobros y guardería"
        descripcion="Configurá tu cuenta para transferencias, revisá tus liquidaciones liberadas y gestioná el ingreso y egreso de mascotas en guardería."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-bank text-teal-600"></i> Cuenta de acreditación
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tus ingresos liberados se transfieren a esta cuenta.
            </p>
          </div>

          <form onSubmit={guardarCuenta} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tipo de cuenta
              </label>
              <select
                value={tipoCuenta}
                onChange={(evento) => setTipoCuenta(evento.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="banco">Cuenta Bancaria (CBU)</option>
                <option value="billetera">Billetera Virtual (CVU / Alias)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Titular de la cuenta
              </label>
              <input
                type="text"
                required
                value={titular}
                onChange={(evento) => setTitular(evento.target.value)}
                placeholder="Nombre y Apellido del titular"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                CBU / CVU (22 dígitos)
              </label>
              <input
                type="text"
                value={cbu}
                onChange={(evento) => setCbu(evento.target.value)}
                placeholder="00000031000..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Alias (opcional)
              </label>
              <input
                type="text"
                value={alias}
                onChange={(evento) => setAlias(evento.target.value)}
                placeholder="mi.alias.pago"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {errorCuenta && <p className="text-xs text-rose-600 font-medium">{errorCuenta}</p>}
            {mensajeCuenta && <p className="text-xs text-emerald-600 font-medium">{mensajeCuenta}</p>}

            <button
              type="submit"
              disabled={guardandoCuenta}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {guardandoCuenta ? "Guardando..." : "Guardar datos de cobro"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-cash-stack text-emerald-600"></i> Liquidaciones liberadas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Pagos liquidados al finalizar los servicios.</p>

            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Total acumulado
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
                ${Number(liquidaciones.total || 0).toLocaleString("es-AR")}
              </span>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {cargandoLiquidaciones ? (
              <p className="text-xs text-slate-400 py-4 text-center">Cargando pagos...</p>
            ) : (liquidaciones.pagos || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Todavía no tenés pagos liberados registrados.
              </p>
            ) : (
              liquidaciones.pagos.map((pago) => (
                <div
                  key={pago.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-700 block">Reserva #{pago.servicioId}</span>
                    <span className="text-[11px] text-slate-400">{formatearFecha(pago.liberadoEn)}</span>
                  </div>
                  <span className="font-bold font-mono text-emerald-700">
                    +${Number(pago.monto).toLocaleString("es-AR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-door-open text-teal-600"></i> Check-in y check-out de Guardería
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registrá en tiempo real el ingreso y egreso de cada mascota que se queda a tu cuidado.
          </p>
        </div>

        {servicios === null ? (
          <p className="text-xs text-slate-400 py-3">Cargando guarderías activas...</p>
        ) : guarderias.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs">
            No tenés servicios de guardería activos en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {guarderias.map((servicio) => {
              const puedeIngresar = !servicio.checkIn;
              const puedeEgresar = servicio.checkIn && !servicio.checkOut;

              return (
                <div
                  key={servicio.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{servicio.mascota}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Programado para: {formatearFecha(servicio.horaProgramada)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {servicio.checkIn && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <i className="bi bi-box-arrow-in-down"></i> Ingreso: {formatearFecha(servicio.checkIn)}
                        </span>
                      )}
                      {servicio.checkOut && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 flex items-center gap-1">
                          <i className="bi bi-box-arrow-up"></i> Egreso: {formatearFecha(servicio.checkOut)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {puedeIngresar && (
                      <button
                        type="button"
                        disabled={guarderiaEnProceso === servicio.id}
                        onClick={() => registrarGuarderia(servicio.id, "check-in")}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs disabled:opacity-50"
                      >
                        Registrar ingreso
                      </button>
                    )}
                    {puedeEgresar && (
                      <button
                        type="button"
                        disabled={guarderiaEnProceso === servicio.id}
                        onClick={() => registrarGuarderia(servicio.id, "check-out")}
                        className="border border-teal-600 text-teal-800 hover:bg-teal-50 font-bold text-xs px-3.5 py-2 rounded-xl transition disabled:opacity-50"
                      >
                        Registrar egreso
                      </button>
                    )}
                    {!puedeIngresar && !puedeEgresar && (
                      <span className="text-xs font-semibold text-slate-400">Completado ✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
