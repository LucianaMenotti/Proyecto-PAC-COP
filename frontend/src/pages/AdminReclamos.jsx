import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ModalMotivo from "../components/admin/ModalMotivo";
import { apiDatos, enviarDatos } from "../config/api";
import { RUTAS } from "../config/rutas";
import { ESTADOS_SERVICIO, formatearMonto } from "../helpers/admin";
import { formatearFechaHora, obtenerEstadoReclamo } from "../helpers/reclamos";
import { useEventoTiempoReal } from "../hooks/useTiempoReal";

const INTERVALO_ACTUALIZACION = 20000;

const DESTINATARIOS = {
  ambas: "Ambas partes",
  reclamante: "Solo quien reclamó",
  reclamado: "Solo la parte reclamada"
};

function Parte({ titulo, persona }) {
  if (!persona) {
    return null;
  }

  return (
    <div className="col-sm-6">
      <p className="small text-secondary mb-1">{titulo}</p>
      <p className="mb-1">
        <Link to={`${RUTAS.adminLegajo}/${persona.id}`} className="fw-semibold text-decoration-none">
          {persona.nombre}
        </Link>{" "}
        <span className="text-secondary small">({persona.rol})</span>
        {persona.suspendido && <span className="badge text-bg-danger ms-1">Suspendido</span>}
      </p>
      {persona.email && (
        <p className="small mb-0">
          <a href={`mailto:${persona.email}`}>{persona.email}</a>
          {persona.telefono && (
            <>
              {" · "}
              <a href={`tel:${persona.telefono}`}>{persona.telefono}</a>
            </>
          )}
        </p>
      )}
    </div>
  );
}

