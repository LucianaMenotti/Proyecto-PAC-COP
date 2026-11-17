import { useState } from "react";
import { enviarDatos } from "../../config/api";
import { leerLista } from "../../helpers/listas";
import EncabezadoSeccion from "./EncabezadoSeccion";

const DIAS = [
  { clave: "lunes", etiqueta: "Lunes" },
  { clave: "martes", etiqueta: "Martes" },
  { clave: "miercoles", etiqueta: "Miércoles" },
  { clave: "jueves", etiqueta: "Jueves" },
  { clave: "viernes", etiqueta: "Viernes" },
  { clave: "sabado", etiqueta: "Sábado" },
  { clave: "domingo", etiqueta: "Domingo" }
];

const TAMANOS = ["pequeño", "mediano", "grande"];

const leerDisponibilidad = (valor) => {
  const origen = valor && typeof valor === "object" ? valor : {};

  return Object.fromEntries(
    DIAS.map(({ clave }) => [clave, origen[clave] || { activo: false, desde: "09:00", hasta: "18:00" }])
  );
};

// Acepta array o texto "pitbull, rottweiler" (formatos viejos en la base)
const leerRestricciones = (valor) => {
  if (Array.isArray(valor)) {
    return valor.join(", ");
  }

  if (typeof valor === "string") {
    const lista = leerLista(valor);

    return lista.length > 0 ? lista.join(", ") : valor.startsWith("[") ? "" : valor;
  }

  return "";
};

const leerTamanos = (valor) => {
  if (Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    const lista = leerLista(valor);

    return lista.length > 0
      ? lista
      : valor
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean);
  }

  return [...TAMANOS];
};

export default function SeccionTrabajo({ usuario, alActualizar }) {
  const [disponibilidad, setDisponibilidad] = useState(() => leerDisponibilidad(usuario.disponibilidad));
  const [tamanosAceptados, setTamanosAceptados] = useState(() => leerTamanos(usuario.tamanosAceptados));
  const [razasExcluidas, setRazasExcluidas] = useState(() => leerRestricciones(usuario.restricciones));
  const [guardandoDisponibilidad, setGuardandoDisponibilidad] = useState(false);
  const [guardandoRestricciones, setGuardandoRestricciones] = useState(false);
  const [mensajeDisponibilidad, setMensajeDisponibilidad] = useState(null);
  const [mensajeRestricciones, setMensajeRestricciones] = useState(null);

  const alternarDia = (clave) => {
    setDisponibilidad((anterior) => ({
      ...anterior,
      [clave]: { ...anterior[clave], activo: !anterior[clave].activo }
    }));
  };

  const cambiarHora = (clave, campo, valor) => {
    setDisponibilidad((anterior) => ({
      ...anterior,
      [clave]: { ...anterior[clave], [campo]: valor }
    }));
  };

  const guardarDisponibilidad = async () => {
    setGuardandoDisponibilidad(true);
    setMensajeDisponibilidad(null);

    try {
      await enviarDatos("/api/users/me/disponibilidad", "PUT", { disponibilidad }, "Error al guardar disponibilidad");
      setMensajeDisponibilidad("Disponibilidad guardada correctamente.");
      await alActualizar();
    } catch (error) {
      alert(error.message || "Error al guardar disponibilidad");
    } finally {
      setGuardandoDisponibilidad(false);
    }
  };

  const alternarTamano = (tamano) => {
    setTamanosAceptados((anterior) =>
      anterior.includes(tamano) ? anterior.filter((item) => item !== tamano) : [...anterior, tamano]
    );
  };

  const guardarRestricciones = async () => {
    setGuardandoRestricciones(true);
    setMensajeRestricciones(null);

    try {
      const razas = razasExcluidas
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      await enviarDatos("/api/users/me/restricciones", "PUT", {
        tamanosAceptados,
        restricciones: razas
      }, "Error al guardar restricciones");

      setMensajeRestricciones("Políticas y restricciones guardadas.");
      await alActualizar();
    } catch (error) {
      alert(error.message || "Error al guardar restricciones");
    } finally {
      setGuardandoRestricciones(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <EncabezadoSeccion
        etiqueta="Agenda y preferencias"
        titulo="Tu disponibilidad y políticas"
        descripcion="Organizá los días y horarios en los que podés recibir solicitudes y definí qué tipo de mascotas aceptás."
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Días y horarios semanales</h3>
          <p className="text-xs text-slate-500">
            Si no marcás días específicos, se asume disponibilidad completa.
          </p>
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
                    onChange={() => alternarDia(clave)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <span
                    className={`text-sm ${regla.activo ? "font-bold text-slate-800" : "text-slate-400"}`}
                  >
                    {etiqueta}
                  </span>
                </label>

                <div
                  className={`flex items-center gap-3 text-xs sm:w-2/3 ${
                    !regla.activo ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-slate-400 font-medium">Desde:</span>
                    <input
                      type="time"
                      value={regla.desde}
                      onChange={(evento) => cambiarHora(clave, "desde", evento.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-slate-400 font-medium">Hasta:</span>
                    <input
                      type="time"
                      value={regla.hasta}
                      onChange={(evento) => cambiarHora(clave, "hasta", evento.target.value)}
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
            disabled={guardandoDisponibilidad}
            onClick={guardarDisponibilidad}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {guardandoDisponibilidad ? "Guardando..." : "Guardar disponibilidad"}
          </button>
          {mensajeDisponibilidad && (
            <span className="text-xs font-semibold text-emerald-600">{mensajeDisponibilidad}</span>
          )}
        </div>
      </div>

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
            {TAMANOS.map((tamano) => {
              const elegido = tamanosAceptados.includes(tamano);

              return (
                <button
                  key={tamano}
                  type="button"
                  onClick={() => alternarTamano(tamano)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    elegido
                      ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <i className={`bi ${elegido ? "bi-check-lg" : "bi-plus"}`}></i>
                  {tamano.charAt(0).toUpperCase() + tamano.slice(1)}
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
            onChange={(evento) => setRazasExcluidas(evento.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Ingresá los nombres separados por comas.
          </span>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            disabled={guardandoRestricciones}
            onClick={guardarRestricciones}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {guardandoRestricciones ? "Guardando..." : "Guardar restricciones"}
          </button>
          {mensajeRestricciones && (
            <span className="text-xs font-semibold text-emerald-600">{mensajeRestricciones}</span>
          )}
        </div>
      </div>
    </div>
  );
}
