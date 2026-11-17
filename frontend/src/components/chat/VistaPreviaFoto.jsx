import { useState } from "react";

export default function VistaPreviaFoto({ foto, enviando, alReintentar, alCancelar, alEnviar }) {
  const [descripcion, setDescripcion] = useState("");

  const textoUbicacion =
    foto.lat !== null && foto.lng !== null
      ? `${foto.lat.toFixed(4)}, ${foto.lng.toFixed(4)}`
      : "Ubicación no disponible";

  return (
    <div className="chat-capa">
      <div className="chat-capa-contenido">
        <button
          type="button"
          className="chat-capa-icono"
          style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 2 }}
          aria-label="Cancelar"
          onClick={alCancelar}
        >
          &times;
        </button>

        <img className="chat-capa-imagen" src={foto.dataUrl} alt="Vista previa de la foto" />

        <div className="chat-previa-pie">
          <div className="chat-previa-info">
            <span>{textoUbicacion}</span>
            <span>{foto.hora}</span>
          </div>

          <input
            type="text"
            placeholder="Agregar un mensaje (opcional)"
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
          />

          <div className="chat-previa-acciones">
            <button type="button" className="chat-boton" onClick={alReintentar} disabled={enviando}>
              Reintentar
            </button>

            <button
              type="button"
              className="chat-boton primario"
              onClick={() => alEnviar(descripcion.trim())}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Enviar foto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
