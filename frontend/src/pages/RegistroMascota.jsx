import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvisoAlerta from "../components/AvisoAlerta";
import BarraMarca from "../components/BarraMarca";
import { enviarJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

const FORMULARIO_INICIAL = {
  nombreMascota: "",
  especie: "",
  raza: "",
  edad: "",
  descripcion: "",
  condicion: "",
  alergias: "",
  vacunacion: "",
  reactividad: "",
  alertaGeneral: ""
};

export default function RegistroMascota() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [completarFicha, setCompletarFicha] = useState(false);
  const [aviso, setAviso] = useState(null);

  useBootstrap();
  useEstilos("base", estilosBase);

  const cambiar = (campo) => (evento) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: evento.target.value }));
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setAviso(null);

    const nombre = formulario.nombreMascota.trim();
    const especie = formulario.especie;
    const raza = formulario.raza.trim();
    const edad = formulario.edad !== "" ? Number(formulario.edad) : null;
    const descripcion = formulario.descripcion.trim();

    if (!nombre || !especie) {
      setAviso({ texto: "Completá el nombre y la especie de la mascota.", tipo: "danger" });
      return;
    }

    let condicion = null;
    let alergias = null;
    let vacunacion = null;
    let reactividad = null;
    let alertaDueno = null;

    if (completarFicha) {
      condicion = formulario.condicion.trim();
      alergias = formulario.alergias.trim();
      vacunacion = formulario.vacunacion;
      reactividad = formulario.reactividad;
      alertaDueno = formulario.alertaGeneral.trim();

      if (!condicion || !alergias || !vacunacion || !reactividad || !alertaDueno) {
        setAviso({
          texto: "Completá todos los datos de la ficha de salud o elegí completarla más adelante.",
          tipo: "danger"
        });
        return;
      }
    }

    const datos = {
      nombre,
      especie,
      raza: raza || null,
      edad,
      descripcion: descripcion || null,
      condicion,
      alergias,
      vacunacion,
      reactividad,
      alertaDueno,
      userId: usuario.id
    };

    try {
      const { ok, datos: resultado } = await enviarJson("/api/mascotas", "POST", datos);

      if (!ok) {
        setAviso({
          texto: resultado.mensaje || "No se pudo registrar la mascota.",
          tipo: "danger"
        });
        return;
      }

      setAviso({
        texto: completarFicha
          ? "¡Mascota y ficha de salud registradas correctamente!"
          : "¡Mascota registrada correctamente! Podés completar la ficha de salud más adelante.",
        tipo: "success"
      });

      setFormulario(FORMULARIO_INICIAL);
      setCompletarFicha(false);

      setTimeout(() => {
        navegar(RUTAS.misMascotas);
      }, 1200);
    } catch (error) {
      console.error("Error al registrar mascota:", error);
      setAviso({
        texto: "No se pudo conectar con el servidor. Verificá que el backend esté ejecutándose.",
        tipo: "danger"
      });
    }
  };

  return (
    <>
      <BarraMarca />

      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h1 className="fw-bold">Registrar mascota</h1>
                  <p className="text-secondary">Agregá información de tu mascota.</p>
                </div>

                <form onSubmit={enviar}>
                  <h4 className="mb-3">Datos de la mascota</h4>

                  <div className="mb-3">
                    <label htmlFor="nombreMascota" className="form-label">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="nombreMascota"
                      className="form-control"
                      required
                      value={formulario.nombreMascota}
                      onChange={cambiar("nombreMascota")}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="especie" className="form-label">
                      Especie
                    </label>
                    <select
                      id="especie"
                      className="form-select"
                      required
                      value={formulario.especie}
                      onChange={cambiar("especie")}
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

                  <div className="mb-3">
                    <label htmlFor="raza" className="form-label">
                      Raza
                    </label>
                    <input
                      type="text"
                      id="raza"
                      className="form-control"
                      value={formulario.raza}
                      onChange={cambiar("raza")}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="edad" className="form-label">
                      Edad
                    </label>
                    <input
                      type="number"
                      id="edad"
                      className="form-control"
                      min="0"
                      required
                      value={formulario.edad}
                      onChange={cambiar("edad")}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="descripcion" className="form-label">
                      Descripción
                    </label>
                    <textarea
                      id="descripcion"
                      className="form-control"
                      rows="3"
                      placeholder="Contanos brevemente sobre tu mascota..."
                      value={formulario.descripcion}
                      onChange={cambiar("descripcion")}
                    ></textarea>
                  </div>

                  <hr className="my-4" />

                  <h4 className="mb-3">Ficha de salud</h4>
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
                    <div>
                      <div className="mb-3">
                        <label htmlFor="condicion" className="form-label">
                          Condición médica
                        </label>
                        <textarea
                          id="condicion"
                          className="form-control"
                          rows="2"
                          placeholder="Indicá si tiene alguna condición médica"
                          value={formulario.condicion}
                          onChange={cambiar("condicion")}
                        ></textarea>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="alergias" className="form-label">
                          Alergias
                        </label>
                        <textarea
                          id="alergias"
                          className="form-control"
                          rows="2"
                          placeholder="Indicá si tiene alguna alergia"
                          value={formulario.alergias}
                          onChange={cambiar("alergias")}
                        ></textarea>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="vacunacion" className="form-label">
                          Vacunación
                        </label>
                        <select
                          id="vacunacion"
                          className="form-select"
                          value={formulario.vacunacion}
                          onChange={cambiar("vacunacion")}
                        >
                          <option value="">Seleccione...</option>
                          <option value="Completo">Completo</option>
                          <option value="Incompleto">Incompleto</option>
                          <option value="No vacunado">No vacunado</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="reactividad" className="form-label">
                          Reactividad
                        </label>
                        <select
                          id="reactividad"
                          className="form-select"
                          value={formulario.reactividad}
                          onChange={cambiar("reactividad")}
                        >
                          <option value="">Seleccione...</option>
                          <option value="Tranquilo">Tranquilo</option>
                          <option value="Reactivo a otros perros">Reactivo a otros perros</option>
                          <option value="Miedoso / Asustadizo">Miedoso / Asustadizo</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="alertaGeneral" className="form-label">
                          Alertas para el prestador
                        </label>
                        <textarea
                          id="alertaGeneral"
                          className="form-control"
                          rows="3"
                          placeholder="Ej: Toma medicación a las 18 hs, necesita evitar ciertos alimentos..."
                          value={formulario.alertaGeneral}
                          onChange={cambiar("alertaGeneral")}
                        ></textarea>
                      </div>
                    </div>
                  )}

                  <AvisoAlerta aviso={aviso} clase="mt-4" />

                  <button type="submit" className="btn btn-primary w-100 mt-3">
                    Guardar mascota
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
