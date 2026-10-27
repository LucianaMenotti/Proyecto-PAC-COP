export default function ComprobantePago({
  reserva,
  transaccion,
  montoFormateado,
  fechaTexto,
  alImprimir,
  alDescargar
}) {
  return (
    <section>
      <div className="comprobante-ticket mx-auto p-4 rounded-3 mb-4 shadow-sm" id="comprobante">
        <div className="text-center pb-3 mb-3 border-bottom border-line border-dashed">
          <h4 className="display-title text-brand fw-bold mb-0">Pac-Cop</h4>
          <p className="text-secondary small mb-0">Comprobante de pago</p>
        </div>

        <dl className="row g-2 small mb-3">
          <dt className="col-6 text-secondary fw-normal">N.º de transacción</dt>
          <dd className="col-6 text-end fw-semibold text-dark mb-1">{transaccion.id}</dd>

          <dt className="col-6 text-secondary fw-normal">Fecha de pago</dt>
          <dd className="col-6 text-end fw-semibold text-dark mb-1">{fechaTexto}</dd>

          <dt className="col-6 text-secondary fw-normal">Servicio</dt>
          <dd className="col-6 text-end fw-semibold text-dark mb-1">{reserva.tipo}</dd>

          <dt className="col-6 text-secondary fw-normal">Prestador</dt>
          <dd className="col-6 text-end fw-semibold text-dark mb-1">{reserva.prestador}</dd>

          <dt className="col-6 text-secondary fw-normal">Método</dt>
          <dd className="col-6 text-end fw-semibold text-dark mb-1">{transaccion.metodo}</dd>

          <dt className="col-6 text-secondary fw-normal">Estado</dt>
          <dd className="col-6 text-end fw-semibold text-dark mb-0">{transaccion.estado}</dd>
        </dl>

        <div className="d-flex justify-content-between align-items-baseline pt-3 border-top border-line border-dashed">
          <span className="display-title fw-bold text-dark">Total pagado</span>
          <span className="display-title fw-bold text-accent fs-4">${montoFormateado}</span>
        </div>
      </div>

      <div className="d-flex gap-2 justify-content-center">
        <button
          type="button"
          className="btn btn-brand-soft text-brand fw-semibold px-3 py-2 rounded-3"
          onClick={alImprimir}
        >
          <i className="bi bi-printer me-1"></i> Imprimir
        </button>

        <button
          type="button"
          className="btn btn-accent fw-semibold px-3 py-2 rounded-3 shadow-sm"
          onClick={alDescargar}
        >
          <i className="bi bi-download me-1"></i> Descargar comprobante
        </button>
      </div>
    </section>
  );
}
