import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BarraMarca from "../components/BarraMarca";
import ModalReserva from "../components/ModalReserva";
import ModalResenas from "../components/ModalResenas";
import TarjetaPrestador from "../components/TarjetaPrestador";
import { apiJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { leerLista } from "../helpers/listas";
import { obtenerServicios, precioDe } from "../helpers/prestadores";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

// Un prestador no se muestra si la mascota elegida no cumple su política (tamaños aceptados y razas excluidas)
const aceptaMascota = (prestador, mascota) => {
  const tamanos = leerLista(prestador.tamanosAceptados);
  const razasExcluidas = leerLista(prestador.restricciones);
  const tamano = String(mascota.tamano || "mediano").toLowerCase();
  const raza = String(mascota.raza || "").toLowerCase();

  if (tamanos.length > 0 && !tamanos.includes(tamano)) {
    return false;
  }

  return !razasExcluidas.some((excluida) => raza.includes(String(excluida).toLowerCase()));
};

export default function BuscarPrestadores() {
  const { usuario, refrescar } = useAuth();
  const navegar = useNavigate();
  const [prestadores, setPrestadores] = useState([]);
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [filtroServicio, setFiltroServicio] = useState("");
  const [filtroZona, setFiltroZona] = useState("");
  const [filtroMascota, setFiltroMascota] = useState("");
  const [aplicados, setAplicados] = useState({ servicio: "", zona: "", mascota: "" });
  const [misMascotas, setMisMascotas] = useState([]);
  const [reserva, setReserva] = useState(null);
  const [resenas, setResenas] = useState(null);

  useBootstrap();
  useEstilos("base", estilosBase);

  useEffect(() => {
    const cargarPrestadores = async () => {
      try {
        const { ok, datos } = await apiJson("/api/users");

        if (!ok) {
          throw new Error("Error al obtener los usuarios");
        }

        setPrestadores(datos.filter((item) => item.rol === "prestador"));
      } catch (fallo) {
        console.error("Error al cargar prestadores:", fallo);
        setError(true);
      } finally {
        setCargando(false);
      }
    };

    cargarPrestadores();
  }, []);

  // Con una cuenta de dueño se habilita el filtro por mascota (tamaño y raza)
  useEffect(() => {
    if (usuario?.rol !== "dueño") {
      setMisMascotas([]);
      return;
    }

    const cargarMascotas = async () => {
      const { ok, datos } = await apiJson(`/api/mascotas/usuario/${usuario.id}`);

      setMisMascotas(ok && Array.isArray(datos) ? datos : []);
    };

    cargarMascotas();
  }, [usuario?.id, usuario?.rol]);

  const buscar = () => {
    setAplicados({
      servicio: filtroServicio.trim().toLowerCase(),
      zona: filtroZona.trim().toLowerCase(),
      mascota: filtroMascota
    });
  };

  const resultados = useMemo(() => {
    const mascota = misMascotas.find((item) => String(item.id) === String(aplicados.mascota));

    return prestadores.filter((prestador) => {
      const servicios = obtenerServicios(prestador.servicios);

      const coincideServicio =
        aplicados.servicio === "" ||
        servicios.some((item) => item.toLowerCase() === aplicados.servicio);

      const coincideZona =
        aplicados.zona === "" || (prestador.zona || "").toLowerCase().includes(aplicados.zona);

      return coincideServicio && coincideZona && (!mascota || aceptaMascota(prestador, mascota));
    });
  }, [prestadores, misMascotas, aplicados]);

  const abrirReserva = async (id) => {
    const sesion = await refrescar();

    if (!sesion) {
      navegar(RUTAS.login);
      return;
    }

    if (sesion.rol !== "dueño") {
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

    const { ok, datos } = await apiJson(`/api/mascotas/usuario/${sesion.id}`);
    const mascotas = ok ? datos : [];

    if (mascotas.length === 0) {
      alert("Primero tenés que registrar una mascota para poder reservar.");
      return;
    }

    setReserva({ prestador, serviciosConPrecio, mascotas });
  };

  const reservaCreada = (datos) => {
    setReserva(null);

    const id = datos?.servicio?.id;

    alert("Reserva creada correctamente. Ya podés pagarla desde la pantalla de pago.");

    navegar(id ? `${RUTAS.pago}?servicioId=${id}` : RUTAS.misServicios);
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
              <div className={misMascotas.length > 0 ? "col-md-3" : "col-md-4"}>
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

              <div className={misMascotas.length > 0 ? "col-md-3" : "col-md-4"}>
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

              {misMascotas.length > 0 && (
                <div className="col-md-3">
                  <label className="form-label" htmlFor="filtroMascota">
                    Mascota a atender
                  </label>
                  <select
                    id="filtroMascota"
                    className="form-select"
                    value={filtroMascota}
                    onChange={(e) => setFiltroMascota(e.target.value)}
                  >
                    <option value="">Cualquier mascota</option>
                    {misMascotas.map((mascota) => (
                      <option key={mascota.id} value={mascota.id}>
                        {mascota.nombre} ({mascota.tamano || "mediano"} · {mascota.raza || "mestizo"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={misMascotas.length > 0 ? "col-md-3" : "col-md-4"}>
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

          {!error && !cargando && resultados.length === 0 && (
            <div className="alert alert-info">No se encontraron prestadores.</div>
          )}

          {resultados.map((prestador) => (
            <TarjetaPrestador
              key={prestador.id}
              prestador={prestador}
              alReservar={abrirReserva}
              alVerResenas={setResenas}
            />
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

      {resenas && <ModalResenas prestador={resenas} alCerrar={() => setResenas(null)} />}
    </>
  );
}
