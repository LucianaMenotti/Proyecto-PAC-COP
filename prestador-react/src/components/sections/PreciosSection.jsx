import React, { useState, useMemo } from 'react';
import { updateMisServicios } from '../../api/prestador';

const PRECIOS_BASE = {
  Paseo: { nuevo: 4000, establecido: 5000, top: 7000 },
  Guarderia: { nuevo: 7000, establecido: 9000, top: 12000 },
  Traslado: { nuevo: 5000, establecido: 7000, top: 10000 },
};

const CAMPOS_POR_SERVICIO = {
  Paseo: { duracionLabel: 'Duración (minutos)', min: 15, step: 15, defaultValue: 30, hasMascotas: true },
  Guarderia: { duracionLabel: 'Horas de cuidado', min: 1, step: 1, defaultValue: 4, hasMascotas: true },
  Traslado: { duracionLabel: 'Distancia estimada (km)', min: 1, step: 1, defaultValue: 5, hasMascotas: false },
};

const EXTRAS = {
  Paseo: { baseCantidad: 30, bloque: 30, costoBloque: 1000, costoMascotaExtra: 2000 },
  Guarderia: { baseCantidad: 4, costoHoraExtra: 1000, costoMascotaExtra: 2000 },
  Traslado: { baseCantidad: 5, costoPorKm: 800 },
};

