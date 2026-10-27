import { useEffect, useRef, useState } from "react";
import { useEstilos } from "../hooks/useEstilos";
import estilosNumero from "../config/estilos/numero";

export default function Numero() {
  const [modalVisible, setModalVisible] = useState(false);
  const [ubicacion, setUbicacion] = useState({ tipo: "texto", texto: "Obteniendo ubicación..." });
  const [estadoAlerta, setEstadoAlerta] = useState("inicial");
  const temporizador = useRef(null);

  useEstilos("numero", estilosNumero);

  useEffect(() => {
    return () => clearTimeout(temporizador.current);
  }, []);

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setUbicacion({
        tipo: "texto",
        texto: "La geolocalización no es soportada por este navegador."
      });
      return;
    }

    setUbicacion({ tipo: "texto", texto: "Obteniendo coordenadas GPS..." });

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setUbicacion({
          tipo: "coordenadas",
          lat: posicion.coords.latitude,
          lon: posicion.coords.longitude
        });
      },
      () => {
        setUbicacion({
          tipo: "error",
          texto: "Error al obtener la ubicación. Verifique los permisos del navegador."
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const abrirEmergencia = () => {
    setModalVisible(true);
    setEstadoAlerta("inicial");
    obtenerUbicacion();
  };

  const notificar = () => {
    setEstadoAlerta("enviando");

    temporizador.current = setTimeout(() => {
      setEstadoAlerta("enviada");
    }, 1500);
  };

  return (
    <>
      <main className="dashboard">
        <h1>Panel del Prestador</h1>
        <p>Servicios de cuidado en curso. La mascota se encuentra en buen estado.</p>
      </main>

      <button
        className="fab-emergency"
        aria-label="Emergencia Veterinaria"
        onClick={abrirEmergencia}
      >
        Emergencia
      </button>

      <div
        className={`modal-overlay${modalVisible ? "" : " hidden"}`}
        onClick={(evento) => {
          if (evento.target === evento.currentTarget) {
            setModalVisible(false);
          }
        }}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2>Alerta de Emergencia</h2>
            <button
              className="close-btn"
              aria-label="Cerrar"
              onClick={() => setModalVisible(false)}
            >
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="call-options">
              <a href="tel:+5491100000000" className="btn btn-outline">
                Llamar Veterinaria de Cabecera
              </a>
              <a href="tel:130" className="btn btn-outline">
                Llamar Traslado / Guardia
              </a>
            </div>

            <div className="location-section">
              <h3>Tu Ubicación Actual:</h3>

              <p
                className="location-box"
                style={ubicacion.tipo === "error" ? { color: "var(--alert-main)" } : undefined}
              >
                {ubicacion.tipo === "coordenadas" ? (
                  <>
                    Lat: {ubicacion.lat.toFixed(5)} <br />
                    Lon: {ubicacion.lon.toFixed(5)} <br />
                    <br />
                    <a
                      href={`https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lon}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver en Google Maps
                    </a>
                  </>
                ) : (
                  ubicacion.texto
                )}
              </p>
            </div>

            <div className="alert-section">
              <button
                className="btn btn-solid"
                disabled={estadoAlerta === "enviando"}
                onClick={notificar}
              >
                {estadoAlerta === "enviando"
                  ? "Enviando alerta..."
                  : estadoAlerta === "enviada"
                    ? "Alerta Enviada"
                    : "Enviar Alerta Prioritaria al Dueño"}
              </button>

              <p
                className="status-msg"
                style={estadoAlerta === "enviada" ? { color: "var(--success-text)" } : undefined}
              >
                {estadoAlerta === "enviada" ? "Se ha notificado al dueño exitosamente." : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
