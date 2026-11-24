import { useState } from "react";
import { formatearFechaHora, leerArchivo, reducirImagen } from "../../helpers/imagen";
import CamaraEnVivo from "./CamaraEnVivo";
import FormularioMensaje from "./FormularioMensaje";
import ListaMensajes from "./ListaMensajes";
import VisorImagen from "./VisorImagen";
import VistaPreviaFoto from "./VistaPreviaFoto";

// Conversación unificada de una reserva: mensajes, fotos con GPS y cámara en vivo.
// La comparten la pantalla /chat y la sección "Chat y reportes" del panel del prestador.
// `chat` es el resultado de useChat(servicioId). Con `soloLectura` (administración revisando un
// servicio cerrado) se muestra la conversación sin el formulario de envío.
export default function ConversacionChat({ chat, servicioId, usuarioId, encabezado = null, soloLectura = false }) {
  const { mensajes, cargando, error, enviando, enviar } = chat;
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [fotoPendiente, setFotoPendiente] = useState(null);
  const [imagenAbierta, setImagenAbierta] = useState(null);

  const prepararFoto = ({ dataUrl, lat, lng }) => {
    setCamaraAbierta(false);
    setFotoPendiente({ dataUrl, lat, lng, hora: formatearFechaHora() });
  };

  const elegirArchivo = async (archivo) => {
    try {
      const dataUrl = await leerArchivo(archivo);

      setFotoPendiente({ dataUrl, lat: null, lng: null, hora: formatearFechaHora() });
    } catch (fallo) {
      alert(fallo.message);
    }
  };

  const enviarFoto = async (descripcion) => {
    try {
      const imagen = await reducirImagen(fotoPendiente.dataUrl);

      const enviado = await enviar({
        texto: descripcion,
        imagen,
        latitud: fotoPendiente.lat,
        longitud: fotoPendiente.lng
      });

      if (enviado) {
        setFotoPendiente(null);
      }
    } catch (fallo) {
      alert(fallo.message);
    }
  };

  const reintentarFoto = () => {
    setFotoPendiente(null);
    setCamaraAbierta(true);
  };

  return (
    <>
      {encabezado}

      <ListaMensajes
        mensajes={mensajes}
        usuarioId={usuarioId}
        servicioId={servicioId}
        error={error}
        cargando={cargando}
        alAbrirImagen={setImagenAbierta}
      />

      {error && mensajes.length > 0 && <div className="chat-error">{error}</div>}

      {soloLectura ? (
        <div className="chat-error">
          {"Conversación en modo lectura. Para enviar un aviso a las partes, usá el contacto del reclamo en el panel de administración."}
        </div>
      ) : (
        <FormularioMensaje
          deshabilitado={Boolean(error && mensajes.length === 0) || enviando}
          alEnviarTexto={(texto) => enviar({ texto })}
          alAbrirCamara={() => setCamaraAbierta(true)}
          alElegirArchivo={elegirArchivo}
        />
      )}

      {camaraAbierta && (
        <CamaraEnVivo alCapturar={prepararFoto} alCerrar={() => setCamaraAbierta(false)} />
      )}

      {fotoPendiente && (
        <VistaPreviaFoto
          foto={fotoPendiente}
          enviando={enviando}
          alReintentar={reintentarFoto}
          alCancelar={() => setFotoPendiente(null)}
          alEnviar={enviarFoto}
        />
      )}

      {imagenAbierta && (
        <VisorImagen imagen={imagenAbierta} alCerrar={() => setImagenAbierta(null)} />
      )}
    </>
  );
}
