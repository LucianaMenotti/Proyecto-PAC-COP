import { useState } from "react";
import { enviarJson } from "../../config/api";
import { leerLista, leerPrecios } from "../../helpers/listas";
import { NOMBRE_SERVICIO, obtenerPrecioMinimo } from "../../helpers/niveles";

const FORMULARIO_INICIAL = {
  servicio: "paseo",
  duracion: "30",
  mascotas: "1",
  precio: ""
};

export default function TabPublicar({ activa, nivelActual, misServicios, misPrecios, alGuardar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [errorPrecio, setErrorPrecio] = useState(false);

  const precioMinimo = obtenerPrecioMinimo(formulario.servicio, nivelActual);

  const cambiar = (campo) => (evento) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: evento.target.value }));
  };

  const cambiarServicio = (evento) => {
    setFormulario((anterior) => ({ ...anterior, servicio: evento.target.value }));
    setErrorPrecio(false);
  };

  const usarSugerido = () => {
    setFormulario((anterior) => ({ ...anterior, precio: String(precioMinimo) }));
    setErrorPrecio(false);
  };

  const publicar = async (evento) => {
    evento.preventDefault();

    const servicio = NOMBRE_SERVICIO[formulario.servicio];
    const precio = Number(formulario.precio);

    if (!precio || precio < precioMinimo) {
      setErrorPrecio(true);
      return;
    }

    setErrorPrecio(false);

    const nuevosServicios = misServicios.includes(servicio)
      ? misServicios
      : [...misServicios, servicio];
    const nuevosPrecios = { ...misPrecios, [servicio]: precio };

    try {
      const { ok, datos } = await enviarJson("/api/users/me/servicios", "PUT", {
        servicios: nuevosServicios,
        preciosServicios: nuevosPrecios
      });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo guardar");
      }

      alGuardar(leerLista(datos.usuario.servicios), leerPrecios(datos.usuario.preciosServicios));
      setFormulario(FORMULARIO_INICIAL);
      alert("Servicio publicado correctamente.");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <section
      className={`tab-pane fade${activa ? " show active" : ""}`}
      id="publicar"
      role="tabpanel"
      aria-labelledby="tab-publicar"
    >
      <div className="panel-section-header mb-4">
        <h2 className="fw-bold">Publicá un servicio nuevo</h2>
        <p className="text-secondary mb-0">
          Te sugerimos un rango de precio según tu nivel y el tipo de servicio.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card panel-card h-100">
            <div className="card-body p-4">
              <form onSubmit={publicar}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="servicioSelect">
                    Tipo de servicio
                  </label>
                  <select
                    id="servicioSelect"
                    className="form-select"
                    value={formulario.servicio}
                    onChange={cambiarServicio}
                  >
                    <option value="paseo">Paseo</option>
                    <option value="guarderia">Guardería</option>
                    <option value="traslado">Traslado</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="duracionInput">
                    Duración
                  </label>
                  <input
                    type="number"
                    id="duracionInput"
                    className="form-control"
                    min="1"
                    value={formulario.duracion}
                    onChange={cambiar("duracion")}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="mascotasInput">
                    Cantidad de mascotas
                  </label>
                  <input
                    type="number"
                    id="mascotasInput"
                    className="form-control"
                    min="1"
                    max="5"
                    value={formulario.mascotas}
                    onChange={cambiar("mascotas")}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold" htmlFor="precioInput">
                    Tu precio
                  </label>

                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      id="precioInput"
                      className="form-control"
                      min="0"
                      step="100"
                      required
                      placeholder={precioMinimo}
                      value={formulario.precio}
                      onChange={cambiar("precio")}
                    />
                  </div>

                  {errorPrecio && (
                    <div className="text-danger small mt-2">
                      El precio está por debajo del mínimo permitido.
                    </div>
                  )}
                </div>

                <div className="d-grid gap-2">
                  <button type="button" className="btn btn-turquesa" onClick={usarSugerido}>
                    Usar precio sugerido
                  </button>

                  <button type="submit" className="btn btn-pac">
                    Publicar servicio
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="suggestion-card">
            <h5 className="fw-bold mb-2">Rango sugerido</h5>
            <p className="text-secondary mb-4">Precio recomendado para tu nivel.</p>

            <div className="range-box mb-4">
              <div className="range-progress"></div>
            </div>

            <div className="row text-center g-3">
              <div className="col-4">
                <small className="text-secondary d-block">Mínimo</small>
                <strong className="d-block mt-1">$5000</strong>
              </div>

              <div className="col-4">
                <small className="text-secondary d-block">Promedio</small>
                <strong className="d-block mt-1">$7000</strong>
              </div>

              <div className="col-4">
                <small className="text-secondary d-block">Máximo</small>
                <strong className="d-block mt-1">$10000</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
