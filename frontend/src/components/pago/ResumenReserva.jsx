export default function ResumenReserva({ reserva, montoFormateado }) {
  const fecha = new Date(reserva.horaProgramada).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <section
      className="card border-line shadow-sm mb-4 rounded-4"
      aria-label="Resumen de la reserva"
    >
      <div className="card-body p-3 p-md-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="resumen-avatar-wrap bg-brand-soft rounded-circle d-flex align-items-center justify-content-center text-brand">
            <i className="bi bi-person-fill fs-4"></i>
          </div>

          <div>
            <h6 className="mb-0 fw-bold text-dark">{reserva.prestador}</h6>
            <p className="mb-0 text-secondary small">{reserva.tipo}</p>
          </div>
        </div>

        <dl className="row mb-0 g-3 g-md-4 text-md-end">
          <div className="col-auto">
            <dt className="small text-secondary fw-normal">Fecha</dt>
            <dd className="fw-semibold mb-0">{fecha}</dd>
          </div>

          <div className="col-auto">
            <dt className="small text-secondary fw-normal">Mascota</dt>
            <dd className="fw-semibold mb-0">{reserva.mascota}</dd>
          </div>

          <div className="col-auto">
            <dt className="small text-secondary fw-normal">Total</dt>
            <dd className="fw-bold fs-5 text-accent display-title mb-0">${montoFormateado}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
