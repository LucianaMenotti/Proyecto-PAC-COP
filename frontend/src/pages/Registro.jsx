import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { enviarJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import BarraMarca from "../components/BarraMarca";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

const DATOS_INICIALES = {
  nombre: "",
  apellido: "",
  dni: "",
  fechaNacimiento: "",
  telefono: "",
  email: "",
  password: ""
};

const MASCOTA_INICIAL = {
  nombreMascota: "",
  especie: "",
  raza: "",
  edadMascota: "",
  condicion: "",
  alergias: "",
  vacunacion: "",
  reactividad: "",
  alertaGeneral: ""
};

const PRESTADOR_INICIAL = {
  zona: "",
  servicios: [],
  vehiculo: ""
};

export default function Registro() {
  const navegar = useNavigate();
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [rol, setRol] = useState("");
  const [registrarMascota, setRegistrarMascota] = useState(false);
  const [completarFicha, setCompletarFicha] = useState(false);
  const [mascota, setMascota] = useState(MASCOTA_INICIAL);
  const [prestador, setPrestador] = useState(PRESTADOR_INICIAL);
  const [aviso, setAviso] = useState(null);

  useBootstrap();
  useEstilos("base", estilosBase);

  const mostrarMensaje = (texto, tipo = "danger") => {
    setAviso({ texto, tipo });
  };

  const cambiarDato = (campo) => (evento) => {
    setDatos((anterior) => ({ ...anterior, [campo]: evento.target.value }));
  };

  const cambiarMascota = (campo) => (evento) => {
    setMascota((anterior) => ({ ...anterior, [campo]: evento.target.value }));
  };

  const cambiarRol = (nuevoRol) => {
    setAviso(null);
    setRol(nuevoRol);

    if (nuevoRol === "dueño") {
      setPrestador(PRESTADOR_INICIAL);
    }

    if (nuevoRol === "prestador") {
      setRegistrarMascota(false);
      setCompletarFicha(false);
    }
  };

  const cambiarRegistrarMascota = (valor) => {
    setRegistrarMascota(valor);

    if (!valor) {
      setCompletarFicha(false);
    }
  };

  const cambiarServicio = (servicio) => (evento) => {
    setPrestador((anterior) => {
      const servicios = evento.target.checked
        ? [...anterior.servicios, servicio]
        : anterior.servicios.filter((item) => item !== servicio);

      return {
        ...anterior,
        servicios,
        vehiculo: servicios.includes("Traslado") ? anterior.vehiculo : ""
      };
    });
  };

  const reiniciarFormulario = () => {
    setDatos(DATOS_INICIALES);
    setMascota(MASCOTA_INICIAL);
    setPrestador(PRESTADOR_INICIAL);
    setRol("");
    setRegistrarMascota(false);
    setCompletarFicha(false);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setAviso(null);

    if (!rol) {
      mostrarMensaje("Seleccioná si sos dueño o prestador.");
      return;
    }

    const nombre = datos.nombre.trim();
    const apellido = datos.apellido.trim();
    const dni = datos.dni.trim();
    const fechaNacimiento = datos.fechaNacimiento;
    const telefono = datos.telefono.trim();
    const email = datos.email.trim();
    const password = datos.password;

    if (!nombre || !apellido || !dni || !fechaNacimiento || !telefono || !email || !password) {
      mostrarMensaje("Completá todos los datos obligatorios.");
      return;
    }

    let zona = null;
    let servicios = null;
    let vehiculo = null;

    if (rol === "prestador") {
      zona = prestador.zona.trim();
      servicios = [...prestador.servicios];

      if (!zona) {
        mostrarMensaje("Ingresá la zona donde trabajás.");
        return;
      }

      if (servicios.length === 0) {
        mostrarMensaje("Seleccioná al menos un servicio.");
        return;
      }

      if (servicios.includes("Traslado")) {
        if (!prestador.vehiculo) {
          mostrarMensaje("Seleccioná el vehículo que utilizás para realizar traslados.");
          return;
        }

        vehiculo = prestador.vehiculo;
      }
    }

    let datosMascotaRegistro = null;

    if (rol === "dueño" && registrarMascota) {
      const nombreMascota = mascota.nombreMascota.trim();
      const especie = mascota.especie;
      const raza = mascota.raza.trim();
      const edad = mascota.edadMascota !== "" ? Number(mascota.edadMascota) : null;

      if (!nombreMascota || !especie) {
        mostrarMensaje("Completá el nombre y la especie de la mascota.");
        return;
      }

      let condicion = null;
      let alergias = null;
      let vacunacion = null;
      let reactividad = null;
      let alertaDueno = null;

      if (completarFicha) {
        condicion = mascota.condicion.trim();
        alergias = mascota.alergias.trim();
        vacunacion = mascota.vacunacion;
        reactividad = mascota.reactividad;
        alertaDueno = mascota.alertaGeneral.trim();

        if (!condicion || !alergias || !vacunacion || !reactividad || !alertaDueno) {
          mostrarMensaje(
            "Completá todos los datos de la ficha de salud o elegí completarla más adelante."
          );
          return;
        }
      }

      datosMascotaRegistro = {
        nombre: nombreMascota,
        especie,
        raza: raza || null,
        edad,
        descripcion: null,
        condicion,
        alergias,
        vacunacion,
        reactividad,
        alertaDueno
      };
    }

    const datosUsuario = {
      nombre,
      apellido,
      dni,
      fechaNacimiento,
      telefono,
      email,
      password,
      rol,
      zona,
      servicios,
      vehiculo
    };

    try {
      const { ok, datos: resultadoUsuario } = await enviarJson("/api/users", "POST", datosUsuario);

      if (!ok) {
        mostrarMensaje(resultadoUsuario.mensaje || "No se pudo registrar el usuario.");
        return;
      }

      const usuarioCreado = resultadoUsuario.usuario;

      if (datosMascotaRegistro) {
        const { ok: mascotaCreada } = await enviarJson("/api/mascotas", "POST", {
          ...datosMascotaRegistro,
          userId: usuarioCreado.id
        });

        if (!mascotaCreada) {
          mostrarMensaje(
            "La cuenta se creó, pero no se pudo registrar la mascota. Podés agregarla después desde 'Mis mascotas'.",
            "warning"
          );
          return;
        }
      }

      mostrarMensaje(
        "¡Registro completado correctamente! Redirigiendo al inicio de sesión...",
        "success"
      );

      reiniciarFormulario();

      setTimeout(() => {
        navegar(RUTAS.login);
      }, 1500);
    } catch (error) {
      console.error("Error durante el registro:", error);

      mostrarMensaje(
        "No se pudo conectar con el servidor. Verificá que el backend esté ejecutándose."
      );
    }
  };

  const incluyeTraslado = prestador.servicios.includes("Traslado");

  return (
    <>
      <BarraMarca />

      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h1 className="fw-bold">Crear cuenta</h1>
                  <p className="text-secondary">Completá tus datos para registrarte en Pac-Cop.</p>
                </div>

                <form onSubmit={enviar}>
                  <h4 className="mb-3">Datos personales</h4>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="nombre" className="form-label">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        className="form-control"
                        required
                        value={datos.nombre}
                        onChange={cambiarDato("nombre")}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="apellido" className="form-label">
                        Apellido
                      </label>
                      <input
                        type="text"
                        id="apellido"
                        className="form-control"
                        required
                        value={datos.apellido}
                        onChange={cambiarDato("apellido")}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="dni" className="form-label">
                        DNI
                      </label>
                      <input
                        type="text"
                        id="dni"
                        className="form-control"
                        required
                        value={datos.dni}
                        onChange={cambiarDato("dni")}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="fechaNacimiento" className="form-label">
                        Fecha de nacimiento
                      </label>
                      <input
                        type="date"
                        id="fechaNacimiento"
                        className="form-control"
                        required
                        value={datos.fechaNacimiento}
                        onChange={cambiarDato("fechaNacimiento")}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="telefono" className="form-label">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        className="form-control"
                        required
                        value={datos.telefono}
                        onChange={cambiarDato("telefono")}
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        required
                        value={datos.email}
                        onChange={cambiarDato("email")}
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="password" className="form-label">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        id="password"
                        className="form-control"
                        required
                        value={datos.password}
                        onChange={cambiarDato("password")}
                      />
                    </div>
                  </div>

                  <hr className="my-4" />

                  <h4 className="mb-3">Tipo de cuenta</h4>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rol"
                      id="dueno"
                      value="dueño"
                      required
                      checked={rol === "dueño"}
                      onChange={() => cambiarRol("dueño")}
                    />
                    <label className="form-check-label" htmlFor="dueno">
                      Dueño de mascota
                    </label>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="rol"
                      id="prestador"
                      value="prestador"
                      checked={rol === "prestador"}
                      onChange={() => cambiarRol("prestador")}
                    />
                    <label className="form-check-label" htmlFor="prestador">
                      Prestador de servicios
                    </label>
                  </div>

                  {rol === "dueño" && (
                    <div>
                      <hr className="my-4" />
                      <h4 className="mb-3">Mascota</h4>
                      <p className="text-secondary">
                        Podés registrar una mascota ahora o hacerlo más adelante.
                      </p>

                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="registrarMascota"
                          id="mascotaAhora"
                          value="si"
                          checked={registrarMascota}
                          onChange={() => cambiarRegistrarMascota(true)}
                        />
                        <label className="form-check-label" htmlFor="mascotaAhora">
                          Quiero registrar una mascota ahora
                        </label>
                      </div>

                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="registrarMascota"
                          id="mascotaDespues"
                          value="no"
                          checked={!registrarMascota}
                          onChange={() => cambiarRegistrarMascota(false)}
                        />
                        <label className="form-check-label" htmlFor="mascotaDespues">
                          Lo haré más adelante
                        </label>
                      </div>

                      {registrarMascota && (
                        <div>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label htmlFor="nombreMascota" className="form-label">
                                Nombre de la mascota
                              </label>
                              <input
                                type="text"
                                id="nombreMascota"
                                className="form-control"
                                value={mascota.nombreMascota}
                                onChange={cambiarMascota("nombreMascota")}
                              />
                            </div>

                            <div className="col-md-6">
                              <label htmlFor="especie" className="form-label">
                                Especie
                              </label>
                              <select
                                id="especie"
                                className="form-select"
                                value={mascota.especie}
                                onChange={cambiarMascota("especie")}
                              >
                                <option value="">Seleccionar...</option>
                                <option value="Perro">Perro</option>
                                <option value="Gato">Gato</option>
                                <option value="Tortuga">Tortuga</option>
                                <option value="Loro">Loro</option>
                                <option value="Conejo">Conejo</option>
                                <option value="Hámster">Hámster</option>
                                <option value="Pez">Pez</option>
                                <option value="Serpiente">Serpiente</option>
                              </select>
                            </div>

                            <div className="col-md-6">
                              <label htmlFor="raza" className="form-label">
                                Raza
                              </label>
                              <input
                                type="text"
                                id="raza"
                                className="form-control"
                                value={mascota.raza}
                                onChange={cambiarMascota("raza")}
                              />
                            </div>

                            <div className="col-md-6">
                              <label htmlFor="edadMascota" className="form-label">
                                Edad (años)
                              </label>
                              <input
                                type="number"
                                id="edadMascota"
                                className="form-control"
                                min="0"
                                value={mascota.edadMascota}
                                onChange={cambiarMascota("edadMascota")}
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <h5>Ficha de salud</h5>
                            <p className="text-secondary">
                              Es opcional. Podés completarla ahora o hacerlo más adelante.
                            </p>

                            <div className="form-check mb-3">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="fichaSalud"
                                id="fichaAhora"
                                value="si"
                                checked={completarFicha}
                                onChange={() => setCompletarFicha(true)}
                              />
                              <label className="form-check-label" htmlFor="fichaAhora">
                                Quiero completar la ficha de salud ahora
                              </label>
                            </div>

                            <div className="form-check mb-3">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="fichaSalud"
                                id="fichaDespues"
                                value="no"
                                checked={!completarFicha}
                                onChange={() => setCompletarFicha(false)}
                              />
                              <label className="form-check-label" htmlFor="fichaDespues">
                                La completaré más adelante
                              </label>
                            </div>

                            {completarFicha && (
                              <div className="row g-3">
                                <div className="col-12">
                                  <label htmlFor="condicion" className="form-label">
                                    Condición médica
                                  </label>
                                  <textarea
                                    id="condicion"
                                    className="form-control"
                                    rows="2"
                                    placeholder="Indicá si tiene alguna condición médica"
                                    value={mascota.condicion}
                                    onChange={cambiarMascota("condicion")}
                                  ></textarea>
                                </div>

                                <div className="col-12">
                                  <label htmlFor="alergias" className="form-label">
                                    Alergias
                                  </label>
                                  <textarea
                                    id="alergias"
                                    className="form-control"
                                    rows="2"
                                    placeholder="Indicá si tiene alguna alergia"
                                    value={mascota.alergias}
                                    onChange={cambiarMascota("alergias")}
                                  ></textarea>
                                </div>

                                <div className="col-md-6">
                                  <label htmlFor="vacunacion" className="form-label">
                                    Vacunación
                                  </label>
                                  <select
                                    id="vacunacion"
                                    className="form-select"
                                    value={mascota.vacunacion}
                                    onChange={cambiarMascota("vacunacion")}
                                  >
                                    <option value="">Seleccione...</option>
                                    <option value="Completo">Completo</option>
                                    <option value="Incompleto">Incompleto</option>
                                    <option value="No vacunado">No vacunado</option>
                                  </select>
                                </div>

                                <div className="col-md-6">
                                  <label htmlFor="reactividad" className="form-label">
                                    Reactividad
                                  </label>
                                  <select
                                    id="reactividad"
                                    className="form-select"
                                    value={mascota.reactividad}
                                    onChange={cambiarMascota("reactividad")}
                                  >
                                    <option value="">Seleccione...</option>
                                    <option value="Tranquilo">Tranquilo</option>
                                    <option value="Reactivo a otros perros">
                                      Reactivo a otros perros
                                    </option>
                                    <option value="Miedoso / Asustadizo">
                                      Miedoso / Asustadizo
                                    </option>
                                  </select>
                                </div>

                                <div className="col-12">
                                  <label htmlFor="alertaGeneral" className="form-label">
                                    Alertas para el prestador
                                  </label>
                                  <textarea
                                    id="alertaGeneral"
                                    className="form-control"
                                    rows="3"
                                    placeholder="Ej: Toma medicación a las 18hs, muerde si se asusta, alergia al pollo..."
                                    value={mascota.alertaGeneral}
                                    onChange={cambiarMascota("alertaGeneral")}
                                  ></textarea>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {rol === "prestador" && (
                    <div>
                      <hr className="my-4" />
                      <h4 className="mb-3">Servicios</h4>
                      <p className="text-secondary">Seleccioná los servicios que ofrecés.</p>

                      <div className="form-check">
                        <input
                          className="form-check-input servicio"
                          type="checkbox"
                          value="Paseo"
                          id="paseo"
                          checked={prestador.servicios.includes("Paseo")}
                          onChange={cambiarServicio("Paseo")}
                        />
                        <label className="form-check-label" htmlFor="paseo">
                          Paseo de mascotas
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input servicio"
                          type="checkbox"
                          value="Guarderia"
                          id="guarderia"
                          checked={prestador.servicios.includes("Guarderia")}
                          onChange={cambiarServicio("Guarderia")}
                        />
                        <label className="form-check-label" htmlFor="guarderia">
                          Guardería de mascotas
                        </label>
                      </div>

                      <div className="form-check mb-3">
                        <input
                          className="form-check-input servicio"
                          type="checkbox"
                          value="Traslado"
                          id="traslado"
                          checked={incluyeTraslado}
                          onChange={cambiarServicio("Traslado")}
                        />
                        <label className="form-check-label" htmlFor="traslado">
                          Traslado de mascotas
                        </label>
                      </div>

                      {incluyeTraslado && (
                        <div className="mt-3">
                          <label className="form-label">Tipo de vehículo</label>

                          {["Moto", "Auto", "Camioneta"].map((tipo, indice, lista) => (
                            <div
                              key={tipo}
                              className={`form-check${indice === lista.length - 1 ? " mb-3" : ""}`}
                            >
                              <input
                                className="form-check-input"
                                type="radio"
                                name="vehiculo"
                                id={tipo.toLowerCase()}
                                value={tipo}
                                checked={prestador.vehiculo === tipo}
                                onChange={() =>
                                  setPrestador((anterior) => ({ ...anterior, vehiculo: tipo }))
                                }
                              />
                              <label className="form-check-label" htmlFor={tipo.toLowerCase()}>
                                {tipo}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mb-3">
                        <label htmlFor="zona" className="form-label">
                          Zona donde trabaja
                        </label>
                        <input
                          type="text"
                          id="zona"
                          className="form-control"
                          placeholder="Ej: Centro, Liborsi..."
                          value={prestador.zona}
                          onChange={(evento) =>
                            setPrestador((anterior) => ({ ...anterior, zona: evento.target.value }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {aviso && (
                    <div className="mt-4">
                      <div className={`alert alert-${aviso.tipo}`}>{aviso.texto}</div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary w-100 mt-3">
                    Crear cuenta
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
