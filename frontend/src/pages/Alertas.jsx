import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RUTAS } from "../config/rutas";
import { borrarGuardado, leerGuardado } from "../helpers/almacenamiento";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosAlertas from "../config/estilos/alertas";

const leerMascota = () => {
  const guardados = leerGuardado("datosMascota");

  if (!guardados) {
    return null;
  }

  try {
    return JSON.parse(guardados);
  } catch {
    return null;
  }
};

export default function Alertas() {
  const navegar = useNavigate();
  const [mascota] = useState(leerMascota);
  const [decision, setDecision] = useState("");
  const [motivo, setMotivo] = useState("");

  useBootstrap();
  useEstilos("alertas", estilosAlertas);

  useEffect(() => {
    if (!mascota) {
      alert("No se encontraron datos. Volviendo al formulario del dueño.");
      navegar(RUTAS.fichaSalud);
    }
  }, [mascota, navegar]);

  if (!mascota) {
    return null;
  }

  const tieneAlerta = Boolean(mascota.alertaDueño && mascota.alertaDueño.trim() !== "");

  const enviar = (evento) => {
    evento.preventDefault();

    if (decision === "si") {
      alert("¡Has ACEPTADO el servicio! El dueño será notificado.");
    } else if (decision === "no") {
      if (motivo.trim() !== "") {
        alert(`Has RECHAZADO el servicio.\nMotivo registrado: ${motivo}`);
      } else {
        alert("Has RECHAZADO el servicio. No se especificó motivo.");
      }
    }

    borrarGuardado("datosMascota");
    navegar(RUTAS.fichaSalud);
  };

  return (
    <>
      <header className="header-app text-white text-center py-3 sticky-top">
        <h2 className="mb-0 fw-bold">PANEL DE ALERTAS Y DECISIÓN</h2>
        <p className="mb-0 opacity-75">Uso exclusivo para el prestador del servicio</p>
      </header>

      <div className="container my-4">
        <div className="row g-4">
          <div className="col-lg-6">
            <div className={`card card-custom h-100${tieneAlerta ? " card-alert-danger" : ""}`}>
              <div
                className="card-header border-0 fw-bold"
                style={tieneAlerta ? undefined : { backgroundColor: "#0f766e" }}
              >
                Mensaje de Alerta del Dueño
              </div>

              <div className="card-body d-flex align-items-center">
                <p
                  id="mostrar-alerta"
                  className="fs-5 fw-bold mb-0"
                  style={tieneAlerta ? undefined : { color: "#0f766e" }}
                >
                  {tieneAlerta
                    ? `"${mascota.alertaDueño}"`
                    : "El dueño no reportó alertas adicionales."}
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card card-custom h-100">
              <div className="card-header header-teal text-white fw-bold">
                Ficha Clínica de la Mascota
              </div>

              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>Raza:</strong> {mascota.raza}
                </li>
                <li className="list-group-item">
                  <strong>Edad:</strong> {mascota.edad} años
                </li>
                <li className="list-group-item">
                  <strong>Condición Médica:</strong> {mascota.condicion}
                </li>
                <li className="list-group-item">
                  <strong>Alergias:</strong> {mascota.alergias}
                </li>
                <li className="list-group-item">
                  <strong>Vacunación:</strong> {mascota.vacunacion}
                </li>
                <li className="list-group-item">
                  <strong>Reactividad:</strong> {mascota.reactividad}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card card-custom mt-4">
          <div className="card-header header-teal text-white fw-bold fs-5">
            Decisión del Prestador
          </div>

          <div className="card-body p-4">
            <form onSubmit={enviar}>
              <div className="mb-4">
                <label className="form-label fw-bold d-block fs-5 label-custom">
                  ¿Aceptas tomar este servicio?
                </label>

                <div className="form-check form-check-inline mt-2">
                  <input
                    className="form-check-input custom-radio"
                    type="radio"
                    name="decision"
                    id="acepta-si"
                    value="si"
                    required
                    checked={decision === "si"}
                    onChange={() => setDecision("si")}
                  />
                  <label className="form-check-label fs-5" htmlFor="acepta-si">
                    Sí, acepto el servicio
                  </label>
                </div>

                <div className="form-check form-check-inline mt-2">
                  <input
                    className="form-check-input custom-radio"
                    type="radio"
                    name="decision"
                    id="acepta-no"
                    value="no"
                    checked={decision === "no"}
                    onChange={() => setDecision("no")}
                  />
                  <label className="form-check-label fs-5" htmlFor="acepta-no">
                    No, rechazo el servicio
                  </label>
                </div>
              </div>

              {decision === "no" && (
                <div className="mb-4">
                  <label htmlFor="motivo-rechazo" className="form-label fw-bold text-danger">
                    Motivo del rechazo (Opcional):
                  </label>
                  <textarea
                    className="form-control input-danger"
                    id="motivo-rechazo"
                    rows="2"
                    placeholder="Si lo deseas, explica brevemente por qué no puedes tomar este servicio..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  ></textarea>
                </div>
              )}

              <div className="form-check mb-4">
                <input
                  className="form-check-input custom-checkbox"
                  type="checkbox"
                  id="checkSeguridad"
                  required
                />
                <label className="form-check-label fw-bold label-custom" htmlFor="checkSeguridad">
                  Confirmo que he leído la ficha clínica y las alertas correspondientes antes de
                  tomar esta decisión.
                </label>
              </div>

              <button
                type="submit"
                className={`btn ${decision === "no" ? "btn-danger-custom" : "btn-teal"} w-100 py-3 fw-bold fs-5 transition-btn`}
              >
                {decision === "no"
                  ? "Confirmar y Rechazar Servicio"
                  : decision === "si"
                    ? "Confirmar y Aceptar Servicio"
                    : "Confirmar Decisión"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
