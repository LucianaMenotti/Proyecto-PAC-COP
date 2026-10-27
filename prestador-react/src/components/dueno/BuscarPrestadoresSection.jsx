import React, { useState, useEffect, useMemo } from 'react';
import { getPrestadores, getMisMascotas, crearReserva } from '../../api/dueno';

export default function BuscarPrestadoresSection({ user, onReservaCreada }) {
  const [prestadores, setPrestadores] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [filtroServicio, setFiltroServicio] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [mascotaFiltroId, setMascotaFiltroId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Reserva
  const [prestadorElegido, setPrestadorElegido] = useState(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('Paseo');
  const [mascotaSeleccionadaId, setMascotaSeleccionadaId] = useState('');
  const [fechaHora, setFechaHora] = useState('');

  // Campos Traslado
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [motivoTraslado, setMotivoTraslado] = useState('veterinaria');
  const [solicitarVuelta, setSolicitarVuelta] = useState(false);
  const [horaRegreso, setHoraRegreso] = useState('');

  const [savingReserva, setSavingReserva] = useState(false);
  const [errorReserva, setErrorReserva] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [listaP, listaM] = await Promise.allSettled([
          getPrestadores(),
          user?.id ? getMisMascotas(user.id) : Promise.resolve([]),
        ]);

        if (listaP.status === 'fulfilled') setPrestadores(listaP.value || []);
        if (listaM.status === 'fulfilled') {
          const mList = listaM.value || [];
          setMascotas(mList);
          if (mList.length > 0) {
            setMascotaSeleccionadaId(String(mList[0].id));
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const parseList = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) {
      try {
        const p = JSON.parse(val);
        return Array.isArray(p) ? p : [p];
      } catch {
        return val.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      }
    }
    return [];
  };

  // Filtrado de prestadores teniendo en cuenta zona, servicio y RESTRICCIÓN DE RAZA/TAMAÑO
  const prestadoresFiltrados = useMemo(() => {
    const sTerm = filtroServicio.trim().toLowerCase();
    const zTerm = filtroZona.trim().toLowerCase();
    const mascotaSeleccionadaParaFiltro = mascotas.find(
      (m) => String(m.id) === String(mascotaFiltroId)
    );

    return prestadores.filter((p) => {
      const servs = parseList(p.servicios);
      const coincideServicio = !sTerm || servs.some((s) => s.toLowerCase() === sTerm);
      const coincideZona = !zTerm || (p.zona || '').toLowerCase().includes(zTerm);

      // Criterio de Jira: El sistema no debe mostrar al prestador si la mascota no cumple sus criterios
      if (mascotaSeleccionadaParaFiltro) {
        const tamanosAceptados = parseList(p.tamanosAceptados);
        const restriccionesRaza = parseList(p.restricciones);

        const tamanoMascota = (mascotaSeleccionadaParaFiltro.tamano || 'mediano').toLowerCase();
        const razaMascota = (mascotaSeleccionadaParaFiltro.raza || '').toLowerCase();

        if (tamanosAceptados.length > 0 && !tamanosAceptados.includes(tamanoMascota)) {
          return false;
        }

        if (restriccionesRaza.some((r) => razaMascota.includes(r.toLowerCase()))) {
          return false;
        }
      }

      return coincideServicio && coincideZona;
    });
  }, [prestadores, filtroServicio, filtroZona, mascotaFiltroId, mascotas]);

  const handleAbrirReserva = (prestador) => {
    setPrestadorElegido(prestador);
    const servs = parseList(prestador.servicios);
    setServicioSeleccionado(servs[0] || 'Paseo');
    setErrorReserva(null);
  };

  const handleCrearReserva = async (e) => {
    e.preventDefault();
    if (!prestadorElegido) return;
    setErrorReserva(null);

    const mascotaObj = mascotas.find((m) => String(m.id) === String(mascotaSeleccionadaId));
    if (!mascotaObj) {
      setErrorReserva('Seleccioná una mascota para el servicio.');
      return;
    }

    setSavingReserva(true);
    try {
      const payload = {
        prestadorId: prestadorElegido.id,
        tipo: servicioSeleccionado,
        mascotaId: Number(mascotaObj.id),
        mascota: mascotaObj.nombre,
        horaProgramada: fechaHora || new Date().toISOString(),
        origen: servicioSeleccionado === 'Traslado' ? origen : null,
        destino: servicioSeleccionado === 'Traslado' ? destino : null,
        motivoTraslado: servicioSeleccionado === 'Traslado' ? motivoTraslado : null,
        solicitarVuelta: servicioSeleccionado === 'Traslado' ? solicitarVuelta : false,
        horaRegreso: servicioSeleccionado === 'Traslado' && solicitarVuelta ? horaRegreso || null : null,
      };

      const res = await crearReserva(payload);
      setPrestadorElegido(null);
      onReservaCreada?.(res.servicio?.id || res.id);
    } catch (err) {
      setErrorReserva(err.message || 'Error al solicitar reserva');
    } finally {
      setSavingReserva(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-500 block mb-1">
          Directorio PAC-COP
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">Buscar Prestadores Calificados</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Encontrá paseadores, guarderías y traslados seguros para tu mascota en tu zona.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Tipo de servicio
          </label>
          <select
            value={filtroServicio}
            onChange={(e) => setFiltroServicio(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todos los servicios</option>
            <option value="paseo">Paseo de perros</option>
            <option value="guarderia">Guardería</option>
            <option value="traslado">Traslado con vehículo</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Zona o Barrio
          </label>
          <input
            type="text"
            placeholder="Ej: Palermo, Caballito, Belgrano..."
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Mascota a atender (filtro inteligente)
          </label>
          <select
            value={mascotaFiltroId}
            onChange={(e) => setMascotaFiltroId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Cualquier mascota</option>
            {mascotas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.tamano || 'mediano'} · {m.raza || 'mestizo'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Prestadores */}
      {loading ? (
        <p className="text-sm text-slate-400 text-center py-10">Buscando prestadores verificados...</p>
      ) : prestadoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-400 shadow-xs">
          <i className="bi bi-search text-3xl mb-2 block"></i>
          <p className="font-bold text-slate-700">No encontramos prestadores con esos filtros</p>
          <p className="text-xs text-slate-400 mt-1">
            Probá quitando el filtro de zona o seleccionando otro tipo de servicio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prestadoresFiltrados.map((p) => {
            const servs = parseList(p.servicios);
            const preciosMap = p.preciosServicios || {};
            const inicial = p.nombre ? p.nombre.charAt(0).toUpperCase() : 'P';

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
                      {inicial}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug">
                        {p.nombre} {p.apellido || ''}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="text-amber-500 font-bold flex items-center gap-0.5">
                          <span>{Number(p.calificacion || 4.5).toFixed(1)}</span>
                          <span className="text-sm">★</span>
                        </span>
                        <span>•</span>
                        <span>{p.zona || 'Zona a convenir'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 my-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Servicios y tarifas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {servs.length > 0 ? (
                        servs.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-semibold flex items-center gap-1"
                          >
                            <span>{s}:</span>
                            <strong className="text-emerald-700 font-mono">
                              ${preciosMap[s] ? Number(preciosMap[s]).toLocaleString('es-AR') : 'S/D'}
                            </strong>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">Sin servicios cargados</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleAbrirReserva(p)}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <i className="bi bi-calendar-plus"></i> Reservar Servicio
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Reserva con Traslado Ida y Vuelta */}
      {prestadorElegido && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                  Nueva solicitud
                </span>
                <h3 className="font-bold text-slate-800 text-lg">
                  Reservar con {prestadorElegido.nombre} {prestadorElegido.apellido}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrestadorElegido(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearReserva} className="space-y-3 text-xs sm:text-sm">
              {/* Servicio */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Servicio
                </label>
                <select
                  value={servicioSeleccionado}
                  onChange={(e) => setServicioSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {parseList(prestadorElegido.servicios).map((s) => (
                    <option key={s} value={s}>
                      {s} - $
                      {prestadorElegido.preciosServicios?.[s]
                        ? Number(prestadorElegido.preciosServicios[s]).toLocaleString('es-AR')
                        : 'Tarifa base'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mascota */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  ¿Para qué mascota?
                </label>
                <select
                  required
                  value={mascotaSeleccionadaId}
                  onChange={(e) => setMascotaSeleccionadaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {mascotas.length === 0 ? (
                    <option value="1">Mascota Principal</option>
                  ) : (
                    mascotas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} ({m.tipo || 'Perro'} - {m.raza || 'Mestizo'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Fecha y hora */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Fecha y horario programado
                </label>
                <input
                  type="datetime-local"
                  required
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Campos específicos de Traslado (Historia: Traslado ida y vuelta) */}
              {servicioSeleccionado === 'Traslado' && (
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-teal-900 block flex items-center gap-1">
                    <i className="bi bi-geo-alt-fill text-teal-700"></i> Detalle del traslado
                  </span>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Dirección de origen
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Av. Santa Fe 3400"
                      value={origen}
                      onChange={(e) => setOrigen(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Dirección de destino
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Clínica Veterinaria Palermo"
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Motivo del traslado
                    </label>
                    <select
                      value={motivoTraslado}
                      onChange={(e) => setMotivoTraslado(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      <option value="veterinaria">Turno veterinario</option>
                      <option value="peluqueria">Peluquería / Baño</option>
                      <option value="guarderia">Ingreso a guardería</option>
                      <option value="otro">Otro destino</option>
                    </select>
                  </div>

                  {/* Checkbox Viaje de Vuelta */}
                  <div className="pt-2 border-t border-teal-200/80">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-teal-950">
                      <input
                        type="checkbox"
                        checked={solicitarVuelta}
                        onChange={(e) => setSolicitarVuelta(e.target.checked)}
                        className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-500"
                      />
                      <span>Agregar viaje de regreso (ida y vuelta)</span>
                    </label>
                    <span className="text-[11px] text-slate-500 block mt-0.5 ml-6">
                      Se consolida en un único cobro unificado.
                    </span>

                    {solicitarVuelta && (
                      <div className="mt-2 ml-6">
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                          Hora estimada de regreso (opcional)
                        </label>
                        <input
                          type="time"
                          value={horaRegreso}
                          onChange={(e) => setHoraRegreso(e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Si no la sabés con exactitud, podés dejarla vacía para confirmar al terminar el turno.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {errorReserva && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {errorReserva}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setPrestadorElegido(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingReserva}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {savingReserva ? 'Solicitando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
