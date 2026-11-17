import { Link } from "react-router-dom";

export default function EncabezadoChat({ nombre, detalle, rutaVolver }) {
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="chat-encabezado">
      <Link to={rutaVolver} className="chat-volver" aria-label="Volver">
        &larr;
      </Link>

      <div className="chat-avatar">{iniciales || "PC"}</div>

      <div className="chat-contacto">
        <span className="chat-contacto-nombre">{nombre}</span>
        <span className="chat-contacto-detalle">{detalle}</span>
      </div>
    </header>
  );
}
