import React, { useEffect, useState } from 'react';
import {
  getLiquidaciones,
  updateCuentaCobro,
  getServicios,
  registrarGuarderia,
} from '../../api/prestador';

export default function CobrosGuarderiaSection({ user, onUserDataUpdated }) {
  // Cuenta de cobro
  const [tipoCuenta, setTipoCuenta] = useState(user?.cuentaCobro?.tipo || 'banco');
  const [titular, setTitular] = useState(user?.cuentaCobro?.titular || '');
  const [cbu, setCbu] = useState(user?.cuentaCobro?.cbu || '');
  const [alias, setAlias] = useState(user?.cuentaCobro?.alias || '');

  const [savingCuenta, setSavingCuenta] = useState(false);
  const [cuentaMsg, setCuentaMsg] = useState(null);
  const [cuentaError, setCuentaError] = useState(null);

  // Liquidaciones
  const [liquidaciones, setLiquidaciones] = useState({ total: 0, pagos: [] });
  const [loadingLiq, setLoadingLiq] = useState(true);

  // Guarderías activas (checkin/checkout)
  const [guarderias, setGuarderias] = useState([]);
  const [loadingGuarderia, setLoadingGuarderia] = useState(true);
  const [actionGuarderiaId, setActionGuarderiaId] = useState(null);

  const cargarDatos = async () => {
    try {
      const [resLiq, resServ] = await Promise.allSettled([
        getLiquidaciones(),
        getServicios(),
      ]);

      if (resLiq.status === 'fulfilled') {
        setLiquidaciones(resLiq.value);
      }
      if (resServ.status === 'fulfilled') {
        const servs = resServ.value.servicios || [];
        setGuarderias(
          servs.filter((s) => s.tipo === 'Guarderia' && ['aceptado', 'en-curso'].includes(s.estado))
        );
      }
    } finally {
      setLoadingLiq(false);
      setLoadingGuarderia(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleGuardarCuenta = async (e) => {
    e.preventDefault();
    setCuentaMsg(null);
    setCuentaError(null);

    if (!titular.trim() || (!cbu.trim() && !alias.trim())) {
      setCuentaError('Completá el titular y al menos el CBU o Alias.');
      return;
    }

    setSavingCuenta(true);
    try {
      const datos = {
        tipo: tipoCuenta,
        titular: titular.trim(),
        cbu: cbu.trim(),
        alias: alias.trim(),
      };
      const res = await updateCuentaCobro(datos);
      setCuentaMsg('Datos bancarios guardados con éxito.');
      onUserDataUpdated?.({ ...user, cuentaCobro: res.cuentaCobro || datos });
    } catch (err) {
      setCuentaError(err.message || 'Error al guardar cuenta');
    } finally {
      setSavingCuenta(false);
    }
  };

  const handleGuarderiaAccion = async (servicioId, accion) => {
    setActionGuarderiaId(servicioId);
    try {
      await registrarGuarderia(servicioId, accion);
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al registrar estado de guardería');
    } finally {
      setActionGuarderiaId(null);
    }
  };

  const formatFecha = (f) =>
    f ? new Date(f).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
          Finanzas y control de estadías
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">Cobros y guardería</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Configurá tu cuenta para transferencias, revisá tus liquidaciones liberadas y gestioná el ingreso y egreso de mascotas en guardería.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario Cuenta de Cobro */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-bank text-teal-600"></i> Cuenta de acreditación
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tus ingresos liberados se transfieren a esta cuenta.
            </p>
          </div>

          <form onSubmit={handleGuardarCuenta} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Tipo de cuenta
              </label>
              <select
                value={tipoCuenta}
                onChange={(e) => setTipoCuenta(e.target.value)}
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
                onChange={(e) => setTitular(e.target.value)}
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
                onChange={(e) => setCbu(e.target.value)}
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
                onChange={(e) => setAlias(e.target.value)}
                placeholder="mi.alias.pago"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {cuentaError && (
              <p className="text-xs text-rose-600 font-medium">{cuentaError}</p>
            )}
            {cuentaMsg && (
              <p className="text-xs text-emerald-600 font-medium">{cuentaMsg}</p>
            )}

            <button
              type="submit"
              disabled={savingCuenta}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {savingCuenta ? 'Guardando...' : 'Guardar datos de cobro'}
            </button>
          </form>
        </div>

        {/* Liquidaciones */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <i className="bi bi-cash-stack text-emerald-600"></i> Liquidaciones liberadas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pagos liquidados al finalizar los servicios.
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Total acumulado
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
                ${Number(liquidaciones.total || 0).toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {loadingLiq ? (
              <p className="text-xs text-slate-400 py-4 text-center">Cargando pagos...</p>
            ) : (liquidaciones.pagos || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Todavía no tenés pagos liberados registrados.
              </p>
            ) : (
              (liquidaciones.pagos || []).map((p, i) => (
                <div
                  key={p.id || i}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-700 block">
                      Reserva #{p.servicioId}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatFecha(p.liberadoEn)}
                    </span>
                  </div>
                  <span className="font-bold font-mono text-emerald-700">
                    +${Number(p.monto).toLocaleString('es-AR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Check-in / Check-out Guardería */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-door-open text-teal-600"></i> Check-in y check-out de Guardería
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registrá en tiempo real el ingreso y egreso de cada mascota que se queda a tu cuidado.
          </p>
        </div>

        {loadingGuarderia ? (
          <p className="text-xs text-slate-400 py-3">Cargando guarderías activas...</p>
        ) : guarderias.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs">
            No tenés servicios de guardería activos en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {guarderias.map((s) => {
              const puedeCheckIn = !s.checkIn;
              const puedeCheckOut = s.checkIn && !s.checkOut;

              return (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{s.mascota}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Programado para: {formatFecha(s.horaProgramada)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {s.checkIn && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <i className="bi bi-box-arrow-in-down"></i> Ingreso: {formatFecha(s.checkIn)}
                        </span>
                      )}
                      {s.checkOut && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 flex items-center gap-1">
                          <i className="bi bi-box-arrow-up"></i> Egreso: {formatFecha(s.checkOut)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {puedeCheckIn && (
                      <button
                        type="button"
                        disabled={actionGuarderiaId === s.id}
                        onClick={() => handleGuarderiaAccion(s.id, 'check-in')}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs disabled:opacity-50"
                      >
                        Registrar ingreso
                      </button>
                    )}
                    {puedeCheckOut && (
                      <button
                        type="button"
                        disabled={actionGuarderiaId === s.id}
                        onClick={() => handleGuarderiaAccion(s.id, 'check-out')}
                        className="border border-teal-600 text-teal-800 hover:bg-teal-50 font-bold text-xs px-3.5 py-2 rounded-xl transition disabled:opacity-50"
                      >
                        Registrar egreso
                      </button>
                    )}
                    {!puedeCheckIn && !puedeCheckOut && (
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
