import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ContadorNotificaciones from "../components/ContadorNotificaciones";
import { enviarJson, apiJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { formatearFechaHora, obtenerEstadoReclamo } from "../helpers/reclamos";
import { useBootstrap } from "../hooks/useBootstrap";
import { useContadorNotificaciones } from "../hooks/useContadorNotificaciones";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

const INTERVALO_ACTUALIZACION = 20000;

function Acciones({ reclamo, alCambiar }) {
  if (reclamo.estado === "pendiente") {
    return (
      <>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => alCambiar(reclamo.id, "en-revision")}
        >
          Marcar en revisión
        </button>
        <button
          type="button"
          className="btn btn-outline-success btn-sm"
          onClick={() => alCambiar(reclamo.id, "finalizado")}
        >
          Finalizar
        </button>
      </>
    );
  }

  if (reclamo.estado === "en-revision") {
    return (
      <button
        type="button"
        className="btn btn-success btn-sm"
        onClick={() => alCambiar(reclamo.id, "finalizado")}
      >
        Marcar finalizado
      </button>
    );
  }

  return <span className="text-secondary small">Reclamo cerrado.</span>;
}

export default function AdminReclamos() {
  const [reclamos, setReclamos] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");
  const { noLeidas, recargar: recargarContador } =
    useContadorNotificaciones(INTERVALO_ACTUALIZACION);

  useBootstrap();
  useEstilos("base", estilosBase);

  const cargar = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson("/api/reclamos");

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudieron cargar los reclamos");
      }

      setReclamos(datos.reclamos || []);
      setError("");
    } catch (fallo) {
      console.error("Error al cargar reclamos:", fallo);
      setError(fallo.message);
      setReclamos((anterior) => anterior ?? []);
    }
  }, []);

  useEffect(() => {
    cargar();

    const temporizador = setInterval(cargar, INTERVALO_ACTUALIZACION);

    return () => clearInterval(temporizador);
  }, [cargar]);

  const cambiarEstado = async (id, estado) => {
    const textoEstado = obtenerEstadoReclamo(estado).texto;

    if (!window.confirm(`¿Cambiar el reclamo #${id} a "${textoEstado}"?`)) {
      return;
    }

    try {
      const { ok, datos } = await enviarJson(`/api/reclamos/${id}/estado`, "PATCH", { estado });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo actualizar el reclamo");
      }

      await cargar();
      await recargarContador();
    } catch (fallo) {
      window.alert(fallo.message);
    }
  };

  const visibles = (reclamos || []).filter((reclamo) => filtro === "" || reclamo.estado === filtro);

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
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <h1 className="fw-bold mb-0">Gestión de reclamos</h1>

          <div className="d-flex gap-2">
            <select
              className="form-select"
              value={filtro}
              onChange={(evento) => setFiltro(evento.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en-revision">En revisión</option>
              <option value="finalizado">Finalizado</option>
            </select>

            <button type="button" className="btn btn-outline-primary" onClick={cargar}>
              Actualizar
            </button>
          </div>
        </div>

        {reclamos === null && (
          <div className="text-center text-secondary">Cargando reclamos...</div>
        )}

        {reclamos !== null && visibles.length === 0 && !error && (
          <div className="alert alert-info">No hay reclamos para mostrar.</div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-4">
          {visibles.map((reclamo) => {
            const estado = obtenerEstadoReclamo(reclamo.estado);
            const servicio = reclamo.servicio;

            return (
              <div className="col-12 col-lg-6" key={reclamo.id}>
                <div className="card h-100 shadow-sm border-0 rounded-4">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h2 className="h5 fw-bold mb-0">{`Reclamo #${reclamo.id}`}</h2>
                      <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                    </div>

                    <p className="text-secondary small mb-3">
                      {`Servicio #${reclamo.servicioId}`}
                      {servicio ? ` - ${servicio.tipo} - ${servicio.mascota}` : ""}
                    </p>

                    <p className="mb-1">
                      <strong>Reclamante:</strong>{" "}
                      {`${reclamo.reclamante?.nombre ?? ""} (${reclamo.reclamante?.rol ?? ""})`}
                    </p>

                    <p className="mb-1">
                      <strong>Reclamado:</strong>{" "}
                      {`${reclamo.reclamado?.nombre ?? ""} (${reclamo.reclamado?.rol ?? ""})`}
                    </p>

                    <p className="mb-3">
                      <strong>Fecha:</strong> {formatearFechaHora(reclamo.creadoEn)}
                    </p>

                    <p className="fw-semibold mb-1">Descripción</p>
                    <p className="mb-3" style={{ whiteSpace: "pre-wrap" }}>
                      {reclamo.descripcion}
                    </p>

                    <p className="fw-semibold mb-1">Evidencias</p>
                    <div className="mb-4">
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

                    <div className="d-flex flex-wrap gap-2">
                      <Acciones reclamo={reclamo} alCambiar={cambiarEstado} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
