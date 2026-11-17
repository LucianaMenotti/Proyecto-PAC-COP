import { useState } from "react";
import { MOTIVOS_REPORTE, enviarReporte } from "../../helpers/reportes";

// Formulario de reporte de un usuario o de una reseña.
// destino: { reportadoId } para usuarios o { calificacionId } para reseñas.
export default function FormularioReporte({ tipo, destino, alEnviado, alCancelar }) {
  const motivos = Object.entries(MOTIVOS_REPORTE[tipo]);
  const [motivo, setMotivo] = useState(motivos[0][0]);
  const [detalle, setDetalle] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError("");

    try {
      const datos = await enviarReporte({ tipo, ...destino, motivo, detalle: detalle.trim() });
      alEnviado(datos.mensaje);
    } catch (fallo) {
      setError(fallo.message);
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar}>
      <label className="form-label small" htmlFor={`motivo-${tipo}`}>
        Motivo
      </label>
      <select
        id={`motivo-${tipo}`}
        className="form-select form-select-sm mb-2"
        value={motivo}
        onChange={(evento) => setMotivo(evento.target.value)}
      >
        {motivos.map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>

      <textarea
        className="form-control form-control-sm mb-2"
        rows="3"
        maxLength={1000}
        placeholder="Contá qué pasó (opcional)"
        value={detalle}
        onChange={(evento) => setDetalle(evento.target.value)}
      />

      {error && <p className="text-danger small mb-2">{error}</p>}

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={alCancelar} disabled={enviando}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-danger btn-sm" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar reporte"}
        </button>
      </div>
    </form>
  );
}
