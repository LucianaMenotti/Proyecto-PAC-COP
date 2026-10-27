import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BarraMarca from "../components/BarraMarca";
import ModalReserva from "../components/ModalReserva";
import TarjetaPrestador from "../components/TarjetaPrestador";
import { apiJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { obtenerServicios, precioDe } from "../helpers/prestadores";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

export default function BuscarPrestadores() {
  const { refrescar } = useAuth();
  const navegar = useNavigate();
  const [prestadores, setPrestadores] = useState([]);
  const [resultados, setResultados] = useState(null);
  const [error, setError] = useState(false);
  const [filtroServicio, setFiltroServicio] = useState("");
  const [filtroZona, setFiltroZona] = useState("");
  const [reserva, setReserva] = useState(null);

  useBootstrap();
  useEstilos("base", estilosBase);

  useEffect(() => {
    const cargarPrestadores = async () => {
      try {
        const { ok, datos } = await apiJson("/api/users");

        if (!ok) {
          throw new Error("Error al obtener los usuarios");
        }

        const lista = datos.filter((usuario) => usuario.rol === "prestador");

        setPrestadores(lista);
        setResultados(lista);
      } catch (fallo) {
        console.error("Error al cargar prestadores:", fallo);
        setError(true);
      }
    };

    cargarPrestadores();
  }, []);

  const buscar = () => {
    const servicio = filtroServicio.trim().toLowerCase();
    const zona = filtroZona.trim().toLowerCase();

    setResultados(
      prestadores.filter((prestador) => {
        const servicios = obtenerServicios(prestador.servicios);

        const coincideServicio =
          servicio === "" || servicios.some((item) => item.toLowerCase() === servicio);

        const coincideZona = zona === "" || prestador.zona.toLowerCase().includes(zona);

        return coincideServicio && coincideZona;
      })
    );
  };

  const abrirReserva = async (id) => {
    const usuario = await refrescar();

    if (!usuario) {
      navegar(RUTAS.login);
      return;
    }

    if (usuario.rol !== "dueño") {
      alert("Solo los dueños de mascota pueden reservar servicios.");
      return;
    }

    const prestador = prestadores.find((item) => item.id === id);

    const serviciosConPrecio = obtenerServicios(prestador.servicios).filter(
      (servicio) => precioDe(prestador, servicio) > 0
    );

    if (serviciosConPrecio.length === 0) {
      alert("Este prestador todavía no cargó precios para sus servicios.");
      return;
    }

    const { ok, datos } = await apiJson(`/api/mascotas/usuario/${usuario.id}`);
    const mascotas = ok ? datos : [];

    if (mascotas.length === 0) {
      alert("Primero tenés que registrar una mascota para poder reservar.");
      return;
    }

    setReserva({ prestador, serviciosConPrecio, mascotas });
  };

  const reservaCreada = () => {
    setReserva(null);
    alert("Reserva creada correctamente. Ya podés pagarla desde la pantalla de pago.");
  };

  return (
    <>
      <BarraMarca />

      <main className="container py-5">
        <div className="text-center mb-5">
          <h1 className="fw-bold">Buscar prestadores</h1>
          <p className="text-secondary">Encontrá el servicio que tu mascota necesita.</p>
        </div>

        <div className="card border-0 shadow-sm mb-5">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" htmlFor="filtroServicio">
                  Servicio
                </label>
                <select
                  id="filtroServicio"
                  className="form-select"
                  value={filtroServicio}
                  onChange={(e) => setFiltroServicio(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="Paseo">Paseo</option>
                  <option value="Guarderia">Guarderia</option>
                  <option value="Traslado">Traslado</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="filtroZona">
                  Zona
                </label>
                <input
                  type="text"
                  id="filtroZona"
                  className="form-control"
                  placeholder="Ej: Centro"
                  value={filtroZona}
                  onChange={(e) => setFiltroZona(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Buscar</label>
                <button className="btn btn-primary w-100" onClick={buscar}>
                  Buscar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {error && (
            <div className="alert alert-danger">No se pudieron cargar los prestadores.</div>
          )}

          {!error && resultados && resultados.length === 0 && (
            <div className="alert alert-info">No se encontraron prestadores.</div>
          )}

          {(resultados || []).map((prestador) => (
            <TarjetaPrestador key={prestador.id} prestador={prestador} alReservar={abrirReserva} />
          ))}
        </div>
      </main>

      {reserva && (
        <ModalReserva
          prestador={reserva.prestador}
          serviciosConPrecio={reserva.serviciosConPrecio}
          mascotas={reserva.mascotas}
          alCerrar={() => setReserva(null)}
          alCrear={reservaCreada}
        />
      )}
    </>
  );
}
