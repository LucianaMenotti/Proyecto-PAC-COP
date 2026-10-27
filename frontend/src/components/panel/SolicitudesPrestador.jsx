import { useState } from "react";
import { apiJson } from "../../config/api";

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "Fecha no disponible";
  }

  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  });
};

export default function SolicitudesPrestador({ solicitudes, alActualizar }) {
  const [abierto, setAbierto] = useState(false);

  const gestionar = async (id, accion) => {
    if (!confirm(`¿Seguro que querés ${accion} esta reserva?`)) {
      return;
    }

    try {
      const { ok, datos } = await apiJson(`/api/servicios/${id}/${accion}`, { method: "POST" });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo gestionar la reserva");
      }

      alert(datos.mensaje);

      await alActualizar();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container mb-4">
      <div className="card border-0 shadow-sm">
        <button
          type="button"
          className="btn btn-light w-100 text-start border-0 p-4"
          aria-expanded={abierto}
          aria-controls="listaSolicitudes"
          onClick={() => setAbierto((valor) => !valor)}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-1">Solicitudes ({solicitudes.length})</h4>
              <small className="text-secondary">Reservas pendientes para aceptar o rechazar</small>
            </div>

            <span className="fs-4">▾</span>
          </div>
        </button>

        <div id="listaSolicitudes" className={`collapse${abierto ? " show" : ""}`}>
          <div className="card-body pt-0">
            {solicitudes.length === 0 ? (
              <div className="text-center py-4 text-secondary">
                <p className="mb-0">No hay solicitudes pendientes.</p>
              </div>
            ) : (
              solicitudes.map((servicio) => (
                <div className="border rounded p-3 mb-3" key={servicio.id}>
                  <div className="row g-3 align-items-center">
                    <div className="col-md-8">
                      <h5 className="fw-bold mb-2">Nueva reserva</h5>

                      <p className="mb-1">
                        <strong>{servicio.tipo}</strong> para {servicio.mascota}
                      </p>

                      <p className="mb-1 text-secondary">{servicio.prestador}</p>

                      <p className="mb-1">
                        <strong>Precio:</strong> ${servicio.monto}
                      </p>

                      <p className="mb-0 text-secondary">
                        {formatearFecha(servicio.horaProgramada)}
                      </p>
                    </div>

                    <div className="col-md-4">
                      <div className="d-flex gap-2 justify-content-md-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => gestionar(servicio.id, "rechazar")}
                        >
                          Rechazar
                        </button>

                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={() => gestionar(servicio.id, "aceptar")}
                        >
                          Aceptar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
