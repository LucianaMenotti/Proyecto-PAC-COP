import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ModalMotivo from "../components/admin/ModalMotivo";
import { apiDatos, enviarDatos } from "../config/api";
import { RUTAS } from "../config/rutas";
import {
  ESTADOS_CUENTA,
  ESTADOS_SERVICIO,
  TEXTO_ACCIONES,
  formatearFecha,
  formatearMonto,
  rutaDocumento
} from "../helpers/admin";
import { obtenerEstadoAprobacion } from "../helpers/documentacion";
import { descargarLegajo, textoDisponibilidad, textoServicios } from "../helpers/legajo";
import { leerLista } from "../helpers/listas";
import { obtenerEstadoReclamo } from "../helpers/reclamos";
import { useAuth } from "../hooks/useAuth";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

function Dato({ etiqueta, children }) {
  return (
    <div className="mb-2">
      <span className="small text-secondary d-block">{etiqueta}</span>
      <span className="fw-semibold" style={{ whiteSpace: "pre-wrap" }}>
        {children || "-"}
      </span>
    </div>
  );
}

function Tarjeta({ titulo, icono, children, extra = null }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h6 fw-bold mb-0">
            <i className={`bi ${icono} me-2 text-primary-pac`}></i>
            {titulo}
          </h2>
          {extra}
        </div>
        {children}
      </div>
    </div>
  );
}

