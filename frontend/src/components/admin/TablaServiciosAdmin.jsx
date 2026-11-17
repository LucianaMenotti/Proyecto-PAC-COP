import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDatos, enviarDatos } from "../../config/api";
import { RUTAS } from "../../config/rutas";
import {
  ESTADOS_SERVICIO,
  NOMBRE_TIPO,
  TIPOS_SERVICIO,
  formatearFecha,
  formatearMonto,
  nombreDe
} from "../../helpers/admin";
import ModalMotivo from "./ModalMotivo";

const LIMITE = 10;

// Mismos estados que acepta POST /api/admin/servicios/:id/cancelar
const ESTADOS_CANCELABLES = ["programado", "aceptado", "en-curso"];

function Persona({ usuario }) {
  if (!usuario) {
    return "-";
  }

  return (
    <Link to={`${RUTAS.adminLegajo}/${usuario.id}`} className="text-decoration-none">
      {nombreDe(usuario)}
    </Link>
  );
}

// GET /api/admin/servicios?pagina=&limite=&estado=&tipo=  |  POST /api/admin/servicios/:id/cancelar { motivo }
export default function TablaServiciosAdmin({ alAvisar, alCambiar }) {
  const [filtros, setFiltros] = useState({ pagina: 1, estado: "", tipo: "" });
  const [datos, setDatos] = useState(null);
  const [cancelando, setCancelando] = useState(null);

  const cargar = useCallback(async () => {
    const parametros = new URLSearchParams({ pagina: filtros.pagina, limite: LIMITE });

    if (filtros.estado) parametros.set("estado", filtros.estado);
    if (filtros.tipo) parametros.set("tipo", filtros.tipo);

    try {
      setDatos(await apiDatos(`/api/admin/servicios?${parametros}`));
    } catch (error) {
      alAvisar(error.message, "danger");
      setDatos((anterior) => anterior ?? { servicios: [], pagina: 1, totalPaginas: 1, total: 0 });
    }
  }, [filtros, alAvisar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cancelar = async (motivo) => {
    const respuesta = await enviarDatos(`/api/admin/servicios/${cancelando.id}/cancelar`, "POST", { motivo });

    alAvisar(respuesta.pagoReembolsado ? "Servicio cancelado y pago reembolsado" : "Servicio cancelado");
    setCancelando(null);
    await cargar();
    alCambiar();
  };

  const cambiarFiltro = (campo) => (evento) =>
    setFiltros((anterior) => ({ ...anterior, [campo]: evento.target.value, pagina: 1 }));

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <select className="form-select" value={filtros.estado} onChange={cambiarFiltro("estado")}>
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_SERVICIO).map(([valor, { texto }]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <select className="form-select" value={filtros.tipo} onChange={cambiarFiltro("tipo")}>
              <option value="">Todos los tipos</option>
              {TIPOS_SERVICIO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {NOMBRE_TIPO[tipo]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Servicio</th>
                <th>Dueño</th>
                <th>Prestador</th>
                <th>Monto</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {datos === null && (
                <tr>
                  <td colSpan="7" className="text-center text-secondary py-4">
                    Cargando...
                  </td>
                </tr>
              )}

              {datos !== null && datos.servicios.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-secondary py-4">
                    Sin resultados.
                  </td>
                </tr>
              )}

              {(datos?.servicios || []).map((servicio) => {
                const estado = ESTADOS_SERVICIO[servicio.estado] || { texto: servicio.estado, clase: "text-bg-secondary" };

                return (
                  <tr key={servicio.id}>
                    <td>{servicio.id}</td>
                    <td>
                      {servicio.tipo || "Servicio"}
                      {servicio.mascotaNombre ? ` · ${servicio.mascotaNombre}` : ""}
                      <div className="small text-secondary">{formatearFecha(servicio.horaProgramada)}</div>
                    </td>
                    <td>
                      <Persona usuario={servicio.dueno} />
                    </td>
                    <td>
                      <Persona usuario={servicio.prestador} />
                    </td>
                    <td>
                      {formatearMonto(servicio.monto)}
                      <div className="small text-secondary">
                        {servicio.pago ? `Pago ${servicio.pago.estado}` : "Sin pago"}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                    </td>
                    <td className="text-end text-nowrap">
                      {!["programado", "rechazado"].includes(servicio.estado) && (
                        <Link
                          to={`${RUTAS.chat}?servicioId=${servicio.id}`}
                          className="btn btn-outline-secondary btn-sm me-1"
                          title="Ver el chat del servicio"
                        >
                          <i className="bi bi-chat-dots"></i>
                        </Link>
                      )}
                      {ESTADOS_CANCELABLES.includes(servicio.estado) && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setCancelando(servicio)}
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            disabled={!datos || datos.pagina <= 1}
            onClick={() => setFiltros((anterior) => ({ ...anterior, pagina: anterior.pagina - 1 }))}
          >
            Anterior
          </button>
          <span className="small text-secondary">
            {datos ? `Página ${datos.pagina} de ${datos.totalPaginas} (${datos.total})` : ""}
          </span>
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            disabled={!datos || datos.pagina >= datos.totalPaginas}
            onClick={() => setFiltros((anterior) => ({ ...anterior, pagina: anterior.pagina + 1 }))}
          >
            Siguiente
          </button>
        </div>
      </div>

      {cancelando && (
        <ModalMotivo
          titulo={`Cancelar el servicio #${cancelando.id}`}
          descripcion="Se reembolsa el pago al dueño y las dos partes reciben una notificación con el motivo."
          minimo={5}
          valorInicial="Cancelado por administración"
          textoConfirmar="Cancelar y reembolsar"
          alCerrar={() => setCancelando(null)}
          alConfirmar={cancelar}
        />
      )}
    </div>
  );
}
