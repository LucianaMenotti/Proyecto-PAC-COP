import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../../config/api";
import { formatearFechaHora, obtenerEstadoReclamo } from "../../helpers/reclamos";
import { useEventoTiempoReal } from "../../hooks/useTiempoReal";
import EncabezadoSeccion from "./EncabezadoSeccion";
import ModalReclamoPanel from "./ModalReclamoPanel";

const CLASES_ESTADO = {
  pendiente: "bg-amber-100 text-amber-900 border-amber-200",
  "en-revision": "bg-sky-100 text-sky-900 border-sky-200",
  finalizado: "bg-emerald-100 text-emerald-900 border-emerald-200"
};

const INTERVALO_ACTUALIZACION = 20000;

// Reclamos de servicios (los emitidos por el prestador y los que recibió).
export default function SeccionReclamos({ servicios }) {
  const [reclamos, setReclamos] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [servicioReclamado, setServicioReclamado] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson("/api/reclamos");

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudieron cargar los reclamos");
      }

      setReclamos(datos.reclamos || []);
      setError("");
    } catch (fallo) {
      setError(fallo.message);
      setReclamos((anterior) => anterior ?? []);
    }
  }, []);

  useEffect(() => {
    cargar();

    const temporizador = setInterval(cargar, INTERVALO_ACTUALIZACION);

    return () => clearInterval(temporizador);
  }, [cargar]);

  useEventoTiempoReal("notificacion", cargar);

  const lista = reclamos || [];
  const emitidos = lista.filter((reclamo) => reclamo.soyReclamante);
  const recibidos = lista.filter((reclamo) => !reclamo.soyReclamante);

  // Un servicio finalizado se puede reclamar una sola vez por quien lo reclama
  const reclamables = (servicios || []).filter(
    (servicio) =>
      servicio.estado === "finalizado" &&
      !emitidos.some((reclamo) => Number(reclamo.servicioId) === Number(servicio.id))
  );

  const enviado = async () => {
    setServicioReclamado(null);
    setExito("Reclamo enviado. Podés seguir su estado en esta sección.");
    await cargar();
  };

  const tarjeta = (reclamo) => {
    const estado = obtenerEstadoReclamo(reclamo.estado);

    return (
      <article
        key={reclamo.id}
        className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3"
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              {reclamo.servicio
                ? `${reclamo.servicio.tipo} · ${reclamo.servicio.mascota}`
                : `Servicio #${reclamo.servicioId}`}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Reclamo #{reclamo.id} · {formatearFechaHora(reclamo.creadoEn)}
            </p>
          </div>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              CLASES_ESTADO[reclamo.estado] || "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {estado.texto}
          </span>
        </div>

        <p className="text-xs text-slate-600 whitespace-pre-wrap">{reclamo.descripcion}</p>

        {reclamo.evidencias.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reclamo.evidencias.map((ruta) => (
              <a key={ruta} href={ruta} target="_blank" rel="noopener noreferrer">
                <img
                  src={ruta}
                  alt="Evidencia del reclamo"
                  className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                />
              </a>
            ))}
          </div>
        )}

        <p className="text-[11px] text-slate-400">
          {reclamo.soyReclamante
            ? `Contra: ${reclamo.reclamado?.nombre || "—"}`
            : `Reclamado por: ${reclamo.reclamante?.nombre || "—"}`}
        </p>
      </article>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <EncabezadoSeccion
        etiqueta="Resolución de conflictos"
        titulo="Reclamos de servicios"
        descripcion="Abrí un reclamo sobre un servicio finalizado o seguí el estado de los que ya presentaste o recibiste. El equipo de administración los revisa."
      />

      {exito && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          {exito}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <i className="bi bi-flag text-rose-500"></i> Servicios que podés reclamar
        </h3>

        {servicios !== null && reclamables.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            No tenés servicios finalizados pendientes de reclamo.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reclamables.map((servicio) => (
              <div
                key={servicio.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex justify-between items-center gap-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {servicio.tipo} · {servicio.mascota}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">Reserva #{servicio.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setServicioReclamado(servicio)}
                  className="text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs py-2 px-3 rounded-xl transition"
                >
                  Reclamar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800">Reclamos que presenté ({emitidos.length})</h3>

        {reclamos === null ? (
          <p className="text-sm text-slate-400">Cargando reclamos...</p>
        ) : emitidos.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Todavía no presentaste reclamos.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{emitidos.map(tarjeta)}</div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800">Reclamos recibidos ({recibidos.length})</h3>

        {recibidos.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No recibiste reclamos.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{recibidos.map(tarjeta)}</div>
        )}
      </div>

      {servicioReclamado && (
        <ModalReclamoPanel
          servicio={servicioReclamado}
          alCerrar={() => setServicioReclamado(null)}
          alEnviado={enviado}
        />
      )}
    </div>
  );
}
