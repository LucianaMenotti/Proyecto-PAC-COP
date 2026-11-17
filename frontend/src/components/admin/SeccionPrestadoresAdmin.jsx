import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDatos, enviarDatos } from "../../config/api";
import { RUTAS } from "../../config/rutas";
import { leerLista } from "../../helpers/listas";
import { NOMBRE_TIPO, formatearFecha, nombreDe, rutaDocumento } from "../../helpers/admin";
import { obtenerEstadoAprobacion } from "../../helpers/documentacion";
import ModalMotivo from "./ModalMotivo";

const LIMITE = 12;

const FILTROS = [
  ["pendiente", "Pendientes"],
  ["rechazado", "Rechazados"],
  ["aprobado", "Aprobados"]
];

function Documento({ prestador, tipo, etiqueta }) {
  if (!prestador.documentacion?.[tipo]) {
    return (
      <div className="border rounded-3 d-flex align-items-center justify-content-center text-secondary small bg-body-tertiary documento-admin">
        Sin {etiqueta.toLowerCase()}
      </div>
    );
  }

  const ruta = rutaDocumento(prestador.id, tipo);

  // El CV puede ser un PDF: se ofrece como enlace
  if (tipo === "cv") {
    return (
      <a
        href={ruta}
        target="_blank"
        rel="noopener noreferrer"
        className="border rounded-3 d-flex flex-column align-items-center justify-content-center text-decoration-none small documento-admin"
      >
        <i className="bi bi-file-earmark-person fs-3"></i>
        Ver CV
      </a>
    );
  }

  return (
    <a href={ruta} target="_blank" rel="noopener noreferrer" title={`Abrir ${etiqueta.toLowerCase()}`}>
      <img src={ruta} alt={etiqueta} className="border rounded-3 documento-admin" style={{ objectFit: "cover" }} />
    </a>
  );
}

// Historia "Aprobación de prestadores": lista de pendientes, revisión de la documentación
// (foto del documento y selfie) y decisión con motivo opcional en el rechazo.
export default function SeccionPrestadoresAdmin({ alAvisar, alCambiar }) {
  const [estado, setEstado] = useState("pendiente");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [rechazando, setRechazando] = useState(null);

  const cargar = useCallback(async () => {
    const parametros = new URLSearchParams({
      rol: "prestador",
      estadoAprobacion: estado,
      pagina,
      limite: LIMITE
    });

    try {
      setDatos(await apiDatos(`/api/admin/usuarios?${parametros}`));
    } catch (error) {
      alAvisar(error.message, "danger");
      setDatos((anterior) => anterior ?? { usuarios: [], pagina: 1, totalPaginas: 1, total: 0 });
    }
  }, [estado, pagina, alAvisar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const decidir = async (prestador, decision, motivo = "") => {
    await enviarDatos(`/api/admin/usuarios/${prestador.id}/aprobacion`, "POST", { decision, motivo });
    alAvisar(decision === "aprobado" ? "Prestador aprobado y notificado" : "Prestador rechazado y notificado");
    setRechazando(null);
    await cargar();
    alCambiar();
  };

  const aprobar = async (prestador) => {
    if (!window.confirm(`¿Aprobar a ${nombreDe(prestador)}? Su perfil pasará a ser visible en el buscador.`)) {
      return;
    }

    try {
      await decidir(prestador, "aprobado");
    } catch (error) {
      alAvisar(error.message, "danger");
    }
  };

  return (
    <>
      <style>{".documento-admin{width:120px;height:90px}"}</style>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {FILTROS.map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            className={`btn btn-sm rounded-pill ${estado === valor ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => {
              setEstado(valor);
              setPagina(1);
            }}
          >
            {texto}
          </button>
        ))}
      </div>

      {datos === null && <p className="text-secondary">Cargando prestadores...</p>}

      {datos !== null && datos.usuarios.length === 0 && (
        <div className="alert alert-info">
          {estado === "pendiente"
            ? "No hay prestadores esperando aprobación."
            : "No hay prestadores en este estado."}
        </div>
      )}

      <div className="row g-3">
        {(datos?.usuarios || []).map((prestador) => {
          const estadoAprobacion = obtenerEstadoAprobacion(prestador.estadoAprobacion);
          const servicios = leerLista(prestador.servicios);

          return (
            <div className="col-12 col-xl-6" key={prestador.id}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <h2 className="h5 fw-bold mb-0">{nombreDe(prestador)}</h2>
                      <small className="text-secondary">
                        Registrado el {formatearFecha(prestador.createdAt, false)} · DNI {prestador.dni}
                      </small>
                    </div>
                    <span className={`badge ${estadoAprobacion.clase}`}>{estadoAprobacion.texto}</span>
                  </div>

                  <p className="small mb-1">
                    <i className="bi bi-envelope me-1"></i>
                    {prestador.email} · <i className="bi bi-telephone me-1"></i>
                    {prestador.telefono}
                  </p>
                  <p className="small mb-1">
                    <strong>Zona:</strong> {prestador.zona || "-"} · <strong>Servicios:</strong>{" "}
                    {servicios.map((item) => NOMBRE_TIPO[item] || item).join(", ") || "-"}
                    {prestador.vehiculo ? ` · Vehículo: ${prestador.vehiculo}` : ""}
                  </p>
                  <p className="small mb-3" style={{ whiteSpace: "pre-wrap" }}>
                    <strong>Experiencia:</strong> {prestador.experiencia || "Sin informar"}
                  </p>

                  {prestador.estadoAprobacion === "rechazado" && prestador.motivoRechazo && (
                    <p className="small text-danger mb-3">Motivo del rechazo: {prestador.motivoRechazo}</p>
                  )}

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Documento prestador={prestador} tipo="documento" etiqueta="Documento" />
                    <Documento prestador={prestador} tipo="selfie" etiqueta="Selfie" />
                    <Documento prestador={prestador} tipo="cv" etiqueta="CV" />
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    {prestador.estadoAprobacion !== "aprobado" && (
                      <button type="button" className="btn btn-success btn-sm" onClick={() => aprobar(prestador)}>
                        <i className="bi bi-check2-circle me-1"></i>Aprobar
                      </button>
                    )}
                    {prestador.estadoAprobacion !== "rechazado" && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => setRechazando(prestador)}
                      >
                        <i className="bi bi-x-circle me-1"></i>Rechazar
                      </button>
                    )}
                    <Link to={`${RUTAS.adminLegajo}/${prestador.id}`} className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-folder2-open me-1"></i>Legajo
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {datos && datos.totalPaginas > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            disabled={datos.pagina <= 1}
            onClick={() => setPagina((valor) => valor - 1)}
          >
            Anterior
          </button>
          <span className="small text-secondary">{`Página ${datos.pagina} de ${datos.totalPaginas}`}</span>
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            disabled={datos.pagina >= datos.totalPaginas}
            onClick={() => setPagina((valor) => valor + 1)}
          >
            Siguiente
          </button>
        </div>
      )}

      {rechazando && (
        <ModalMotivo
          titulo={`Rechazar a ${nombreDe(rechazando)}`}
          descripcion="El prestador recibe una notificación con el motivo y puede volver a enviar su documentación."
          textoConfirmar="Rechazar"
          alCerrar={() => setRechazando(null)}
          alConfirmar={(motivo) => decidir(rechazando, "rechazado", motivo)}
        />
      )}
    </>
  );
}
