import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ContadorNotificaciones from "../components/ContadorNotificaciones";
import ModalReclamo from "../components/reclamos/ModalReclamo";
import ModalReporte from "../components/reportes/ModalReporte";
import ModalCalificar from "../components/servicios/ModalCalificar";
import ModalCancelarReserva from "../components/servicios/ModalCancelarReserva";
import { apiJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { chatDisponible, formatearFecha, obtenerEstado } from "../helpers/servicios";
import { obtenerEstadoReclamo } from "../helpers/reclamos";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useContadorNotificaciones } from "../hooks/useContadorNotificaciones";
import { useEstilos } from "../hooks/useEstilos";
import { useEventoTiempoReal } from "../hooks/useTiempoReal";
import estilosBase from "../config/estilos/base";

const INTERVALO_ACTUALIZACION = 15000;

function BotonReclamo({ servicio, reclamoEmitido, alReclamar }) {
  if (servicio.estado !== "finalizado") {
    return (
      <>
        <button type="button" className="btn btn-outline-danger w-100 mt-2" disabled>
          Reclamar
        </button>
        <small className="text-secondary d-block mt-1">
          Disponible cuando el servicio esté finalizado.
        </small>
      </>
    );
  }

  if (reclamoEmitido) {
    const estadoReclamo = obtenerEstadoReclamo(reclamoEmitido.estado);

    return (
      <>
        <button type="button" className="btn btn-outline-secondary w-100 mt-2" disabled>
          Reclamo enviado
        </button>
        <p className="small mt-2 mb-0">
          Estado del reclamo:{" "}
          <span className={`badge ${estadoReclamo.clase}`}>{estadoReclamo.texto}</span>
        </p>
        {reclamoEmitido.resolucion && (
          <small className="text-secondary d-block mt-1">Resolución: {reclamoEmitido.resolucion}</small>
        )}
      </>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-outline-danger w-100 mt-2"
      onClick={() => alReclamar(servicio)}
    >
      Reclamar
    </button>
  );
}

export default function MisServicios() {
  const { usuario } = useAuth();
  const [servicios, setServicios] = useState(null);
  const [reclamos, setReclamos] = useState([]);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [aviso, setAviso] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [servicioReclamado, setServicioReclamado] = useState(null);
  const [servicioCancelado, setServicioCancelado] = useState(null);
  const [servicioCalificado, setServicioCalificado] = useState(null);
  const [personaReportada, setPersonaReportada] = useState(null);
  const firma = useRef("");
  const { noLeidas, recargar: recargarContador } =
    useContadorNotificaciones(INTERVALO_ACTUALIZACION);

  useBootstrap();
  useEstilos("base", estilosBase);

  const cargarDatos = useCallback(async () => {
    const respuestaServicios = await apiJson("/api/servicios");

    if (!respuestaServicios.ok) {
      throw new Error(respuestaServicios.datos.mensaje || "No se pudieron cargar los servicios");
    }

    const respuestaReclamos = await apiJson("/api/reclamos");

    const listaServicios = respuestaServicios.datos.servicios || [];
    const listaReclamos = respuestaReclamos.ok ? respuestaReclamos.datos.reclamos || [] : [];

    const nuevaFirma = JSON.stringify([
      listaServicios.map((servicio) => [servicio.id, servicio.estado, servicio.reembolso, servicio.calificado]),
      listaReclamos.map((reclamo) => [reclamo.id, reclamo.estado])
    ]);

    if (nuevaFirma !== firma.current) {
      firma.current = nuevaFirma;
      setServicios(listaServicios);
      setReclamos(listaReclamos);
    }
  }, []);

  useEffect(() => {
    let activo = true;

    const iniciar = async () => {
      try {
        await cargarDatos();
      } catch (fallo) {
        console.error("Error al cargar mis servicios:", fallo);

        if (activo) {
          setError(fallo.message || "No se pudieron cargar tus servicios.");
          setServicios([]);
        }
      }
    };

    iniciar();

    const temporizador = setInterval(async () => {
      try {
        await cargarDatos();
      } catch (fallo) {
        console.error("Error al actualizar los servicios:", fallo);
      }
    }, INTERVALO_ACTUALIZACION);

    return () => {
      activo = false;
      clearInterval(temporizador);
    };
  }, [cargarDatos]);

  // El prestador acepta/rechaza o el estado cambia: se refleja sin esperar al sondeo
  useEventoTiempoReal("notificacion", () => {
    cargarDatos().catch((fallo) => console.error("Error al actualizar los servicios:", fallo));
  });

  useEffect(() => {
    if (!exito && !aviso) {
      return undefined;
    }

    const temporizador = setTimeout(() => {
      setExito("");
      setAviso(null);
    }, 6000);

    return () => clearTimeout(temporizador);
  }, [exito, aviso]);

  const reclamoEnviado = async () => {
    setServicioReclamado(null);

    try {
      await cargarDatos();
    } catch (fallo) {
      console.error("Error al actualizar los servicios:", fallo);
    }

    await recargarContador();
    setExito("Reclamo enviado. Podés seguir su estado en este servicio.");
  };

  const reservaCancelada = async (mensaje) => {
    setServicioCancelado(null);

    try {
      await cargarDatos();
    } catch (fallo) {
      console.error("Error al actualizar los servicios:", fallo);
    }

    setAviso({ tipo: "warning", texto: mensaje });
  };

  const reporteEnviado = (mensaje) => {
    setPersonaReportada(null);
    setExito(mensaje);
  };

  const reservaCalificada = () => {
    setServicioCalificado(null);
    setExito("¡Gracias por tu reseña!");
    cargarDatos().catch(() => {});
  };

  const esPrestador = usuario.rol === "prestador";

  const lista = (servicios || []).filter(
    (servicio) => filtroEstado === "" || servicio.estado === filtroEstado
  );

  return (
    <>
      <main className="container py-5">
        <div className="text-center mb-5">
          <h1>Mis servicios</h1>
          <p className="text-secondary">
            Consultá tus reservas, pagalas, cancelalas, accedé al chat, calificá al prestador y abrí
            reclamos de servicios finalizados.
          </p>
        </div>

        <div className="row justify-content-end mb-4">
          <div className="col-md-4">
            <select
              className="form-select"
              aria-label="Filtrar por estado"
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="programado">Pendiente de confirmación</option>
              <option value="aceptado">Aceptadas</option>
              <option value="en-curso">En curso</option>
              <option value="finalizado">Finalizadas</option>
              <option value="cancelado">Canceladas</option>
              <option value="rechazado">Rechazadas</option>
            </select>
          </div>
        </div>

        {exito && <div className="alert alert-success">{exito}</div>}
        {aviso && <div className={`alert alert-${aviso.tipo}`}>{aviso.texto}</div>}

        {servicios === null && (
          <div className="text-center text-secondary">Cargando tus servicios...</div>
        )}

        {servicios !== null && servicios.length === 0 && !error && (
          <div className="alert alert-info">Todavía no tenés servicios o reservas.</div>
        )}

        {servicios !== null && servicios.length > 0 && lista.length === 0 && (
          <div className="text-center text-secondary py-5">No hay reservas para mostrar.</div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-4">
          {lista.map((servicio) => {
            const estado = obtenerEstado(servicio.estado);

            const reclamoEmitido = reclamos.find(
              (reclamo) =>
                Number(reclamo.servicioId) === Number(servicio.id) && reclamo.soyReclamante
            );

            const reclamoRecibido = reclamos.find(
              (reclamo) =>
                Number(reclamo.servicioId) === Number(servicio.id) && !reclamo.soyReclamante
            );

            const estadoRecibido = reclamoRecibido
              ? obtenerEstadoReclamo(reclamoRecibido.estado)
              : null;

            const puedeCancelar = ["programado", "aceptado"].includes(servicio.estado);

            return (
              <div className="col-md-6 col-lg-4" key={servicio.id}>
                <div className="card h-100 shadow-sm border-0 rounded-4">
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h2 className="h5 fw-bold mb-0">{servicio.tipo || "Servicio"}</h2>
                      <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                    </div>

                    <p className="mb-2">
                      <strong>Mascota:</strong> {servicio.mascota || "No especificada"}
                    </p>

                    {!esPrestador && (
                      <p className="mb-2">
                        <strong>Prestador:</strong> {servicio.prestador || "No especificado"}
                      </p>
                    )}

                    <p className="mb-2">
                      <strong>Fecha:</strong> {formatearFecha(servicio.horaProgramada)}
                    </p>

                    {servicio.origen && (
                      <p className="mb-2">
                        <strong>Traslado:</strong> {servicio.origen} → {servicio.destino}
                      </p>
                    )}

                    {servicio.servicioVueltaId && (
                      <p className="mb-2">
                        <strong>
                          {servicio.motivoTraslado === "vuelta"
                            ? "Vuelta de la reserva"
                            : "Incluye la vuelta"}
                        </strong>{" "}
                        #{servicio.servicioVueltaId}
                      </p>
                    )}

                    <p className="mb-3">
                      <strong>Monto:</strong> ${Number(servicio.monto || 0).toLocaleString("es-AR")}
                    </p>

                    {servicio.estado === "cancelado" && (
                      <div className="small mb-3">
                        {servicio.reembolso !== null && servicio.reembolso !== undefined && (
                          <span
                            className={`badge ${servicio.reembolso ? "text-bg-success" : "text-bg-secondary"}`}
                          >
                            {servicio.reembolso ? "Con reembolso" : "Sin reembolso"}
                          </span>
                        )}

                        {servicio.motivoCancelacion && (
                          <p className="text-secondary mb-0 mt-2">
                            <strong>Motivo:</strong> {servicio.motivoCancelacion}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-auto">
                      {!esPrestador && servicio.estado === "programado" && (
                        <Link
                          to={`${RUTAS.pago}?servicioId=${servicio.id}`}
                          className="btn btn-primary w-100 mb-2"
                        >
                          <i className="bi bi-credit-card me-1"></i> Pagar con custodia
                        </Link>
                      )}

                      {puedeCancelar && (
                        <button
                          type="button"
                          className="btn btn-outline-danger w-100 mb-2"
                          onClick={() => setServicioCancelado(servicio)}
                        >
                          Cancelar reserva
                        </button>
                      )}

                      {chatDisponible(servicio.estado) ? (
                        <Link
                          to={`${RUTAS.chat}?servicioId=${servicio.id}`}
                          className="btn btn-primary w-100"
                        >
                          Abrir chat
                        </Link>
                      ) : (
                        <button className="btn btn-outline-secondary w-100" disabled>
                          Chat no disponible
                        </button>
                      )}

                      {servicio.estado === "en-curso" && (
                        <Link
                          to={`${RUTAS.seguimiento}?servicioId=${servicio.id}`}
                          className="btn btn-outline-primary w-100 mt-2"
                        >
                          <i className="bi bi-geo-alt me-1"></i> Ver seguimiento
                        </Link>
                      )}

                      {!esPrestador && servicio.estado === "finalizado" && !servicio.calificado && (
                        <button
                          type="button"
                          className="btn btn-outline-primary w-100 mt-2"
                          onClick={() => setServicioCalificado(servicio)}
                        >
                          <i className="bi bi-star me-1"></i> Calificar
                        </button>
                      )}

                      <BotonReclamo
                        servicio={servicio}
                        reclamoEmitido={reclamoEmitido}
                        alReclamar={setServicioReclamado}
                      />

                      {estadoRecibido && (
                        <p className="small mt-2 mb-0">
                          Reclamo recibido:{" "}
                          <span className={`badge ${estadoRecibido.clase}`}>
                            {estadoRecibido.texto}
                          </span>
                        </p>
                      )}

                      {(esPrestador ? servicio.ownerId : servicio.providerId) && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-secondary w-100 mt-2"
                          onClick={() =>
                            setPersonaReportada(
                              esPrestador
                                ? { id: servicio.ownerId, nombre: `el dueño de la reserva #${servicio.id}` }
                                : { id: servicio.providerId, nombre: servicio.prestador || "el prestador" }
                            )
                          }
                        >
                          <i className="bi bi-exclamation-octagon me-1"></i>
                          {esPrestador ? "Reportar al dueño" : "Reportar al prestador"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {servicioReclamado && (
        <ModalReclamo
          servicio={servicioReclamado}
          alCerrar={() => setServicioReclamado(null)}
          alEnviado={reclamoEnviado}
        />
      )}

      {servicioCancelado && (
        <ModalCancelarReserva
          servicio={servicioCancelado}
          alCerrar={() => setServicioCancelado(null)}
          alCancelada={reservaCancelada}
        />
      )}

      {personaReportada && (
        <ModalReporte
          persona={personaReportada}
          alCerrar={() => setPersonaReportada(null)}
          alEnviado={reporteEnviado}
        />
      )}

      {servicioCalificado && (
        <ModalCalificar
          servicio={servicioCalificado}
          alCerrar={() => setServicioCalificado(null)}
          alCalificado={reservaCalificada}
        />
      )}
    </>
  );
}
