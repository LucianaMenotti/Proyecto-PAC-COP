import { leerLista, leerPrecios } from "../helpers/listas";
import { formatearResumenPrecio } from "../helpers/precios";
import { obtenerServicios } from "../helpers/prestadores";

export default function TarjetaPrestador({ prestador, alReservar, alVerResenas }) {
  const servicios = obtenerServicios(prestador.servicios);
  const precios = leerPrecios(prestador.preciosServicios);
  const tamanos = leerLista(prestador.tamanosAceptados);

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
            <strong>Servicios:</strong>{" "}
            {servicios.length > 0
              ? servicios
                  .map((servicio) => {
                    const resumen = formatearResumenPrecio(precios[servicio], "");

                    return resumen ? `${servicio} (${resumen})` : servicio;
                  })
                  .join(", ")
              : "Sin servicios registrados"}
          </p>

          <p className="card-text">
            <strong>Acepta:</strong> {tamanos.length > 0 ? tamanos.join(", ") : "Todos los tamaños"}
          </p>

          <p className="card-text">
            <strong>Calificación:</strong> {prestador.calificacion || 0}
          </p>

          <button className="btn btn-primary w-100" onClick={() => alReservar(prestador.id)}>
            Reservar
          </button>

          <button
            className="btn btn-outline-secondary w-100 mt-2"
            onClick={() => alVerResenas(prestador)}
          >
            Ver reseñas ({prestador.resenas || 0})
          </button>
        </div>
      </div>
    </div>
  );
}
