import React, { useState } from 'react';
import { updateDisponibilidad, updateRestricciones } from '../../api/prestador';

const DIAS = [
  { clave: 'lunes', etiqueta: 'Lunes' },
  { clave: 'martes', etiqueta: 'Martes' },
  { clave: 'miercoles', etiqueta: 'Miércoles' },
  { clave: 'jueves', etiqueta: 'Jueves' },
  { clave: 'viernes', etiqueta: 'Viernes' },
  { clave: 'sabado', etiqueta: 'Sábado' },
  { clave: 'domingo', etiqueta: 'Domingo' },
];

const TAMANOS = ['pequeño', 'mediano', 'grande'];

export default function MiTrabajoSection({ user, onUserDataUpdated }) {
  // Disponibilidad state
  const [disponibilidad, setDisponibilidad] = useState(() => {
    const d = user?.disponibilidad || {};
    const init = {};
    DIAS.forEach(({ clave }) => {
      init[clave] = d[clave] || { activo: false, desde: '09:00', hasta: '18:00' };
    });
    return init;
  });

  // Restricciones state
  const [tamanosAceptados, setTamanosAceptados] = useState(() => {
    const raw = user?.tamanosAceptados;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      }
    }
    return ['pequeño', 'mediano', 'grande'];
  });

  const [razasExcluidas, setRazasExcluidas] = useState(() => {
    const raw = user?.restricciones;
    if (Array.isArray(raw)) return raw.join(', ');
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.join(', ') : raw;
      } catch {
        return raw;
      }
    }
    return '';
  });

  const [savingDisp, setSavingDisp] = useState(false);
  const [dispMsg, setDispMsg] = useState(null);

  const [savingRest, setSavingRest] = useState(false);
  const [restMsg, setRestMsg] = useState(null);

  const handleToggleDia = (clave) => {
    setDisponibilidad((prev) => ({
      ...prev,
      [clave]: { ...prev[clave], activo: !prev[clave].activo },
    }));
  };

  const handleTimeChange = (clave, field, value) => {
    setDisponibilidad((prev) => ({
      ...prev,
      [clave]: { ...prev[clave], [field]: value },
    }));
  };

  const handleGuardarDisponibilidad = async () => {
    setSavingDisp(true);
    setDispMsg(null);
    try {
      await updateDisponibilidad(disponibilidad);
      setDispMsg('Disponibilidad guardada correctamente.');
      onUserDataUpdated?.({ ...user, disponibilidad });
    } catch (err) {
      alert(err.message || 'Error al guardar disponibilidad');
    } finally {
      setSavingDisp(false);
    }
  };

  const handleToggleTamano = (tam) => {
    setTamanosAceptados((prev) =>
      prev.includes(tam) ? prev.filter((t) => t !== tam) : [...prev, tam]
    );
  };

  const handleGuardarRestricciones = async () => {
    setSavingRest(true);
    setRestMsg(null);
    try {
      const arrayRazas = razasExcluidas
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      await updateRestricciones(tamanosAceptados, arrayRazas);
      setRestMsg('Políticas y restricciones guardadas.');
      onUserDataUpdated?.({
        ...user,
        tamanosAceptados,
        restricciones: arrayRazas,
      });
    } catch (err) {
      alert(err.message || 'Error al guardar restricciones');
    } finally {
      setSavingRest(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
          Agenda y preferencias
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">Tu disponibilidad y políticas</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Organizá los días y horarios en los que podés recibir solicitudes y definí qué tipo de mascotas aceptás.
        </p>
      </div>

      {/* Disponibilidad Semanal */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-800">Días y horarios semanales</h3>
            <p className="text-xs text-slate-500">
              Si no marcas días específicos, se asume disponibilidad completa.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {DIAS.map(({ clave, etiqueta }) => {
            const regla = disponibilidad[clave];
            return (
              <div
                key={clave}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <label className="flex items-center gap-3 cursor-pointer sm:w-1/3">
                  <input
                    type="checkbox"
                    checked={regla.activo}
                    onChange={() => handleToggleDia(clave)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <span
                    className={`text-sm ${
                      regla.activo ? 'font-bold text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {etiqueta}
                  </span>
                </label>

                <div
                  className={`flex items-center gap-3 text-xs sm:w-2/3 ${
                    !regla.activo ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-slate-400 font-medium">Desde:</span>
                    <input
                      type="time"
                      value={regla.desde}
                      onChange={(e) => handleTimeChange(clave, 'desde', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-slate-400 font-medium">Hasta:</span>
                    <input
                      type="time"
                      value={regla.hasta}
                      onChange={(e) => handleTimeChange(clave, 'hasta', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 flex items-center gap-3">
          <button
            type="button"
            disabled={savingDisp}
            onClick={handleGuardarDisponibilidad}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {savingDisp ? 'Guardando...' : 'Guardar disponibilidad'}
          </button>
          {dispMsg && (
            <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
              {dispMsg}
            </span>
          )}
        </div>
      </div>

      {/* Qué mascotas aceptás */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Tamaños y razas de mascotas</h3>
          <p className="text-xs text-slate-500">
            Filtrá las reservas que mejor se adapten a tu experiencia y espacio.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Tamaños aceptados
          </label>
          <div className="flex flex-wrap gap-2">
            {TAMANOS.map((tam) => {
              const isSelected = tamanosAceptados.includes(tam);
              return (
                <button
                  key={tam}
                  type="button"
                  onClick={() => handleToggleTamano(tam)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <i className={`bi ${isSelected ? 'bi-check-lg' : 'bi-plus'}`}></i>
                  {tam.charAt(0).toUpperCase() + tam.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Razas que NO aceptás (excluidas)
          </label>
          <input
            type="text"
            placeholder="Ej: pitbull, rottweiler, fila brasilero"
            value={razasExcluidas}
            onChange={(e) => setRazasExcluidas(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Ingresá los nombres separados por comas.
          </span>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            disabled={savingRest}
            onClick={handleGuardarRestricciones}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {savingRest ? 'Guardando...' : 'Guardar restricciones'}
          </button>
          {restMsg && (
            <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
              {restMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
