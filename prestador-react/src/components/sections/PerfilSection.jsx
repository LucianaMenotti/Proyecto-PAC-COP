import React from 'react';
import { updateMisServicios } from '../../api/prestador';

const NOMBRES_SERVICIO = {
  Paseo: 'Paseo de mascotas',
  Guarderia: 'Guardería',
  Traslado: 'Traslado',
};

const DIAS_PERFIL = [
  ['lunes', 'Lunes'],
  ['martes', 'Martes'],
  ['miercoles', 'Miércoles'],
  ['jueves', 'Jueves'],
  ['viernes', 'Viernes'],
  ['sabado', 'Sábado'],
  ['domingo', 'Domingo'],
];

export default function PerfilSection({
  user,
  servicios = [],
  precios = {},
  onSelectSection,
  onServiciosUpdated,
}) {
  const nombreCompleto = `${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Prestador de Servicios';
  const inicial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'P';
  const calificacion = Number(user?.calificacion || 4.6);
  const totalResenas = Number(user?.resenas || 0);

  const handleEliminarServicio = async (servicio) => {
    if (!window.confirm(`¿Seguro que deseás eliminar el servicio "${servicio}" de tu perfil?`)) {
      return;
    }
    try {
      const nuevosServicios = servicios.filter((s) => s !== servicio);
      const nuevosPrecios = { ...precios };
      delete nuevosPrecios[servicio];

      await updateMisServicios(nuevosServicios, nuevosPrecios);
      onServiciosUpdated(nuevosServicios, nuevosPrecios);
    } catch (err) {
      alert(err.message || 'Error al eliminar servicio');
    }
  };

  // Disponibilidad parse
  const disponibilidad = user?.disponibilidad || {};
  const diasActivos = DIAS_PERFIL.filter(([clave]) => disponibilidad[clave]?.activo);

  // Politicas parse
  const parseList = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) {
      try {
        const p = JSON.parse(val);
        return Array.isArray(p) ? p : [p];
      } catch {
        return val.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const tamanos = parseList(user?.tamanosAceptados);
  const razas = parseList(user?.restricciones);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Profile Hero Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-4xl shadow-md shrink-0">
            {inicial}
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-serif">
                {nombreCompleto}
              </h1>
              {user?.verificado ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <i className="bi bi-patch-check-fill"></i> Identidad verificada
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Identidad no verificada
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-600 mt-2">
              <span className="flex items-center gap-1">
                <strong className="text-amber-500 font-bold">{calificacion.toFixed(1)} ★</strong>
                <span className="text-slate-400">({totalResenas} reseñas)</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <i className="bi bi-geo-alt-fill text-teal-600"></i>
                <span>{user?.zona || 'Zona no especificada'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Servicios y Mi Cuenta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis Servicios */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-tag text-teal-600"></i> Mis servicios ofrecidos
            </h3>
            <button
              type="button"
              onClick={() => onSelectSection('precios')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 transition"
            >
              Agregar / Cambiar precios
            </button>
          </div>

          {servicios.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">
              Todavía no ofrecés ningún servicio. Agregalos desde la sección de precios.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {servicios.map((s) => (
                <div key={s} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <h4 className="font-bold text-slate-800">{NOMBRES_SERVICIO[s] || s}</h4>
                    <span className="text-xs text-teal-700 font-extrabold font-mono">
                      ${precios[s] ? Number(precios[s]).toLocaleString('es-AR') : 'Sin precio'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminarServicio(s)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Datos de Contacto y Cuenta */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-person-lines-fill text-teal-600"></i> Datos de contacto
          </h3>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block">Correo electrónico</span>
              <span className="font-semibold text-slate-700">{user?.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Teléfono / WhatsApp</span>
              <span className="font-semibold text-slate-700">{user?.telefono || 'No especificado'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Vehículo registrado</span>
              <span className="font-semibold text-slate-700">{user?.vehiculo || 'Sin vehículo'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Disponibilidad y Políticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disponibilidad Semanal */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-calendar-week text-teal-600"></i> Disponibilidad semanal
            </h3>
            <button
              type="button"
              onClick={() => onSelectSection('trabajo')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              Editar
            </button>
          </div>

          {diasActivos.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Sin días restringidos: aceptás reservas cualquier día.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {diasActivos.map(([clave, etiqueta]) => (
                <div key={clave} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex justify-between">
                  <span className="font-semibold text-slate-700">{etiqueta}</span>
                  <span className="font-mono text-teal-800 font-medium">
                    {disponibilidad[clave].desde} - {disponibilidad[clave].hasta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Políticas de Mascotas */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-shield-check text-teal-600"></i> Políticas de mascotas
            </h3>
            <button
              type="button"
              onClick={() => onSelectSection('trabajo')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              Editar
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Tamaños que aceptás:</span>
              <div className="flex flex-wrap gap-1.5">
                {tamanos.length > 0 ? (
                  tamanos.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 font-semibold">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 font-medium">Cualquier tamaño</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Razas excluidas:</span>
              <div className="flex flex-wrap gap-1.5">
                {razas.length > 0 ? (
                  razas.map((r) => (
                    <span key={r} className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 font-medium">Aceptás todas las razas</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
