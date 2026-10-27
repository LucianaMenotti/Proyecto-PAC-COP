import { useRef, useState } from "react";
import { IconoAdjuntar, IconoCamara, IconoEnviar } from "./Iconos";

export default function FormularioMensaje({
  deshabilitado,
  alEnviarTexto,
  alAbrirCamara,
  alElegirArchivo
}) {
  const [texto, setTexto] = useState("");
  const campoArchivo = useRef(null);
  const campoTexto = useRef(null);

  const ajustarAltura = () => {
    const campo = campoTexto.current;

    if (campo) {
      campo.style.height = "auto";
      campo.style.height = Math.min(campo.scrollHeight, 110) + "px";
    }
  };

  const enviar = async (evento) => {
    evento.preventDefault();

    const limpio = texto.trim();

    if (!limpio || deshabilitado) {
      return;
    }

    const enviado = await alEnviarTexto(limpio);

    if (enviado) {
      setTexto("");

      if (campoTexto.current) {
        campoTexto.current.style.height = "auto";
        campoTexto.current.focus();
      }
    }
  };

  const manejarTecla = (evento) => {
    if (evento.key === "Enter" && !evento.shiftKey) {
      enviar(evento);
    }
  };

  const manejarArchivo = (evento) => {
    const archivo = evento.target.files?.[0];

    if (archivo) {
      alElegirArchivo(archivo);
    }

    evento.target.value = "";
  };

  return (
    <form className="chat-formulario" onSubmit={enviar}>
      <button
        type="button"
        className="chat-boton-icono"
        aria-label="Adjuntar imagen"
        disabled={deshabilitado}
        onClick={() => campoArchivo.current?.click()}
      >
        <IconoAdjuntar />
      </button>

      <input ref={campoArchivo} type="file" accept="image/*" hidden onChange={manejarArchivo} />

      <button
        type="button"
        className="chat-boton-icono"
        aria-label="Tomar foto"
        disabled={deshabilitado}
        onClick={alAbrirCamara}
      >
        <IconoCamara />
      </button>

      <textarea
        ref={campoTexto}
        rows="1"
        placeholder="Escribe un mensaje..."
        value={texto}
        onChange={(evento) => {
          setTexto(evento.target.value);
          ajustarAltura();
        }}
        onKeyDown={manejarTecla}
      ></textarea>

      <button
        type="submit"
        className="chat-boton-icono enviar"
        aria-label="Enviar mensaje"
        disabled={deshabilitado || !texto.trim()}
      >
        <IconoEnviar />
      </button>
    </form>
  );
}
