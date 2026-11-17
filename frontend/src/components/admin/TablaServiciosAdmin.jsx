import { useCallback, useEffect, useState } from "react";
import { apiDatos, enviarDatos } from "../../config/api";

const LIMITE = 10;

// Mismos estados que acepta POST /api/admin/servicios/:id/cancelar
const ESTADOS_CANCELABLES = ["programado", "aceptado", "en-curso"];

const CLASES_ESTADO = {
  programado: "text-bg-secondary",
  aceptado: "text-bg-info",
  "en-curso": "text-bg-primary",
  finalizado: "text-bg-success",
  cancelado: "text-bg-dark",
  rechazado: "text-bg-danger"
};

const nombreUsuario = (usuario) => (usuario ? `${usuario.nombre} ${usuario.apellido}` : "-");

// GET /api/admin/servicios?pagina=&limite=&estado=  |  POST /api/admin/servicios/:id/cancelar { motivo }
export default function TablaServiciosAdmin({ alAvisar, alCambiar }) {
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState("");
  const [datos, setDatos] = useState(null);

  const cargar = useCallback(async () => {
    const parametros = new URLSearchParams({ pagina, limite: LIMITE });

    if (estado) parametros.set("estado", estado);

    try {
      setDatos(await apiDatos(`/api/admin/servicios?${parametros}`));
    } catch (error) {
      alAvisar(error.message, "danger");
      setDatos((anterior) => anterior ?? { servicios: [], pagina: 1, totalPaginas: 1, total: 0 });
    }
  }, [pagina, estado, alAvisar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cancelar = async (id) => {
    if (!window.confirm(`¿Cancelar y reembolsar el servicio #${id}?`)) {
      return;
    }

    try {
      await enviarDatos(`/api/admin/servicios/${id}/cancelar`, "POST", {
        motivo: "Cancelado por administración"
      });
      alAvisar("Servicio cancelado y reembolsado");
      await cargar();
      alCambiar();
    } catch (error) {
      alAvisar(error.message, "danger");
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <select
              className="form-select"
              value={estado}
              onChange={(evento) => {
                setEstado(evento.target.value);
                setPagina(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="programado">Programado</option>
              <option value="aceptado">Aceptado</option>
              <option value="en-curso">En curso</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
              <option value="rechazado">Rechazado</option>
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

              {(datos?.servicios || []).map((servicio) => (
                <tr key={servicio.id}>
                  <td>{servicio.id}</td>
                  <td>
                    {servicio.tipo || "Servicio"}
                    {servicio.mascotaNombre ? ` · ${servicio.mascotaNombre}` : ""}
                  </td>
                  <td>{nombreUsuario(servicio.dueno)}</td>
                  <td>{nombreUsuario(servicio.prestador)}</td>
                  <td>${Number(servicio.monto || 0).toLocaleString("es-AR")}</td>
                  <td>
                    <span className={`badge ${CLASES_ESTADO[servicio.estado] || "text-bg-secondary"}`}>
                      {servicio.estado}
                    </span>
                  </td>
                  <td className="text-end">
                    {ESTADOS_CANCELABLES.includes(servicio.estado) && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => cancelar(servicio.id)}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
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
            onClick={() => setPagina((valor) => valor - 1)}
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
            onClick={() => setPagina((valor) => valor + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
