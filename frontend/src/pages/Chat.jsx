import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CamaraEnVivo from "../components/chat/CamaraEnVivo";
import EncabezadoChat from "../components/chat/EncabezadoChat";
import FormularioMensaje from "../components/chat/FormularioMensaje";
import ListaMensajes from "../components/chat/ListaMensajes";
import VisorImagen from "../components/chat/VisorImagen";
import VistaPreviaFoto from "../components/chat/VistaPreviaFoto";
import { RUTAS } from "../config/rutas";
import { formatearFechaHora, leerArchivo, reducirImagen } from "../helpers/imagen";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { useEstilos } from "../hooks/useEstilos";
import estilosChat from "../config/estilos/chat";

export default function Chat() {
  const { usuario } = useAuth();
  const [parametros] = useSearchParams();
  const servicioId = parametros.get("servicioId");
  const { mensajes, cargando, error, enviando, enviar } = useChat(servicioId);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [fotoPendiente, setFotoPendiente] = useState(null);
  const [imagenAbierta, setImagenAbierta] = useState(null);

  useEstilos("chat", estilosChat);

  const nombreContacto = useMemo(() => {
    const ajeno = [...mensajes]
      .reverse()
      .find((mensaje) => Number(mensaje.remitenteId) !== Number(usuario.id));

    if (!ajeno) {
      return servicioId ? `Servicio #${servicioId}` : "Chat";
    }

    const nombre = `${ajeno.remitente?.nombre || ""} ${ajeno.remitente?.apellido || ""}`.trim();

    return nombre || "Usuario";
  }, [mensajes, usuario.id, servicioId]);

  const rutaVolver = usuario.rol === "prestador" ? RUTAS.panelPrestador : RUTAS.misServicios;

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
    <div className="chat-app">
      <EncabezadoChat
        nombre={nombreContacto}
        detalle={`Reserva #${servicioId || "-"}`}
        rutaVolver={rutaVolver}
      />

      <ListaMensajes
        mensajes={mensajes}
        usuarioId={usuario.id}
        servicioId={servicioId}
        error={error}
        cargando={cargando}
        alAbrirImagen={setImagenAbierta}
      />

      {error && mensajes.length > 0 && <div className="chat-error">{error}</div>}

      <FormularioMensaje
        deshabilitado={Boolean(error && mensajes.length === 0) || enviando}
        alEnviarTexto={(texto) => enviar({ texto })}
        alAbrirCamara={() => setCamaraAbierta(true)}
        alElegirArchivo={elegirArchivo}
      />

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
    </div>
  );
}
