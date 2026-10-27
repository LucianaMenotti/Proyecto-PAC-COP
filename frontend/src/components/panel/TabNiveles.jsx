import { PRECIOS } from "../../helpers/niveles";

export default function TabNiveles({ activa, completados, nivelActual, calificacion }) {
  const faltan = Math.max(0, 50 - completados);
  const porcentaje = Math.min(100, Math.round((completados / 50) * 100));

  const columna = (nivel, titulo, detalle) => (
    <div className={`col-4${nivel === nivelActual ? " nivel-actual" : ""}`}>
      <strong>{titulo}</strong>
      <small className="d-block text-secondary">{detalle}</small>
    </div>
  );

  return (
    <section
      className={`tab-pane fade${activa ? " show active" : ""}`}
      id="niveles"
      role="tabpanel"
      aria-labelledby="tab-niveles"
    >
      <div className="panel-section-header mb-4">
        <h2 className="fw-bold">Tu nivel determina tu piso, no tu techo</h2>
        <p className="text-secondary mb-0">
          A medida que sumás servicios completados y buena calificación, subís de nivel. Cada nivel
          tiene un precio mínimo por servicio.
        </p>
      </div>

      <div className="card panel-card mb-4">
        <div className="card-body p-4">
          <div className="progress nivel-progress mb-3">
            <div
              className="progress-bar progreso"
              role="progressbar"
              style={{ width: `${porcentaje}%` }}
              aria-valuenow={porcentaje}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>

          <div className="row text-center g-3">
            {columna("nuevo", "Nuevo", "0–9 servicios")}
            {columna("establecido", "Establecido", "10–49 · +4★")}
            {columna("top", "Top", "50+ · +4.5★")}
          </div>

          <p className="text-secondary mt-4 mb-0">
            Llevás <strong>{completados} servicios</strong> con{" "}
            <strong>{calificacion ?? 0}★</strong> de promedio.
            {faltan > 0 ? (
              <>
                {" "}
                Te faltan <strong>{faltan} servicios</strong> para alcanzar Top.
              </>
            ) : (
              " Ya estás en el nivel Top."
            )}
          </p>
        </div>
      </div>

      <div className="card panel-card">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Precio mínimo por servicio</h5>

          <div className="table-responsive">
            <table className="table align-middle mb-3">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Nuevo</th>
                  <th>Establecido</th>
                  <th>Top</th>
                </tr>
              </thead>

              <tbody>
                {Object.values(PRECIOS).map((servicio) => (
                  <tr key={servicio.nombre}>
                    <td className="fw-semibold">{servicio.nombre}</td>
                    <td>${servicio.nuevo}</td>
                    <td className="fw-bold text-success">${servicio.establecido}</td>
                    <td>${servicio.top}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="small text-secondary mb-0">
            El precio mínimo funciona como piso. Podés cobrar más, pero nunca menos.
          </p>
        </div>
      </div>
    </section>
  );
}
