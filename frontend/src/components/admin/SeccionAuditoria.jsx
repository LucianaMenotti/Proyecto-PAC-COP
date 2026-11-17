import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDatos } from "../../config/api";
import { RUTAS } from "../../config/rutas";
import { TEXTO_ACCIONES, formatearFecha } from "../../helpers/admin";

const LIMITE = 15;

const ENTIDADES = {
  usuario: "Usuario",
  servicio: "Servicio",
  resena: "Reseña",
  reporte: "Reporte"
};

function Entidad({ accion }) {
  const texto = `${ENTIDADES[accion.entidad] || accion.entidad} #${accion.entidadId ?? "-"}`;

  return accion.entidad === "usuario" && accion.entidadId ? (
    <Link to={`${RUTAS.adminLegajo}/${accion.entidadId}`} className="text-decoration-none">
      {texto}
    </Link>
  ) : (
    texto
  );
}

// Registro de decisiones tomadas desde el panel: quién, cuándo, sobre qué y por qué.
// GET /api/admin/acciones?pagina=&limite=&entidad=
export default function SeccionAuditoria({ alAvisar }) {
  const [filtros, setFiltros] = useState({ pagina: 1, entidad: "" });
  const [datos, setDatos] = useState(null);

  const cargar = useCallback(async () => {
    const parametros = new URLSearchParams({ pagina: filtros.pagina, limite: LIMITE });

    if (filtros.entidad) parametros.set("entidad", filtros.entidad);

    try {
      setDatos(await apiDatos(`/api/admin/acciones?${parametros}`));
    } catch (error) {
      alAvisar(error.message, "danger");
      setDatos((anterior) => anterior ?? { acciones: [], pagina: 1, totalPaginas: 1, total: 0 });
    }
  }, [filtros, alAvisar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <select
              className="form-select"
              value={filtros.entidad}
              onChange={(evento) => setFiltros({ entidad: evento.target.value, pagina: 1 })}
            >
              <option value="">Todas las entidades</option>
              {Object.entries(ENTIDADES).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Sobre</th>
                <th>Motivo</th>
                <th>Administrador</th>
              </tr>
            </thead>
            <tbody>
              {datos === null && (
                <tr>
                  <td colSpan="5" className="text-center text-secondary py-4">
                    Cargando...
                  </td>
                </tr>
              )}

              {datos !== null && datos.acciones.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-secondary py-4">
                    Todavía no hay acciones registradas.
                  </td>
                </tr>
              )}

              {(datos?.acciones || []).map((accion) => (
                <tr key={accion.id}>
                  <td className="text-nowrap small">{formatearFecha(accion.fecha)}</td>
                  <td>{TEXTO_ACCIONES[accion.accion] || accion.accion}</td>
                  <td>
                    <Entidad accion={accion} />
                  </td>
                  <td className="small">{accion.motivo || <span className="text-secondary">-</span>}</td>
                  <td className="small">{accion.admin}</td>
                </tr>
              ))}
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
    </div>
  );
}
