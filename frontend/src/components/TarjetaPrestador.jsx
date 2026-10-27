import { obtenerServicios } from "../helpers/prestadores";

export default function TarjetaPrestador({ prestador, alReservar }) {
  const servicios = obtenerServicios(prestador.servicios);

  const textoServicios =
    servicios.length > 0
      ? servicios
          .map((servicio) =>
            prestador.preciosServicios?.[servicio]
              ? `${servicio} ($${prestador.preciosServicios[servicio]})`
              : servicio
          )
          .join(", ")
      : "Sin servicios registrados";

  return (
    <div className="col-md-6 col-lg-4">
      <div className="card h-100 shadow-sm border-0">
        <div className="card-body">
          <h5 className="card-title fw-bold">
            {prestador.nombre} {prestador.apellido}
          </h5>

          <p className="card-text">
            <strong>Zona:</strong> {prestador.zona}
          </p>

          <p className="card-text">
            <strong>Servicios:</strong> {textoServicios}
          </p>

          <p className="card-text">
            <strong>Calificación:</strong> {prestador.calificacion || 0}
          </p>

          <button className="btn btn-primary w-100" onClick={() => alReservar(prestador.id)}>
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
}