// Legajo de un usuario para la administración: GET /api/admin/usuarios/:id
// Reúne datos, documentación, perfil profesional, actividad, reseñas, reclamos y decisiones previas,
// con las acciones de aprobación y suspensión a mano y descarga en PDF.
export default function LegajoUsuario() {
  const { id } = useParams();
  const { usuario: sesion } = useAuth();
  const [legajo, setLegajo] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(null);
  const [modal, setModal] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [cancelarReservas, setCancelarReservas] = useState(true);

  useEstilos("base", estilosBase);

  const cargar = useCallback(async () => {
    try {
      setLegajo(await apiDatos(`/api/admin/usuarios/${id}`));
      setError("");
    } catch (fallo) {
      setError(fallo.message);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!aviso) {
      return undefined;
    }

    const temporizador = setTimeout(() => setAviso(null), 3500);

    return () => clearTimeout(temporizador);
  }, [aviso]);

  if (error) {
    return (
      <main className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to={`${RUTAS.admin}/usuarios`}>Volver a usuarios</Link>
      </main>
    );
  }

  if (!legajo) {
    return <main className="container py-5 text-secondary">Cargando legajo...</main>;
  }

  const { usuario, estadisticas, servicios, calificaciones, reclamos, mascotas, acciones } = legajo;
  const esPrestador = usuario.rol === "prestador";
  const esAdmin = ["admin", "administrador"].includes(usuario.rol);
  const esPropio = Number(usuario.id) === Number(sesion?.id);
  const suspendida = usuario.estadoCuenta === "suspendida";
  const cuenta = ESTADOS_CUENTA[usuario.estadoCuenta] || ESTADOS_CUENTA.activa;
  const aprobacion = obtenerEstadoAprobacion(usuario.estadoAprobacion);

  const ejecutar = async (ruta, cuerpo, texto) => {
    const respuesta = await enviarDatos(ruta, "POST", cuerpo);
    setAviso({ texto: texto || respuesta.mensaje, tipo: "success" });
    setModal(null);
    await cargar();
  };

  const aprobar = async () => {
    if (!window.confirm("¿Aprobar a este prestador? Su perfil pasará a ser visible en el buscador.")) {
      return;
    }

    try {
      await ejecutar(`/api/admin/usuarios/${usuario.id}/aprobacion`, { decision: "aprobado" }, "Prestador aprobado");
    } catch (fallo) {
      setAviso({ texto: fallo.message, tipo: "danger" });
    }
  };

  const reactivar = async () => {
    if (!window.confirm("¿Reactivar esta cuenta?")) {
      return;
    }

    try {
      await ejecutar(`/api/admin/usuarios/${usuario.id}/suspension`, { suspender: false });
    } catch (fallo) {
      setAviso({ texto: fallo.message, tipo: "danger" });
    }
  };

  const generarPdf = async () => {
    setGenerando(true);

    try {
      await descargarLegajo(legajo);
    } catch (fallo) {
      console.error("Error al generar el legajo:", fallo);
      setAviso({ texto: "No se pudo generar el PDF del legajo", tipo: "danger" });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="pac-seccion">
      {aviso && (
        <div className="position-fixed top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 1090 }}>
          <div className={`alert alert-${aviso.tipo} shadow-sm mb-0 py-2 px-3`}>{aviso.texto}</div>
        </div>
      )}

      <main className="container py-4 py-lg-5">
        <Link to={`${RUTAS.admin}/${esPrestador ? "prestadores" : "usuarios"}`} className="small text-decoration-none">
          <i className="bi bi-arrow-left me-1"></i>Volver al panel
        </Link>

        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mt-2 mb-4">
          <div>
            <p className="small text-secondary text-uppercase fw-bold mb-1">
              Legajo de {esPrestador ? "prestador" : esAdmin ? "administrador" : "dueño"} · #{usuario.id}
            </p>
            <h1 className="mb-2">
              {usuario.nombre} {usuario.apellido}
            </h1>
            <span className={`badge ${cuenta.clase} me-1`}>Cuenta {cuenta.texto.toLowerCase()}</span>
            {esPrestador && <span className={`badge ${aprobacion.clase}`}>{aprobacion.texto}</span>}
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={generarPdf} disabled={generando}>
              <i className="bi bi-file-earmark-pdf me-1"></i>
              {generando ? "Generando..." : "Descargar legajo"}
            </button>
            {esPrestador && usuario.estadoAprobacion !== "aprobado" && (
              <button type="button" className="btn btn-success" onClick={aprobar}>
                Aprobar
              </button>
            )}
            {esPrestador && usuario.estadoAprobacion !== "rechazado" && (
              <button type="button" className="btn btn-outline-danger" onClick={() => setModal("rechazo")}>
                Rechazar
              </button>
            )}
            {!esAdmin && !esPropio &&
              (suspendida ? (
                <button type="button" className="btn btn-outline-success" onClick={reactivar}>
                  Reactivar cuenta
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setCancelarReservas(true);
                    setModal("suspension");
                  }}
                >
                  Suspender cuenta
                </button>
              ))}
          </div>
        </div>

        {suspendida && (
          <div className="alert alert-danger">
            <strong>Cuenta suspendida</strong> el {formatearFecha(usuario.suspendidoEn)}.{" "}
            {usuario.motivoSuspension}
          </div>
        )}

        <div className="row g-3 mb-3">
          <div className="col-lg-4">
            <Tarjeta titulo="Datos personales" icono="bi-person-vcard">
              <Dato etiqueta="DNI">{usuario.dni}</Dato>
              <Dato etiqueta="Fecha de nacimiento">{usuario.fechaNacimiento}</Dato>
              <Dato etiqueta="Correo electrónico">
                <a href={`mailto:${usuario.email}`}>{usuario.email}</a>
              </Dato>
              <Dato etiqueta="Teléfono">
                <a href={`tel:${usuario.telefono}`}>{usuario.telefono}</a>
              </Dato>
              <Dato etiqueta="Alta en la plataforma">{formatearFecha(usuario.createdAt)}</Dato>
            </Tarjeta>
          </div>

          <div className="col-lg-8">
            {esPrestador ? (
              <Tarjeta titulo="Perfil profesional" icono="bi-briefcase">
                <div className="row">
                  <div className="col-md-6">
                    <Dato etiqueta="Zona">{usuario.zona}</Dato>
                    <Dato etiqueta="Servicios y precios">{textoServicios(usuario) || "Sin servicios"}</Dato>
                    <Dato etiqueta="Vehículo">{usuario.vehiculo || "Sin vehículo"}</Dato>
                    <Dato etiqueta="Calificación">
                      {`${Number(usuario.calificacion || 0).toFixed(1)} ★ (${usuario.resenas || 0} reseñas)`}
                    </Dato>
                  </div>
                  <div className="col-md-6">
                    <Dato etiqueta="Disponibilidad">{textoDisponibilidad(usuario.disponibilidad)}</Dato>
                    <Dato etiqueta="Tamaños aceptados">
                      {leerLista(usuario.tamanosAceptados).join(", ") || "Todos"}
                    </Dato>
                    <Dato etiqueta="Razas excluidas">{leerLista(usuario.restricciones).join(", ") || "Ninguna"}</Dato>
                    <Dato etiqueta="Cuenta de cobro">
                      {usuario.cuentaCobro
                        ? `${usuario.cuentaCobro.tipo} · ${usuario.cuentaCobro.titular}`
                        : "Sin cargar"}
                    </Dato>
                  </div>
                </div>
                <Dato etiqueta="Experiencia">{usuario.experiencia || "Sin informar"}</Dato>
                {usuario.motivoRechazo && <Dato etiqueta="Motivo del último rechazo">{usuario.motivoRechazo}</Dato>}
              </Tarjeta>
            ) : (
              <Tarjeta titulo="Mascotas" icono="bi-heart">
                {mascotas.length === 0 ? (
                  <p className="text-secondary small mb-0">Sin mascotas registradas.</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {mascotas.map((mascota) => (
                      <li key={mascota.id} className="mb-1">
                        <strong>{mascota.nombre}</strong> · {mascota.especie}
                        {mascota.raza ? `, ${mascota.raza}` : ""}
                        {mascota.tamano ? `, ${mascota.tamano}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </Tarjeta>
            )}
          </div>
        </div>

        {esPrestador && (
          <div className="mb-3">
            <Tarjeta titulo="Documentación de identidad" icono="bi-person-badge">
              <div className="d-flex flex-wrap gap-3">
                {[
                  ["documento", "Documento"],
                  ["selfie", "Selfie de validación"],
                  ["cv", "CV o certificados"]
                ].map(([tipo, etiqueta]) =>
                  usuario.documentacion?.[tipo] ? (
                    <a
                      key={tipo}
                      href={rutaDocumento(usuario.id, tipo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none text-center"
                    >
                      {tipo === "cv" ? (
                        <span className="d-flex align-items-center justify-content-center border rounded-3" style={{ width: 160, height: 120 }}>
                          <i className="bi bi-file-earmark-person fs-1"></i>
                        </span>
                      ) : (
                        <img
                          src={rutaDocumento(usuario.id, tipo)}
                          alt={etiqueta}
                          className="border rounded-3"
                          style={{ width: 160, height: 120, objectFit: "cover" }}
                        />
                      )}
                      <span className="d-block small mt-1">{etiqueta}</span>
                    </a>
                  ) : (
                    <div key={tipo} className="text-center">
                      <span className="d-flex align-items-center justify-content-center border rounded-3 text-secondary small bg-body-tertiary" style={{ width: 160, height: 120 }}>
                        No cargado
                      </span>
                      <span className="d-block small mt-1">{etiqueta}</span>
                    </div>
                  )
                )}
              </div>
            </Tarjeta>
          </div>
        )}

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <Tarjeta titulo="Actividad" icono="bi-activity">
              {Object.entries(ESTADOS_SERVICIO).map(([estado, { texto }]) => (
                <div key={estado} className="d-flex justify-content-between small mb-1">
                  <span>{texto}</span>
                  <strong>{estadisticas.serviciosPorEstado[estado] || 0}</strong>
                </div>
              ))}
              <hr />
              {esPrestador && <Dato etiqueta="Cobrado como prestador">{formatearMonto(estadisticas.cobradoComoPrestador)}</Dato>}
              {!esPrestador && <Dato etiqueta="Pagado como dueño">{formatearMonto(estadisticas.pagadoComoDueno)}</Dato>}
              <Dato etiqueta="Reclamos recibidos">{String(estadisticas.reclamosRecibidos)}</Dato>
            </Tarjeta>
          </div>

          <div className="col-md-8">
            <Tarjeta titulo="Últimos servicios" icono="bi-calendar-check">
              {servicios.length === 0 ? (
                <p className="text-secondary small mb-0">Sin servicios.</p>
              ) : (
                <div className="table-responsive" style={{ maxHeight: 320 }}>
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Servicio</th>
                        <th>{esPrestador ? "Dueño" : "Prestador"}</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicios.map((servicio) => (
                        <tr key={servicio.id}>
                          <td>{servicio.id}</td>
                          <td className="small text-nowrap">{formatearFecha(servicio.horaProgramada)}</td>
                          <td className="small">
                            {servicio.tipo} · {formatearMonto(servicio.monto)}
                          </td>
                          <td className="small">{servicio.rolEnServicio === "prestador" ? servicio.dueno : servicio.prestador}</td>
                          <td>
                            <span className={`badge ${ESTADOS_SERVICIO[servicio.estado]?.clase || "text-bg-secondary"}`}>
                              {ESTADOS_SERVICIO[servicio.estado]?.texto || servicio.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Tarjeta>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-lg-6">
            <Tarjeta titulo="Reseñas" icono="bi-star">
              {calificaciones.length === 0 && <p className="text-secondary small mb-0">Sin reseñas.</p>}
              {calificaciones.map((calificacion) => (
                <div key={calificacion.id} className="border-bottom py-2 small">
                  <div className="d-flex justify-content-between">
                    <span>
                      {calificacion.recibida ? `De ${calificacion.autor}` : `A ${calificacion.prestador}`}
                      {calificacion.oculta && <span className="badge text-bg-secondary ms-2">Oculta</span>}
                    </span>
                    <span className="text-warning">{"★".repeat(calificacion.puntuacion)}</span>
                  </div>
                  {calificacion.comentario && <p className="mb-0">{calificacion.comentario}</p>}
                </div>
              ))}
            </Tarjeta>
          </div>

          <div className="col-lg-6">
            <Tarjeta titulo="Reclamos" icono="bi-flag">
              {reclamos.length === 0 && <p className="text-secondary small mb-0">Sin reclamos.</p>}
              {reclamos.map((reclamo) => {
                const estado = obtenerEstadoReclamo(reclamo.estado);

                return (
                  <div key={reclamo.id} className="border-bottom py-2 small">
                    <div className="d-flex justify-content-between">
                      <span>
                        #{reclamo.id} · {reclamo.recibido ? `de ${reclamo.reclamante}` : `contra ${reclamo.reclamado}`}
                      </span>
                      <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                    </div>
                    <p className="mb-0 text-secondary">{reclamo.descripcion}</p>
                  </div>
                );
              })}
            </Tarjeta>
          </div>
        </div>

        <Tarjeta titulo="Decisiones de la administración" icono="bi-journal-text">
          {acciones.length === 0 && <p className="text-secondary small mb-0">Sin decisiones registradas.</p>}
          {acciones.map((accion) => (
            <div key={accion.id} className="d-flex flex-wrap justify-content-between border-bottom py-2 small gap-2">
              <span>
                <strong>{TEXTO_ACCIONES[accion.accion] || accion.accion}</strong>
                {accion.motivo ? ` · ${accion.motivo}` : ""}
              </span>
              <span className="text-secondary">
                {accion.admin} · {formatearFecha(accion.fecha)}
              </span>
            </div>
          ))}
        </Tarjeta>
      </main>

      {modal === "rechazo" && (
        <ModalMotivo
          titulo="Rechazar al prestador"
          descripcion="El prestador recibe una notificación con el motivo y puede volver a enviar su documentación."
          textoConfirmar="Rechazar"
          alCerrar={() => setModal(null)}
          alConfirmar={(motivo) =>
            ejecutar(`/api/admin/usuarios/${usuario.id}/aprobacion`, { decision: "rechazado", motivo }, "Prestador rechazado")
          }
        />
      )}

      {modal === "suspension" && (
        <ModalMotivo
          titulo="Suspender la cuenta"
          descripcion="La cuenta no podrá iniciar sesión y las sesiones abiertas se cierran."
          minimo={5}
          textoConfirmar="Suspender"
          alCerrar={() => setModal(null)}
          alConfirmar={(motivo) =>
            ejecutar(`/api/admin/usuarios/${usuario.id}/suspension`, { suspender: true, motivo, cancelarReservas })
          }
        >
          <div className="form-check mt-3">
            <input
              id="legajo-cancelar-reservas"
              type="checkbox"
              className="form-check-input"
              checked={cancelarReservas}
              onChange={(evento) => setCancelarReservas(evento.target.checked)}
            />
            <label className="form-check-label small" htmlFor="legajo-cancelar-reservas">
              Cancelar con reembolso sus reservas programadas o aceptadas
            </label>
          </div>
        </ModalMotivo>
      )}
    </div>
  );
}