// Sección "Reclamos" del panel de administración (/admin/reclamos).
// Historia "Reclamo de servicio": la administración revisa el caso, contacta a las partes
// (notificación y correo), lee el chat del servicio y lo cierra con una resolución.
export default function AdminReclamos({ alAvisar, alCambiar }) {
  const [reclamos, setReclamos] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [destinatario, setDestinatario] = useState("ambas");

  const cargar = useCallback(async () => {
    try {
      const datos = await apiDatos("/api/reclamos", {}, "No se pudieron cargar los reclamos");

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

  // Un reclamo nuevo llega como notificación en tiempo real
  useEventoTiempoReal("notificacion", (datos) => {
    if (String(datos?.tipo || "").startsWith("reclamo")) {
      cargar();
    }
  });

  const cambiarEstado = async (reclamo, estado, resolucion = "") => {
    await enviarDatos(`/api/reclamos/${reclamo.id}/estado`, "PATCH", { estado, resolucion });
    alAvisar?.(estado === "finalizado" ? "Reclamo finalizado y partes notificadas" : "Reclamo en revisión");
    setModal(null);
    await cargar();
    alCambiar?.();
  };

  const marcarEnRevision = async (reclamo) => {
    if (!window.confirm(`¿Pasar el reclamo #${reclamo.id} a "En revisión"?`)) {
      return;
    }

    try {
      await cambiarEstado(reclamo, "en-revision");
    } catch (fallo) {
      alAvisar?.(fallo.message, "danger");
    }
  };

  const contactar = async (mensaje) => {
    const respuesta = await enviarDatos(`/api/reclamos/${modal.reclamo.id}/contactar`, "POST", {
      destinatario,
      mensaje
    });

    alAvisar?.(respuesta.mensaje, respuesta.correos?.includes("error") ? "warning" : "success");
    setModal(null);
  };

  const visibles = (reclamos || []).filter((reclamo) => filtro === "" || reclamo.estado === filtro);

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-end align-items-center gap-2 mb-4">
        <select className="form-select w-auto" value={filtro} onChange={(evento) => setFiltro(evento.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en-revision">En revisión</option>
          <option value="finalizado">Finalizado</option>
        </select>

        <button type="button" className="btn btn-outline-primary" onClick={cargar}>
          Actualizar
        </button>
      </div>

      {reclamos === null && <div className="text-center text-secondary">Cargando reclamos...</div>}

      {reclamos !== null && visibles.length === 0 && !error && (
        <div className="alert alert-info">No hay reclamos para mostrar.</div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        {visibles.map((reclamo) => {
          const estado = obtenerEstadoReclamo(reclamo.estado);
          const servicio = reclamo.servicio;
          const estadoServicio = ESTADOS_SERVICIO[servicio?.estado];

          return (
            <div className="col-12 col-xl-6" key={reclamo.id}>
              <div className="card h-100 shadow-sm border-0 rounded-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h2 className="h5 fw-bold mb-0">{`Reclamo #${reclamo.id}`}</h2>
                    <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                  </div>

                  <p className="text-secondary small mb-3">
                    {`Servicio #${reclamo.servicioId}`}
                    {servicio ? ` · ${servicio.tipo} · ${servicio.mascota} · ${formatearMonto(servicio.monto)}` : ""}
                    {estadoServicio && <span className={`badge ${estadoServicio.clase} ms-2`}>{estadoServicio.texto}</span>}
                    <br />
                    Abierto el {formatearFechaHora(reclamo.creadoEn)}
                  </p>

                  <div className="row g-3 mb-3">
                    <Parte titulo="Reclamante" persona={reclamo.reclamante} />
                    <Parte titulo="Reclamado" persona={reclamo.reclamado} />
                  </div>

                  <p className="fw-semibold mb-1">Descripción</p>
                  <p className="mb-3" style={{ whiteSpace: "pre-wrap" }}>
                    {reclamo.descripcion}
                  </p>

                  <p className="fw-semibold mb-1">Evidencias</p>
                  <div className="mb-3">
                    {reclamo.evidencias.length === 0 ? (
                      <p className="text-secondary small mb-0">Sin evidencias adjuntas.</p>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {reclamo.evidencias.map((ruta) => (
                          <a key={ruta} href={ruta} target="_blank" rel="noopener noreferrer">
                            <img
                              src={ruta}
                              alt="Evidencia del reclamo"
                              className="rounded border"
                              style={{ width: "96px", height: "96px", objectFit: "cover" }}
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {reclamo.resolucion && (
                    <div className="alert alert-success small py-2">
                      <strong>Resolución:</strong> {reclamo.resolucion}
                    </div>
                  )}

                  <div className="d-flex flex-wrap gap-2">
                    {reclamo.estado === "pendiente" && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => marcarEnRevision(reclamo)}>
                        Marcar en revisión
                      </button>
                    )}
                    {reclamo.estado !== "finalizado" && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => setModal({ tipo: "finalizar", reclamo })}
                      >
                        Finalizar con resolución
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        setDestinatario("ambas");
                        setModal({ tipo: "contactar", reclamo });
                      }}
                    >
                      <i className="bi bi-envelope me-1"></i>Contactar
                    </button>
                    <Link to={`${RUTAS.chat}?servicioId=${reclamo.servicioId}`} className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-chat-dots me-1"></i>Ver chat del servicio
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal?.tipo === "finalizar" && (
        <ModalMotivo
          titulo={`Finalizar el reclamo #${modal.reclamo.id}`}
          descripcion="La resolución se envía a las dos partes y queda visible en el reclamo."
          etiqueta="Resolución"
          minimo={5}
          maximo={1000}
          textoConfirmar="Finalizar"
          claseConfirmar="btn-success"
          alCerrar={() => setModal(null)}
          alConfirmar={(resolucion) => cambiarEstado(modal.reclamo, "finalizado", resolucion)}
        />
      )}

      {modal?.tipo === "contactar" && (
        <ModalMotivo
          titulo={`Contactar por el reclamo #${modal.reclamo.id}`}
          descripcion="Se envía como notificación en la aplicación y por correo electrónico."
          etiqueta="Mensaje"
          minimo={5}
          maximo={1000}
          textoConfirmar="Enviar"
          claseConfirmar="btn-primary"
          alCerrar={() => setModal(null)}
          alConfirmar={contactar}
        >
          <label className="form-label small mt-3" htmlFor="destinatario-reclamo">
            Destinatario
          </label>
          <select
            id="destinatario-reclamo"
            className="form-select form-select-sm"
            value={destinatario}
            onChange={(evento) => setDestinatario(evento.target.value)}
          >
            {Object.entries(DESTINATARIOS).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </ModalMotivo>
      )}
    </section>
  );
}
