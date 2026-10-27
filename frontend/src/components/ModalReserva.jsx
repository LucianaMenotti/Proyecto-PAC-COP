import { useEffect, useState } from "react";
import { enviarJson } from "../config/api";
import { precioDe } from "../helpers/prestadores";

export default function ModalReserva({
  prestador,
  serviciosConPrecio,
  mascotas,
  alCerrar,
  alCrear
}) {
  const [servicio, setServicio] = useState(serviciosConPrecio[0] || "");
  const [mascotaId, setMascotaId] = useState(mascotas[0] ? String(mascotas[0].id) : "");
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const manejarTecla = (evento) => {
      if (evento.key === "Escape") {
        alCerrar();
      }
    };

    document.addEventListener("keydown", manejarTecla);

    return () => document.removeEventListener("keydown", manejarTecla);
  }, [alCerrar]);

  const precio = precioDe(prestador, servicio);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");

    const { ok, datos } = await enviarJson("/api/servicios", "POST", {
      providerId: prestador.id,
      tipo: servicio,
      mascotaId: Number(mascotaId),
      horaProgramada: new Date(fecha).toISOString()
    });

    if (!ok) {
      setError(datos.mensaje || "No se pudo crear la reserva");
      return;
    }

    alCrear();
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog">
          <form className="modal-content" onSubmit={enviar}>
            <div className="modal-header">
              <h5 className="modal-title">
                {`Reservar con ${prestador.nombre} ${prestador.apellido}`}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={alCerrar}
              ></button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label" htmlFor="reservaServicio">
                  Servicio
                </label>
                <select
                  id="reservaServicio"
                  className="form-select"
                  required
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                >
                  {serviciosConPrecio.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="reservaMascota">
                  Mascota
                </label>
                <select
                  id="reservaMascota"
                  className="form-select"
                  required
                  value={mascotaId}
                  onChange={(e) => setMascotaId(e.target.value)}
                >
                  {mascotas.map((mascota) => (
                    <option key={mascota.id} value={mascota.id}>
                      {mascota.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="reservaFecha">
                  Fecha y hora
                </label>
                <input
                  type="datetime-local"
                  id="reservaFecha"
                  className="form-control"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              <p className="mb-0">
                Precio: <strong>{precio > 0 ? `$${precio}` : "Sin precio cargado"}</strong>
              </p>

              {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={alCerrar}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Confirmar reserva
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
