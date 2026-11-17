import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDatos, enviarDatos } from "../../config/api";
import { RUTAS } from "../../config/rutas";
import { formatearFecha } from "../../helpers/admin";
import { textoMotivo } from "../../helpers/reportes";
import ModalMotivo from "./ModalMotivo";

const LIMITE = 10;

const ESTADOS_REPORTE = {
  pendiente: { texto: "Pendiente", clase: "text-bg-warning" },
  resuelto: { texto: "Resuelto", clase: "text-bg-success" },
  descartado: { texto: "Descartado", clase: "text-bg-secondary" }
};

function Estrellas({ puntuacion }) {
  return (
    <span className="text-warning">
      {"★".repeat(puntuacion)}
      {"☆".repeat(5 - puntuacion)}
    </span>
  );
}

function EnlaceLegajo({ persona }) {
  return persona ? (
    <Link to={`${RUTAS.adminLegajo}/${persona.id}`} className="text-decoration-none">
      {persona.nombre}
    </Link>
  ) : (
    "-"
  );
}

function Paginacion({ datos, alCambiar }) {
  if (!datos || datos.totalPaginas <= 1) {
    return null;
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <button
        className="btn btn-outline-secondary btn-sm"
        type="button"
        disabled={datos.pagina <= 1}
        onClick={() => alCambiar(datos.pagina - 1)}
      >
        Anterior
      </button>
      <span className="small text-secondary">{`Página ${datos.pagina} de ${datos.totalPaginas}`}</span>
      <button
        className="btn btn-outline-secondary btn-sm"
        type="button"
        disabled={datos.pagina >= datos.totalPaginas}
        onClick={() => alCambiar(datos.pagina + 1)}
      >
        Siguiente
      </button>
    </div>
  );
}

