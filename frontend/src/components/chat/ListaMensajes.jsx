import { useEffect, useRef } from "react";
import BurbujaMensaje from "./BurbujaMensaje";

export default function ListaMensajes({
  mensajes,
  usuarioId,
  servicioId,
  error,
  cargando,
  alAbrirImagen
}) {
  const hilo = useRef(null);
  const cantidadAnterior = useRef(0);

  useEffect(() => {
    if (hilo.current && mensajes.length !== cantidadAnterior.current) {
      hilo.current.scrollTop = hilo.current.scrollHeight;
    }

    cantidadAnterior.current = mensajes.length;
  }, [mensajes]);

  return (
    <div className="chat-hilo" ref={hilo}>
      {error && mensajes.length === 0 && <div className="chat-error">{error}</div>}

      {!error && !cargando && mensajes.length === 0 && (
        <div className="chat-vacio">Todavía no hay mensajes.</div>
      )}

      {mensajes.map((mensaje) => (
        <BurbujaMensaje
          key={mensaje.id}
          mensaje={mensaje}
          servicioId={servicioId}
          propio={Number(mensaje.remitenteId) === Number(usuarioId)}
          alAbrirImagen={alAbrirImagen}
        />
      ))}
    </div>
  );
}
