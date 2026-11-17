export default function VisorImagen({ imagen, alCerrar }) {
  return (
    <div
      className="chat-capa"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) {
          alCerrar();
        }
      }}
    >
      <div className="chat-capa-contenido">
        <button
          type="button"
          className="chat-capa-icono"
          style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 2 }}
          aria-label="Cerrar"
          onClick={alCerrar}
        >
          &times;
        </button>

        <img className="chat-capa-imagen" src={imagen.url} alt="Foto en tamaño completo" />

        <div className="chat-previa-pie">
          <div className="chat-previa-info">
            <span>{imagen.detalle}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
