import { formatearHoraMensaje } from "../../helpers/imagen";

export default function BurbujaMensaje({ mensaje, propio, servicioId, alAbrirImagen }) {
  const urlImagen = mensaje.imagenArchivo
    ? `/api/mensajes/${servicioId}/imagen/${mensaje.imagenArchivo}`
    : null;

  const tieneUbicacion = mensaje.latitud !== null && mensaje.longitud !== null && urlImagen;

  const textoUbicacion = tieneUbicacion
    ? `${Number(mensaje.latitud).toFixed(4)}, ${Number(mensaje.longitud).toFixed(4)}`
    : "";

  return (
    <div className={`chat-fila ${propio ? "propio" : "ajeno"}`}>
      <div className={`chat-burbuja${urlImagen ? " con-imagen" : ""}`}>
        {urlImagen && (
          <img
            className="chat-imagen"
            src={urlImagen}
            alt="Foto enviada en la conversación"
            loading="lazy"
            onClick={() =>
              alAbrirImagen({
                url: urlImagen,
                detalle: `${textoUbicacion ? textoUbicacion + " · " : ""}${formatearHoraMensaje(mensaje.creadoEn)}`
              })
            }
          />
        )}

        {mensaje.texto && <div className="chat-texto">{mensaje.texto}</div>}

        <div className="chat-meta">
          {tieneUbicacion && <span className="chat-ubicacion">{textoUbicacion}</span>}
          <span>{formatearHoraMensaje(mensaje.creadoEn)}</span>
        </div>
      </div>
    </div>
  );
}