export default function PreciosSection({
  user,
  nivel = 'nuevo',
  servicios = [],
  precios = {},
  onServiciosUpdated,
}) {
  const [tipoServicio, setTipoServicio] = useState('Paseo');
  const [duracion, setDuracion] = useState(30);
  const [mascotas, setMascotas] = useState(1);
  const [precioInput, setPrecioInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mensajeOk, setMensajeOk] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const configCampo = CAMPOS_POR_SERVICIO[tipoServicio] || CAMPOS_POR_SERVICIO.Paseo;

  // Cálculo dinámico de precio sugerido según nivel y variables
  const sugerencia = useMemo(() => {
    const base = PRECIOS_BASE[tipoServicio]?.[nivel] || 4000;
    const extras = EXTRAS[tipoServicio];
    if (!extras) return { precio: base, detalle: '' };

    if (tipoServicio === 'Traslado') {
      const km = Math.max(0, Number(duracion) || 0);
      const costoKm = Math.max(0, km - extras.baseCantidad) * extras.costoPorKm;
      return {
        precio: base + costoKm,
        detalle: `${km} km (base incluye ${extras.baseCantidad} km)`,
      };
    }

    const cantMascotas = Math.max(1, Number(mascotas) || 1);
    const cantDuracion = Math.max(1, Number(duracion) || 1);

    if (tipoServicio === 'Guarderia') {
      const costoHoras = Math.max(0, cantDuracion - extras.baseCantidad) * extras.costoHoraExtra;
      const costoMascotas = Math.max(0, cantMascotas - 1) * extras.costoMascotaExtra;
      return {
        precio: base + costoHoras + costoMascotas,
        detalle: `${cantDuracion} h · ${cantMascotas} mascota${cantMascotas > 1 ? 's' : ''}`,
      };
    }

    // Paseo
    const bloques = Math.ceil(Math.max(0, cantDuracion - extras.baseCantidad) / extras.bloque);
    const costoMascotas = Math.max(0, cantMascotas - 1) * extras.costoMascotaExtra;
    return {
      precio: base + bloques * extras.costoBloque + costoMascotas,
      detalle: `${cantDuracion} min · ${cantMascotas} mascota${cantMascotas > 1 ? 's' : ''}`,
    };
  }, [tipoServicio, nivel, duracion, mascotas]);

  // Manejar cambio de tipo de servicio para resetear defaults limpios
  const handleCambioTipo = (e) => {
    const nuevoTipo = e.target.value;
    setTipoServicio(nuevoTipo);
    const conf = CAMPOS_POR_SERVICIO[nuevoTipo];
    if (conf) {
      setDuracion(conf.defaultValue);
    }
  };

  const handleUsarSugerencia = () => {
    setPrecioInput(String(sugerencia.precio));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeOk(null);
    setErrorMsg(null);

    const precioNum = Number(precioInput);
    if (!precioNum || precioNum <= 0) {
      setErrorMsg('Por favor ingresá un precio válido mayor a 0.');
      return;
    }

    setSubmitting(true);
    try {
      const nuevosServicios = Array.from(new Set([...servicios, tipoServicio]));
      const nuevosPrecios = { ...precios, [tipoServicio]: precioNum };

      await updateMisServicios(nuevosServicios, nuevosPrecios);
      setMensajeOk(`¡Servicio "${tipoServicio}" publicado con éxito!`);
      onServiciosUpdated(nuevosServicios, nuevosPrecios);
      setPrecioInput('');
    } catch (err) {
      setErrorMsg(err.message || 'Error al publicar el servicio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminarServicio = async (servicioAEliminar) => {
    if (!window.confirm(`¿Querés eliminar el servicio de ${servicioAEliminar}?`)) return;

    try {
      const nuevosServicios = servicios.filter((s) => s !== servicioAEliminar);
      const nuevosPrecios = { ...precios };
      delete nuevosPrecios[servicioAEliminar];

      await updateMisServicios(nuevosServicios, nuevosPrecios);
      onServiciosUpdated(nuevosServicios, nuevosPrecios);
    } catch (err) {
      alert(err.message || 'Error al eliminar el servicio');
    }
  };

  // Nivel progress
  const serviciosCompletados = Number(user?.serviciosCompletados || 0);
  const porcentajeNivel = Math.min(100, Math.round((serviciosCompletados / 50) * 100));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
          Tarifas y catálogo
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">Definí tu precio libremente</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Según tus servicios completados y tu calificación te sugerimos un rango de precio.
          Es solo una referencia: vos decidís cuánto cobrar.
        </p>
      </div>

      {/* Tarjeta de Progreso de Nivel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Progreso de prestador
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            {serviciosCompletados} servicios completados
          </span>
        </div>

        {/* Barra */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 mb-4">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(8, porcentajeNivel)}%` }}
          ></div>
        </div>

        {/* Hitos */}
        <div className="grid grid-cols-3 text-center gap-2 text-xs">
          <div className={`p-2 rounded-xl transition ${nivel === 'nuevo' ? 'bg-teal-50 border border-teal-200 font-bold text-teal-900' : 'text-slate-500'}`}>
            <span className="block text-sm">🌱 Nuevo</span>
            <span className="text-[11px] text-slate-400">0–9 servicios</span>
          </div>
          <div className={`p-2 rounded-xl transition ${nivel === 'establecido' ? 'bg-teal-50 border border-teal-200 font-bold text-teal-900' : 'text-slate-500'}`}>
            <span className="block text-sm">⭐ Establecido</span>
            <span className="text-[11px] text-slate-400">10–49 · +4.0★</span>
          </div>
          <div className={`p-2 rounded-xl transition ${nivel === 'top' ? 'bg-amber-50 border border-amber-200 font-bold text-amber-900' : 'text-slate-500'}`}>
            <span className="block text-sm">🏆 Top</span>
            <span className="text-[11px] text-slate-400">50+ · +4.5★</span>
          </div>
        </div>
      </div>

      {/* Tabla de Precios Sugeridos por Nivel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <i className="bi bi-table text-teal-600"></i> Precios sugeridos de base
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Servicio</th>
                <th className="py-2.5 px-4">Nuevo</th>
                <th className="py-2.5 px-4">Establecido</th>
                <th className="py-2.5 px-4">Top</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(PRECIOS_BASE).map(([serv, valores]) => (
                <tr key={serv} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-800">{serv}</td>
                  <td className="py-3 px-4 text-slate-600">${valores.nuevo.toLocaleString('es-AR')}</td>
                  <td className="py-3 px-4 text-slate-600">${valores.establecido.toLocaleString('es-AR')}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium text-emerald-700">
                    ${valores.top.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulario y Tarjeta de Sugerencia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Publicar o actualizar servicio</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Tipo de servicio
              </label>
              <select
                value={tipoServicio}
                onChange={handleCambioTipo}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Paseo">Paseo de mascotas</option>
                <option value="Guarderia">Guardería de día / noche</option>
                <option value="Traslado">Traslado en vehículo</option>
              </select>
            </div>

            {/* Duración / Horas / Km */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {configCampo.duracionLabel}
              </label>
              <input
                type="number"
                min={configCampo.min}
                step={configCampo.step}
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Cantidad de mascotas si aplica */}
            {configCampo.hasMascotas && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Cantidad de mascotas
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={mascotas}
                  onChange={(e) => setMascotas(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {/* Precio Final a cobrar */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Tu precio a publicar ($ ARS)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  placeholder={`Ej: ${sugerencia.precio}`}
                  value={precioInput}
                  onChange={(e) => setPrecioInput(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {mensajeOk && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
                {mensajeOk}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow transition active:scale-[0.99] disabled:opacity-50 text-sm"
            >
              {submitting ? 'Publicando...' : 'Publicar / Actualizar Servicio'}
            </button>
          </form>
        </div>

        {/* Tarjeta de Sugerencia Calculada */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-50 via-emerald-50/50 to-white rounded-2xl p-6 border border-teal-200/80 shadow-xs space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Sugerencia inteligente
            </span>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5">Precio recomendado</h4>
            <p className="text-xs text-slate-500 mt-1">
              Calculado para tu nivel <span className="font-bold text-teal-800">{nivel.toUpperCase()}</span> según los parámetros seleccionados.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-teal-100 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs text-slate-400 block">Sugerido para tu caso:</span>
              <span className="text-3xl font-extrabold text-teal-800 font-mono">
                ${sugerencia.precio.toLocaleString('es-AR')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleUsarSugerencia}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs"
            >
              Usar precio
            </button>
          </div>

          <p className="text-xs text-slate-500 italic">
            Detalle del cálculo: {sugerencia.detalle}
          </p>
        </div>
      </div>

      {/* Mis Servicios Publicados */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Mis servicios publicados</h3>
        <p className="text-xs text-slate-500 mb-4">
          Estos son los servicios que ofrecés actualmente en la plataforma.
        </p>

        {servicios.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <i className="bi bi-tag text-3xl mb-2 block"></i>
            <p className="text-sm font-semibold">Todavía no tenés servicios publicados</p>
            <p className="text-xs text-slate-400 mt-1">Usá el formulario superior para crear tu primer servicio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {servicios.map((serv) => (
              <div
                key={serv}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{serv}</h4>
                  <span className="text-teal-700 font-extrabold font-mono text-base">
                    ${precios[serv] ? Number(precios[serv]).toLocaleString('es-AR') : 'Sin precio'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleEliminarServicio(serv)}
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition"
                  title="Eliminar servicio"
                >
                  <i className="bi bi-trash3 text-base"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
