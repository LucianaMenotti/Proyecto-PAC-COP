export default function FormularioTarjeta({ valores, errores, alCambiar, validado }) {
  const clase = (campo) => {
    if (!validado) {
      return "form-control";
    }

    return `form-control ${errores[campo] ? "is-invalid" : "is-valid"}`;
  };

  return (
    <form noValidate onSubmit={(evento) => evento.preventDefault()}>
      <div className="mb-3">
        <label htmlFor="numTarjeta" className="form-label small fw-medium text-secondary">
          Número de tarjeta
        </label>

        <div className="input-group has-validation">
          <span className="input-group-text bg-light border-line">
            <i className="bi bi-credit-card-2-front"></i>
          </span>
          <input
            type="text"
            className={clase("numero")}
            id="numTarjeta"
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            maxLength="19"
            required
            value={valores.numero}
            onChange={(e) => alCambiar("numero", e.target.value)}
          />
          <div className="invalid-feedback">{errores.numero}</div>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="nombreTitular" className="form-label small fw-medium text-secondary">
          Nombre del titular
        </label>
        <input
          type="text"
          className={clase("nombre")}
          id="nombreTitular"
          placeholder="Como figura en la tarjeta"
          required
          value={valores.nombre}
          onChange={(e) => alCambiar("nombre", e.target.value)}
        />
        <div className="invalid-feedback">{errores.nombre}</div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-7 col-sm-8">
          <label htmlFor="vencTarjeta" className="form-label small fw-medium text-secondary">
            Vencimiento
          </label>
          <input
            type="text"
            className={clase("vencimiento")}
            id="vencTarjeta"
            inputMode="numeric"
            placeholder="MM/AA"
            maxLength="5"
            required
            value={valores.vencimiento}
            onChange={(e) => alCambiar("vencimiento", e.target.value)}
          />
          <div className="invalid-feedback">{errores.vencimiento}</div>
        </div>

        <div className="col-5 col-sm-4">
          <label htmlFor="cvvTarjeta" className="form-label small fw-medium text-secondary">
            CVV
          </label>
          <input
            type="password"
            className={clase("cvv")}
            id="cvvTarjeta"
            inputMode="numeric"
            placeholder="123"
            maxLength="4"
            required
            value={valores.cvv}
            onChange={(e) => alCambiar("cvv", e.target.value)}
          />
          <div className="invalid-feedback">{errores.cvv}</div>
        </div>
      </div>

      <div className="form-check mb-4">
        <input className="form-check-input" type="checkbox" id="guardarTarjeta" />
        <label className="form-check-label small text-secondary" htmlFor="guardarTarjeta">
          Guardar tarjeta para futuros pagos
        </label>
      </div>
    </form>
  );
}
