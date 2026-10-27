import { useCallback, useEffect, useRef, useState } from "react";
import { leerArchivo } from "../../helpers/imagen";

const horaActual = () =>
  new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

export default function CamaraEnVivo({ alCapturar, alCerrar }) {
  const video = useRef(null);
  const lienzo = useRef(null);
  const flujo = useRef(null);
  const coordenadas = useRef(null);
  const [orientacion, setOrientacion] = useState("environment");
  const [fallo, setFallo] = useState(false);
  const [textoGps, setTextoGps] = useState("Obteniendo ubicación GPS...");
  const [reloj, setReloj] = useState(horaActual());

  const detenerFlujo = useCallback(() => {
    if (flujo.current) {
      flujo.current.getTracks().forEach((pista) => pista.stop());
      flujo.current = null;
    }
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setTextoGps("GPS no disponible en este dispositivo");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        coordenadas.current = {
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude
        };

        setTextoGps(`${coordenadas.current.lat.toFixed(4)}, ${coordenadas.current.lng.toFixed(4)}`);
      },
      () => {
        coordenadas.current = null;
        setTextoGps("Ubicación no disponible");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => setReloj(horaActual()), 15000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    let activo = true;

    const iniciar = async () => {
      detenerFlujo();

      try {
        const nuevo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: orientacion },
          audio: false
        });

        if (!activo) {
          nuevo.getTracks().forEach((pista) => pista.stop());
          return;
        }

        flujo.current = nuevo;

        if (video.current) {
          video.current.srcObject = nuevo;
        }

        setFallo(false);
      } catch (error) {
        console.error("No se pudo acceder a la cámara:", error);
        setFallo(true);
      }
    };

    iniciar();

    return () => {
      activo = false;
      detenerFlujo();
    };
  }, [orientacion, detenerFlujo]);

  const capturar = () => {
    if (!flujo.current || !video.current || !lienzo.current) {
      return;
    }

    const ancho = video.current.videoWidth || 720;
    const alto = video.current.videoHeight || 960;
    const contexto = lienzo.current.getContext("2d");

    lienzo.current.width = ancho;
    lienzo.current.height = alto;

    if (orientacion === "user") {
      contexto.translate(ancho, 0);
      contexto.scale(-1, 1);
    }

    contexto.drawImage(video.current, 0, 0, ancho, alto);

    alCapturar({
      dataUrl: lienzo.current.toDataURL("image/jpeg", 0.9),
      lat: coordenadas.current ? coordenadas.current.lat : null,
      lng: coordenadas.current ? coordenadas.current.lng : null
    });
  };

  const usarArchivo = async (evento) => {
    const archivo = evento.target.files?.[0];

    if (!archivo) {
      return;
    }

    const dataUrl = await leerArchivo(archivo);

    alCapturar({
      dataUrl,
      lat: coordenadas.current ? coordenadas.current.lat : null,
      lng: coordenadas.current ? coordenadas.current.lng : null
    });

    evento.target.value = "";
  };

  return (
    <div className="chat-capa">
      <div className="chat-capa-contenido">
        <video ref={video} autoPlay playsInline muted hidden={fallo}></video>
        <canvas ref={lienzo} hidden></canvas>

        <div className="chat-capa-barra">
          <span>{textoGps}</span>
          <span>{reloj}</span>
        </div>

        {fallo && (
          <div className="chat-camara-error">
            <p>No se pudo acceder a la cámara.</p>

            <label htmlFor="archivoRespaldo" className="chat-boton">
              Subir o tomar foto
            </label>

            <input
              id="archivoRespaldo"
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={usarArchivo}
            />
          </div>
        )}

        <div className="chat-capa-controles">
          <button
            type="button"
            className="chat-capa-icono"
            aria-label="Cerrar cámara"
            onClick={alCerrar}
          >
            &times;
          </button>

          <button
            type="button"
            className="chat-obturador"
            aria-label="Capturar foto"
            onClick={capturar}
          ></button>

          <button
            type="button"
            className="chat-capa-icono"
            aria-label="Cambiar cámara"
            onClick={() =>
              setOrientacion((valor) => (valor === "environment" ? "user" : "environment"))
            }
          >
            &#8635;
          </button>
        </div>
      </div>
    </div>
  );
}
