import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ConversacionChat from "../components/chat/ConversacionChat";
import EncabezadoChat from "../components/chat/EncabezadoChat";
import { ROLES_ADMIN, RUTAS } from "../config/rutas";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";
import estilosChat from "../config/estilos/chat";

export default function Chat() {
  const { usuario } = useAuth();
  const [parametros] = useSearchParams();
  const servicioId = parametros.get("servicioId");
  const chat = useChat(servicioId);
  const esAdmin = ROLES_ADMIN.includes(usuario.rol);
  useEstilos("chat", estilosChat);
  useEstilos("base", estilosBase);

  const nombreContacto = useMemo(() => {
    const ajeno = [...chat.mensajes]
      .reverse()
      .find((mensaje) => Number(mensaje.remitenteId) !== Number(usuario.id));

    if (!ajeno) {
      return servicioId ? `Servicio #${servicioId}` : "Chat";
    }

    const nombre = `${ajeno.remitente?.nombre || ""} ${ajeno.remitente?.apellido || ""}`.trim();

    return nombre || "Usuario";
  }, [chat.mensajes, usuario.id, servicioId]);

  const rutaVolver = esAdmin
    ? `${RUTAS.admin}/servicios`
    : usuario.rol === "prestador"
      ? RUTAS.panelPrestador
      : RUTAS.misServicios;

  return (
    <div className="chat-app">
      <ConversacionChat
        chat={chat}
        servicioId={servicioId}
        usuarioId={usuario.id}
        soloLectura={esAdmin}
        encabezado={
          <EncabezadoChat
            nombre={nombreContacto}
            detalle={`Reserva #${servicioId || "-"}`}
            rutaVolver={rutaVolver}
          />
        }
      />
    </div>
  );
}