// Historias "Moderación de reseñas" y "Reporte de usuario": reportes enviados por los usuarios
// y control de las reseñas (ocultar, volver a mostrar o eliminar dejando el motivo registrado).
export default function SeccionModeracion({ alAvisar, alCambiar }) {
  const [vista, setVista] = useState("reportes");
  const [filtroReportes, setFiltroReportes] = useState({ estado: "pendiente", pagina: 1 });
  const [filtroResenas, setFiltroResenas] = useState({ visibilidad: "", reportadas: false, pagina: 1 });
  const [reportes, setReportes] = useState(null);
  const [resenas, setResenas] = useState(null);
  const [accion, setAccion] = useState(null);

  const cargarReportes = useCallback(async () => {
    const parametros = new URLSearchParams({ pagina: filtroReportes.pagina, limite: LIMITE });

    if (filtroReportes.estado) parametros.set("estado", filtroReportes.estado);

    try {
      setReportes(await apiDatos(`/api/admin/reportes?${parametros}`));
    } catch (error) {
      alAvisar(error.message, "danger");
      setReportes((anterior) => anterior ?? { reportes: [], pagina: 1, totalPaginas: 1, total: 0 });
    }
  }, [filtroReportes, alAvisar]);

  const cargarResenas = useCallback(async () => {
    const parametros = new URLSearchParams({ pagina: filtroResenas.pagina, limite: LIMITE });

    if (filtroResenas.visibilidad) parametros.set("visibilidad", filtroResenas.visibilidad);
    if (filtroResenas.reportadas) parametros.set("reportadas", "true");

    try {
      setResenas(await apiDatos(`/api/admin/resenas?${parametros}`));
    } catch (error) {
      alAvisar(error.message, "danger");
      setResenas((anterior) => anterior ?? { resenas: [], pagina: 1, totalPaginas: 1, total: 0 });
    }
  }, [filtroResenas, alAvisar]);

  useEffect(() => {
    if (vista === "reportes") {
      cargarReportes();
    } else {
      cargarResenas();
    }
  }, [vista, cargarReportes, cargarResenas]);

  const recargar = async (mensaje) => {
    alAvisar(mensaje);
    setAccion(null);
    await (vista === "reportes" ? cargarReportes() : cargarResenas());
    alCambiar();
  };

  // Acciones que piden motivo: ocultar o eliminar una reseña, resolver o descartar un reporte
  const confirmarAccion = async (motivo) => {
    const { tipo, resena, reporte } = accion;

    if (tipo === "ocultar") {
      await enviarDatos(`/api/admin/resenas/${resena.id}`, "PATCH", { oculta: true, motivo });
      await recargar("Reseña ocultada y autor notificado");
    }

    if (tipo === "eliminar") {
      await enviarDatos(`/api/admin/resenas/${resena.id}`, "DELETE", { motivo });
      await recargar("Reseña eliminada y motivo registrado");
    }

    if (tipo === "resuelto" || tipo === "descartado") {
      await enviarDatos(`/api/admin/reportes/${reporte.id}`, "PATCH", { estado: tipo, resolucion: motivo });
      await recargar(tipo === "resuelto" ? "Reporte resuelto" : "Reporte descartado");
    }
  };

  const mostrarResena = async (resena) => {
    try {
      await enviarDatos(`/api/admin/resenas/${resena.id}`, "PATCH", { oculta: false });
      await recargar("La reseña volvió a ser visible");
    } catch (error) {
      alAvisar(error.message, "danger");
    }
  };

  const accionesResena = (resena) => (
    <div className="d-flex flex-wrap gap-2">
      {resena.oculta ? (
        <button type="button" className="btn btn-outline-success btn-sm" onClick={() => mostrarResena(resena)}>
          Volver a mostrar
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-outline-warning btn-sm"
          onClick={() => setAccion({ tipo: "ocultar", resena })}
        >
          Ocultar
        </button>
      )}
      <button
        type="button"
        className="btn btn-outline-danger btn-sm"
        onClick={() => setAccion({ tipo: "eliminar", resena })}
      >
        Eliminar
      </button>
    </div>
  );

  const textosModal = {
    ocultar: ["Ocultar reseña", "La reseña deja de mostrarse y de contar para el promedio del prestador.", 5, "Ocultar", "btn-warning"],
    eliminar: ["Eliminar reseña", "Se borra de forma definitiva. Su contenido y el motivo quedan en el registro de acciones.", 5, "Eliminar", "btn-danger"],
    resuelto: ["Resolver reporte", "Indicá qué se hizo. El usuario que reportó recibe una notificación.", 0, "Marcar resuelto", "btn-success"],
    descartado: ["Descartar reporte", "El usuario que reportó recibe una notificación.", 0, "Descartar", "btn-secondary"]
  };

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          className={`btn btn-sm rounded-pill ${vista === "reportes" ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => setVista("reportes")}
        >
          Reportes de usuarios
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill ${vista === "resenas" ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => setVista("resenas")}
        >
          Reseñas
        </button>
      </div>

      {vista === "reportes" && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={filtroReportes.estado}
                  onChange={(evento) => setFiltroReportes({ estado: evento.target.value, pagina: 1 })}
                >
                  <option value="pendiente">Pendientes</option>
                  <option value="resuelto">Resueltos</option>
                  <option value="descartado">Descartados</option>
                  <option value="">Todos</option>
                </select>
              </div>
            </div>

            {reportes === null && <p className="text-secondary mb-0">Cargando reportes...</p>}
            {reportes !== null && reportes.reportes.length === 0 && (
              <p className="text-secondary mb-0">No hay reportes para mostrar.</p>
            )}

            {(reportes?.reportes || []).map((reporte) => {
              const estado = ESTADOS_REPORTE[reporte.estado] || ESTADOS_REPORTE.pendiente;

              return (
                <div key={reporte.id} className="border rounded-3 p-3 mb-3">
                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                    <strong>
                      #{reporte.id} · {reporte.tipo === "resena" ? "Reseña reportada" : "Usuario reportado"} ·{" "}
                      {textoMotivo(reporte.tipo, reporte.motivo)}
                    </strong>
                    <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                  </div>

                  <p className="small text-secondary mb-2">
                    Enviado por <EnlaceLegajo persona={reporte.reportante} /> el {formatearFecha(reporte.fecha)} ·{" "}
                    {reporte.tipo === "resena" ? "Autor de la reseña" : "Reportado"}:{" "}
                    <EnlaceLegajo persona={reporte.reportado} />
                    {reporte.reportado?.estadoCuenta === "suspendida" && (
                      <span className="badge text-bg-danger ms-1">Suspendido</span>
                    )}
                  </p>

                  {reporte.detalle && (
                    <p className="small mb-2" style={{ whiteSpace: "pre-wrap" }}>
                      {reporte.detalle}
                    </p>
                  )}

                  {reporte.tipo === "resena" && (
                    <div className="bg-body-tertiary rounded-3 p-2 small mb-2">
                      {reporte.resena ? (
                        <>
                          <Estrellas puntuacion={reporte.resena.puntuacion} /> sobre{" "}
                          <EnlaceLegajo persona={reporte.resena.prestador} />
                          {reporte.resena.oculta && <span className="badge text-bg-secondary ms-2">Oculta</span>}
                          <p className="mb-0 mt-1">{reporte.resena.comentario || "Sin comentario"}</p>
                        </>
                      ) : (
                        <span className="text-secondary">La reseña ya fue eliminada.</span>
                      )}
                    </div>
                  )}

                  {reporte.resolucion && <p className="small text-success mb-2">Resolución: {reporte.resolucion}</p>}

                  {reporte.estado === "pendiente" && (
                    <div className="d-flex flex-wrap gap-2">
                      {reporte.tipo === "resena" && reporte.resena && accionesResena(reporte.resena)}
                      {reporte.tipo === "usuario" && reporte.reportado && (
                        <Link to={`${RUTAS.adminLegajo}/${reporte.reportado.id}`} className="btn btn-outline-secondary btn-sm">
                          Ver legajo
                        </Link>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => setAccion({ tipo: "resuelto", reporte })}
                      >
                        Marcar resuelto
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setAccion({ tipo: "descartado", reporte })}
                      >
                        Descartar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            <Paginacion
              datos={reportes}
              alCambiar={(pagina) => setFiltroReportes((anterior) => ({ ...anterior, pagina }))}
            />
          </div>
        </div>
      )}

      {vista === "resenas" && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-2 align-items-center mb-3">
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={filtroResenas.visibilidad}
                  onChange={(evento) =>
                    setFiltroResenas((anterior) => ({ ...anterior, visibilidad: evento.target.value, pagina: 1 }))
                  }
                >
                  <option value="">Todas</option>
                  <option value="visibles">Visibles</option>
                  <option value="ocultas">Ocultas</option>
                </select>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input
                    id="solo-reportadas"
                    type="checkbox"
                    className="form-check-input"
                    checked={filtroResenas.reportadas}
                    onChange={(evento) =>
                      setFiltroResenas((anterior) => ({ ...anterior, reportadas: evento.target.checked, pagina: 1 }))
                    }
                  />
                  <label className="form-check-label" htmlFor="solo-reportadas">
                    Solo con reportes pendientes
                  </label>
                </div>
              </div>
            </div>

            {resenas === null && <p className="text-secondary mb-0">Cargando reseñas...</p>}
            {resenas !== null && resenas.resenas.length === 0 && (
              <p className="text-secondary mb-0">No hay reseñas para mostrar.</p>
            )}

            {(resenas?.resenas || []).map((resena) => (
              <div key={resena.id} className="border rounded-3 p-3 mb-3">
                <div className="d-flex flex-wrap justify-content-between gap-2 mb-1">
                  <span>
                    <Estrellas puntuacion={resena.puntuacion} /> · <EnlaceLegajo persona={resena.autor} /> sobre{" "}
                    <EnlaceLegajo persona={resena.prestador} />
                  </span>
                  <span className="small text-secondary">
                    Servicio #{resena.servicioId} · {formatearFecha(resena.fecha, false)}
                  </span>
                </div>

                <p className="small mb-2">{resena.comentario || <span className="text-secondary">Sin comentario</span>}</p>

                <div className="d-flex flex-wrap gap-2 mb-2">
                  {resena.oculta && <span className="badge text-bg-secondary">Oculta: {resena.motivoModeracion}</span>}
                  {resena.reportesPendientes > 0 && (
                    <span className="badge text-bg-warning">{resena.reportesPendientes} reporte(s) pendiente(s)</span>
                  )}
                </div>

                {accionesResena(resena)}
              </div>
            ))}

            <Paginacion
              datos={resenas}
              alCambiar={(pagina) => setFiltroResenas((anterior) => ({ ...anterior, pagina }))}
            />
          </div>
        </div>
      )}

      {accion && (
        <ModalMotivo
          titulo={textosModal[accion.tipo][0]}
          descripcion={textosModal[accion.tipo][1]}
          etiqueta={accion.reporte ? "Resolución" : "Motivo"}
          minimo={textosModal[accion.tipo][2]}
          textoConfirmar={textosModal[accion.tipo][3]}
          claseConfirmar={textosModal[accion.tipo][4]}
          alCerrar={() => setAccion(null)}
          alConfirmar={confirmarAccion}
        />
      )}
    </>
  );
}
