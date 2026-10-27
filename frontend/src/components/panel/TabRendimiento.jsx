export default function TabRendimiento({ activa }) {
  return (
    <section
      className={`tab-pane fade${activa ? " show active" : ""}`}
      id="rendimiento"
      role="tabpanel"
      aria-labelledby="tab-rendimiento"
    >
      <div className="panel-section-header mb-4">
        <h2 className="fw-bold">Cómo viene tu rendimiento</h2>
        <p className="text-secondary mb-0">
          Estas métricas ayudan a definir tus recomendaciones de precio.
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card metric-card h-100">
            <div className="card-body text-center p-4">
              <div className="metric-number">18</div>
              <div className="text-secondary">Servicios completados</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card metric-card h-100">
            <div className="card-body text-center p-4">
              <div className="metric-number">
                4.6<span>★</span>
              </div>
              <div className="text-secondary">Calificación promedio</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card metric-card h-100">
            <div className="card-body text-center p-4">
              <div className="metric-number">1</div>
              <div className="text-secondary">Reservas últimas 2 semanas</div>
            </div>
          </div>
        </div>
      </div>

      <div className="alert recomendacion mb-4">
        <h5 className="fw-bold">Te recomendamos mantener tu precio actual</h5>
        <p className="mb-3">
          Tu calificación es alta (4.6★), pero tuviste pocas reservas recientemente. Antes de subir
          el precio, esperá a validar que la demanda se sostenga.
        </p>
        <button className="btn btn-pac">Mantener precio actual</button>
      </div>

      <div className="card panel-card">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Evolución de tu precio</h5>

          <div className="chart-placeholder mb-2">
            <div className="chart-line"></div>
          </div>

          <div className="d-flex justify-content-between text-secondary small">
            <span>Hace 6 quincenas</span>
            <span>Hoy</span>
          </div>
        </div>
      </div>
    </section>
  );
}
