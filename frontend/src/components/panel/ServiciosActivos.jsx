import { useNavigate } from "react-router-dom";
import { RUTAS } from "../../config/rutas";

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "Fecha no disponible";
  }

  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  });
};

export default function ServiciosActivos({ servicios }) {
  const navegar = useNavigate();

  return (
    <div className="container mb-4">
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="mb-3">
            <h4 className="fw-bold mb-1">Mis servicios activos</h4>
            <small className="text-secondary">Reservas aceptadas y servicios en curso</small>
          </div>

          {servicios.length === 0 ? (
            <div className="text-center py-3 text-secondary">
              No tenés servicios activos en este momento.
            </div>
          ) : (
            servicios.map((servicio) => (
              <div className="border rounded p-3 mb-3" key={servicio.id}>
                <div className="row g-3 align-items-center">
                  <div className="col-md-8">
                    <h5 className="fw-bold mb-2">{servicio.tipo}</h5>

                    <p className="mb-1">
                      <strong>Mascota:</strong>{" "}
                      {servicio.mascota || servicio.mascotaNombre || "Sin nombre"}
                    </p>

                    <p className="mb-1">
                      <strong>Estado:</strong>{" "}
                      {servicio.estado === "en-curso" ? "En curso" : "Aceptado"}
                    </p>

                    <p className="mb-0 text-secondary">{formatearFecha(servicio.horaProgramada)}</p>
                  </div>

                  <div className="col-md-4 text-md-end">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navegar(`${RUTAS.chat}?servicioId=${servicio.id}`)}
                    >
                      Abrir chat
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
