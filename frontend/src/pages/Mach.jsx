import { useState } from "react";
import { useEstilos } from "../hooks/useEstilos";
import estilosMach from "../config/estilos/mach";

const PRESTADORES = [
  { id: 1, name: "Carlos Mendoza", service: "Paseador de Perros", certified: false, rating: 4.2 },
  {
    id: 2,
    name: "Dra. Ana Ríos",
    service: "Veterinaria a Domicilio",
    certified: true,
    rating: 4.9
  },
  { id: 3, name: "Roberto Gómez", service: "Cuidado Nocturno", certified: false, rating: 4.0 },
  {
    id: 4,
    name: "Lucía Fernández",
    service: "Adiestramiento Canino",
    certified: true,
    rating: 4.8
  },
  { id: 5, name: "Clínica San Martín", service: "Guardia y Traslado", certified: true, rating: 5.0 }
];

const ordenar = (lista) => [...lista].sort((a, b) => b.certified - a.certified);

export default function Mach() {
  const [consulta, setConsulta] = useState("");
  const [visibles, setVisibles] = useState(() => ordenar(PRESTADORES));
  const [seleccionado, setSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEstilos("mach", estilosMach);

  const buscar = () => {
    const texto = consulta.toLowerCase();

    setVisibles(
      ordenar(
        PRESTADORES.filter(
          (prestador) =>
            prestador.name.toLowerCase().includes(texto) ||
            prestador.service.toLowerCase().includes(texto)
        )
      )
    );
  };

  const seleccionar = (prestador) => {
    setSeleccionado(prestador);

    if (!prestador.certified) {
      setModalVisible(true);
    } else {
      alert(`Has seleccionado a ${prestador.name} (Certificado). Procediendo a la reserva...`);
    }
  };

  const verCertificados = () => {
    setModalVisible(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const continuarSinCertificado = () => {
    setModalVisible(false);
    alert(
      `Procediendo con la reserva de ${seleccionado.name} bajo la responsabilidad del usuario.`
    );
  };

  return (
    <>
      <main className="dashboard">
        <header className="search-header">
          <h1>Búsqueda de Prestadores</h1>
          <p>Prestadores con experiencia certificada priorizados en los primeros resultados.</p>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar por servicio (ej. Paseador, Veterinaria)..."
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  buscar();
                }
              }}
            />
            <button className="btn btn-solid" onClick={buscar}>
              Buscar
            </button>
          </div>
        </header>

        <section className="results-container">
          <div className="results-header">
            <h2>Resultados Encontrados</h2>
            <span className="results-count">{`${visibles.length} prestadores disponibles`}</span>
          </div>

          <div className="providers-list">
            {visibles.map((prestador) => (
              <div
                className={`provider-card ${prestador.certified ? "certified" : ""}`}
                key={prestador.id}
              >
                <div className="provider-info">
                  <h3>
                    {prestador.name}{" "}
                    {prestador.certified ? (
                      <span className="badge badge-certified">Certificado</span>
                    ) : (
                      <span className="badge badge-uncertified">Sin Certificar</span>
                    )}
                  </h3>
                  <p className="provider-service">
                    {prestador.service} • ★ {prestador.rating}
                  </p>
                </div>

                <button
                  className="btn btn-outline btn-select"
                  onClick={() => seleccionar(prestador)}
                >
                  Seleccionar
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className={`modal-overlay${modalVisible ? "" : " hidden"}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Sin Certificación Verificada</h2>
            <button className="close-btn" onClick={() => setModalVisible(false)}>
              &times;
            </button>
          </div>

          <div className="modal-body">
            <div className="alert-box">
              <p className="alert-title">Advertencia de Seguridad</p>
              <p className="alert-desc">
                Este prestador no cuenta con certificado verificado en la plataforma. Al no poseer
                acreditación, el cuidado de tu mascota podría no contar con los mismos estándares de
                seguridad.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn btn-solid" onClick={verCertificados}>
                Ver Prestadores Certificados
              </button>
              <button className="btn btn-outline" onClick={continuarSinCertificado}>
                Continuar de todos modos
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
