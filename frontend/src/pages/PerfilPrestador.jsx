import { useState } from "react";
import { Link } from "react-router-dom";
import { enviarJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { leerLista, leerPrecios } from "../helpers/listas";
import { NOMBRES_SERVICIO } from "../helpers/servicios";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

export default function PerfilPrestador() {
  const { usuario, refrescar } = useAuth();
  const [servicios, setServicios] = useState(() => leerLista(usuario.servicios));
  const [precios, setPrecios] = useState(() => leerPrecios(usuario.preciosServicios));

  useBootstrap();
  useEstilos("base", estilosBase);

  const guardar = async (nuevosServicios, nuevosPrecios) => {
    const { ok, datos } = await enviarJson("/api/users/me/servicios", "PUT", {
      servicios: nuevosServicios,
      preciosServicios: nuevosPrecios
    });

    if (!ok) {
      throw new Error(datos.mensaje || "No se pudo guardar");
    }

    setServicios(leerLista(datos.usuario.servicios));
    setPrecios(leerPrecios(datos.usuario.preciosServicios));
    refrescar();
  };

  const quitar = async (servicio) => {
    if (!confirm(`¿Eliminar el servicio "${NOMBRES_SERVICIO[servicio] || servicio}"?`)) {
      return;
    }

    const nuevosServicios = servicios.filter((item) => item !== servicio);
    const nuevosPrecios = { ...precios };
    delete nuevosPrecios[servicio];

    try {
      await guardar(nuevosServicios, nuevosPrecios);
    } catch (error) {
      alert(error.message);
      setServicios(leerLista(usuario.servicios));
      setPrecios(leerPrecios(usuario.preciosServicios));
    }
  };

  const nombreCompleto = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
  const inicial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : "P";

  return (
    <>
      <nav className="navbar bg-white shadow-sm border-bottom">
        <div className="container">
          <Link to={RUTAS.inicio} className="navbar-brand fw-bold text-primary">
            Pac-Cop
          </Link>
          <Link to={RUTAS.panelPrestador} className="btn btn-outline-primary">
            Volver al panel
          </Link>
        </div>
      </nav>

      <main className="container py-5">
        <div>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="row align-items-center g-4">
                <div className="col-md-3 text-center">
                  <div
                    className="avatar mx-auto"
                    style={{ width: "90px", height: "90px", fontSize: "2rem" }}
                  >
                    {inicial}
                  </div>
                </div>

                <div className="col-md-9">
                  <h1 className="fw-bold mb-2">{nombreCompleto}</h1>

                  {usuario.verificado ? (
                    <span className="badge text-bg-success">✓ Identidad verificada</span>
                  ) : (
                    <span className="badge text-bg-secondary">Identidad no verificada</span>
                  )}

                  <p className="mt-3 mb-1">
                    <strong>{usuario.calificacion || 0}</strong> ★
                    <span className="text-secondary"> ({usuario.resenas || 0} reseñas)</span>
                  </p>

                  <p className="text-secondary mb-0">{usuario.zona || "Zona no especificada"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="fw-bold mb-0">Mis servicios</h3>
                    <Link to={RUTAS.panelPrestador} className="btn btn-primary btn-sm">
                      Agregar o cambiar precios
                    </Link>
                  </div>

                  {servicios.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {servicios.map((servicio) => (
                        <li
                          key={servicio}
                          className="list-group-item d-flex justify-content-between align-items-center px-0"
                        >
                          <span>
                            <strong>{NOMBRES_SERVICIO[servicio] || servicio}</strong>
                            <span className="text-secondary ms-2">
                              {precios[servicio] ? "$" + precios[servicio] : "Sin precio cargado"}
                            </span>
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => quitar(servicio)}
                          >
                            Eliminar
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-secondary mb-0">
                      Todavía no ofrecés ningún servicio. Agregalos desde el panel.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <h4 className="fw-bold">Mi cuenta</h4>
                  <hr />
                  <p className="mb-2">
                    <strong>Correo</strong>
                  </p>
                  <p className="text-secondary">{usuario.email}</p>
                  <p className="mb-2">
                    <strong>Teléfono</strong>
                  </p>
                  <p className="text-secondary">{usuario.telefono || "No especificado"}</p>
                  <p className="mb-2">
                    <strong>Zona</strong>
                  </p>
                  <p className="text-secondary mb-0">{usuario.zona || "No especificada"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
