import { useEffect, useState } from "react";

// Confirmación de una acción administrativa con motivo (rechazo, suspensión, cancelación,
// moderación). minimo = 0 deja el motivo como opcional.
export default function ModalMotivo({
  titulo,
  descripcion,
  etiqueta = "Motivo",
  minimo = 0,
  maximo = 255,
  textoConfirmar = "Confirmar",
  claseConfirmar = "btn-danger",
  valorInicial = "",
  children,
  alConfirmar,
  alCerrar
}) {
  const [motivo, setMotivo] = useState(valorInicial);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const manejarTecla = (evento) => {
      if (evento.key === "Escape" && !enviando) {
        alCerrar();
      }
    };

    document.addEventListener("keydown", manejarTecla);

    return () => document.removeEventListener("keydown", manejarTecla);
  }, [alCerrar, enviando]);

  const confirmar = async (evento) => {
    evento.preventDefault();
    const texto = motivo.trim();

    if (texto.length < minimo) {
      setError(`Escribí al menos ${minimo} caracteres.`);
      return;
    }

    setEnviando(true);
    setError("");

    try {
      await alConfirmar(texto);
    } catch (fallo) {
      setError(fallo.message);
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <form className="modal-content" onSubmit={confirmar}>
            <div className="modal-header">
              <h5 className="modal-title">{titulo}</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                disabled={enviando}
                onClick={alCerrar}
              ></button>
            </div>

            <div className="modal-body">
              {descripcion && <p className="text-secondary small">{descripcion}</p>}

              <label className="form-label" htmlFor="motivo-admin">
                {etiqueta}
                {minimo === 0 && <span className="text-secondary"> (opcional)</span>}
              </label>
              <textarea
                id="motivo-admin"
                className="form-control"
                rows="3"
                maxLength={maximo}
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value)}
                autoFocus
              />

              {children}

              {error && <p className="text-danger small mt-2 mb-0">{error}</p>}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={enviando}
                onClick={alCerrar}
              >
                Volver
              </button>
              <button type="submit" className={`btn ${claseConfirmar}`} disabled={enviando}>
                {enviando ? "Guardando..." : textoConfirmar}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
