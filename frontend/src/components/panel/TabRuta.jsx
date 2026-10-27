import { Link } from "react-router-dom";
import { RUTAS } from "../../config/rutas";

const PARADAS = [
  {
    numero: 1,
    titulo: "Toby · Paseo 30 min",
    lugar: "Barrio San Miguel",
    salida: "08:35",
    servicio: "09:00",
    alerta: false
  },
  {
    numero: 2,
    titulo: "Kira · Paseo 45 min",
    lugar: "Barrio Namqom",
    salida: "09:50",
    servicio: "10:15",
    alerta: false
  },
  {
    numero: 3,
    titulo: "Rocky · Paseo 30 min",
    lugar: "Centro",
    salida: "11:05",
    servicio: "11:30",
    alerta: true
  }
];

export default function TabRuta({ activa }) {
  return (
    <section
      className={`tab-pane fade${activa ? " show active" : ""}`}
      id="ruta"
      role="tabpanel"
      aria-labelledby="tab-ruta"
    >
      <div className="panel-section-header mb-4">
        <h2 className="fw-bold">Tu recorrido de hoy</h2>
        <p className="text-secondary mb-0">Orden sugerido según cercanía y horario.</p>

        <Link to={RUTAS.seguimiento} className="btn btn-primary rounded-pill mt-3">
          <i className="bi bi-geo-alt me-1"></i> Abrir seguimiento GPS
        </Link>
      </div>

      <div className="d-grid gap-3">
        {PARADAS.map((parada) => (
          <div className={`route-card${parada.alerta ? " route-alert" : ""}`} key={parada.numero}>
            <span className="route-number">{parada.numero}</span>

            <div>
              <strong>{parada.titulo}</strong>
              <p className="text-secondary mb-1">{parada.lugar}</p>

              <small>
                Salida sugerida: <strong>{parada.salida}</strong> — Servicio {parada.servicio}
              </small>

              {parada.alerta && (
                <p className="text-danger small fw-semibold mb-0 mt-2">
                  Salí en los próximos minutos para llegar a tiempo.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
