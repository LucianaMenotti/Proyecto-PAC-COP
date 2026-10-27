import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ContadorNotificaciones from "../components/ContadorNotificaciones";
import ModalReclamo from "../components/reclamos/ModalReclamo";
import { apiJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { chatDisponible, formatearFecha, obtenerEstado } from "../helpers/servicios";
import { obtenerEstadoReclamo } from "../helpers/reclamos";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useContadorNotificaciones } from "../hooks/useContadorNotificaciones";
import { useEstilos } from "../hooks/useEstilos";
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
  const [servicioReclamado, setServicioReclamado] = useState(null);
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
      listaServicios.map((servicio) => [servicio.id, servicio.estado]),
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

  useEffect(() => {
    if (!exito) {
      return undefined;
    }

    const temporizador = setTimeout(() => setExito(""), 6000);

    return () => clearTimeout(temporizador);
  }, [exito]);

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

  const esPrestador = usuario.rol === "prestador";

  return (
    <>
      <nav className="navbar bg-white shadow-sm">
        <div className="container">
          <Link to={RUTAS.cuenta} className="navbar-brand fw-bold text-primary">
            Pac-Cop
          </Link>

          <div className="d-flex gap-2">
            <Link to={RUTAS.notificaciones} className="btn btn-outline-primary">
              Notificaciones
              <ContadorNotificaciones cantidad={noLeidas} />
            </Link>

            <Link to={RUTAS.cuenta} className="btn btn-outline-primary">
              Volver
            </Link>
          </div>
        </div>
      </nav>

      <main className="container py-5">
        <div className="text-center mb-5">
          <h1 className="fw-bold">Mis servicios</h1>
          <p className="text-secondary">
            Consultá tus reservas, accedé al chat y abrí reclamos de servicios finalizados.
          </p>
        </div>

        {exito && <div className="alert alert-success">{exito}</div>}

        {servicios === null && (
          <div className="text-center text-secondary">Cargando tus servicios...</div>
        )}

        {servicios !== null && servicios.length === 0 && !error && (
          <div className="alert alert-info">Todavía no tenés servicios o reservas.</div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-4">
          {(servicios || []).map((servicio) => {
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

            return (
              <div className="col-md-6 col-lg-4" key={servicio.id}>
                <div className="card h-100 shadow-sm border-0 rounded-4">
                  <div className="card-body p-4">
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

                    <p className="mb-4">
                      <strong>Monto:</strong> ${Number(servicio.monto || 0).toLocaleString("es-AR")}
                    </p>

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
    </>
  );
}
