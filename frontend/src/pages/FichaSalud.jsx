import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AvisoAlerta from "../components/AvisoAlerta";
import { apiJson, enviarJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { useAuth } from "../hooks/useAuth";
import { useEstilos } from "../hooks/useEstilos";
import estilosFichaSalud from "../config/estilos/fichaSalud";

const FICHA_INICIAL = {
  condicion: "",
  alergias: "",
  vacunacion: "",
  reactividad: "",
  alertaGeneral: ""
};

export default function FichaSalud() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const mascotaId = parametros.get("id");
  const [nombreMascota, setNombreMascota] = useState("tu mascota");
  const [ficha, setFicha] = useState(FICHA_INICIAL);
  const [aviso, setAviso] = useState(null);
  const [formularioVisible, setFormularioVisible] = useState(true);

  useEstilos("ficha-salud", estilosFichaSalud);

  useEffect(() => {
    const ocultarConAviso = (texto) => {
      setAviso({ texto, tipo: "danger" });
      setFormularioVisible(false);
    };

    const cargarMascota = async () => {
      if (!mascotaId) {
        ocultarConAviso("No se indicó qué mascota se quiere modificar.");
        return;
      }

      try {
        const { ok, datos: mascota } = await apiJson(`/api/mascotas/${mascotaId}`);

        if (!ok) {
          ocultarConAviso(mascota.mensaje || "No se pudo obtener la mascota.");
          return;
        }

        if (Number(mascota.userId) !== Number(usuario.id)) {
          ocultarConAviso("No tenés permiso para modificar esta mascota.");
          return;
        }

        setNombreMascota(mascota.nombre);
        setFicha({
          condicion: mascota.condicion || "",
          alergias: mascota.alergias || "",
          vacunacion: mascota.vacunacion || "",
          reactividad: mascota.reactividad || "",
          alertaGeneral: mascota.alertaDueno || ""
        });
      } catch (error) {
        console.error("Error al obtener la mascota:", error);
        ocultarConAviso("No se pudo conectar con el servidor.");
      }
    };

    cargarMascota();
  }, [mascotaId, usuario.id]);

  const cambiar = (campo) => (evento) => {
    setFicha((anterior) => ({ ...anterior, [campo]: evento.target.value }));
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setAviso(null);

    const datosFicha = {
      condicion: ficha.condicion.trim(),
      alergias: ficha.alergias.trim(),
      vacunacion: ficha.vacunacion,
      reactividad: ficha.reactividad,
      alertaDueno: ficha.alertaGeneral.trim()
    };

    if (
      !datosFicha.condicion ||
      !datosFicha.alergias ||
      !datosFicha.vacunacion ||
      !datosFicha.reactividad ||
      !datosFicha.alertaDueno
    ) {
      setAviso({ texto: "Completá todos los campos de la ficha de salud.", tipo: "danger" });
      return;
    }

    try {
      const { ok, datos } = await enviarJson(`/api/mascotas/${mascotaId}`, "PUT", datosFicha);

      if (!ok) {
        setAviso({
          texto: datos.mensaje || "No se pudo guardar la ficha de salud.",
          tipo: "danger"
        });
        return;
      }

      setAviso({ texto: "¡Ficha de salud guardada correctamente!", tipo: "success" });

      setTimeout(() => {
        navegar(RUTAS.misMascotas);
      }, 1200);
    } catch (error) {
      console.error("Error al guardar la ficha:", error);
      setAviso({ texto: "No se pudo conectar con el servidor.", tipo: "danger" });
    }
  };

  return (
    <div id="vista-dueno" className="dashboard-form">
      <header className="form-header">
        <h1>Ficha de Salud</h1>

        <p>
          Completá la información de salud de <strong>{nombreMascota}</strong>.
        </p>

        <p>
          Esta información ayuda al prestador a conocer las necesidades de tu mascota durante el
          servicio.
        </p>
      </header>

      {formularioVisible && (
        <form id="health-form" onSubmit={guardar}>
          <fieldset className="normal-fieldset">
            <legend>Datos de Salud</legend>

            <div className="form-group">
              <label htmlFor="condicion">Condición Médica:</label>
              <textarea
                id="condicion"
                name="condicion"
                placeholder="Indique si tiene alguna condición médica o enfermedad."
                required
                value={ficha.condicion}
                onChange={cambiar("condicion")}
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="alergias">Alergias:</label>
              <textarea
                id="alergias"
                name="alergias"
                placeholder="Indique si tiene alergias conocidas."
                required
                value={ficha.alergias}
                onChange={cambiar("alergias")}
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="vacunacion">Vacunación:</label>
              <select
                id="vacunacion"
                name="vacunacion"
                required
                value={ficha.vacunacion}
                onChange={cambiar("vacunacion")}
              >
                <option value="">Seleccione...</option>
                <option value="Completo">Completo</option>
                <option value="Incompleto">Incompleto</option>
                <option value="No vacunado">No vacunado</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reactividad">Reactividad:</label>
              <select
                id="reactividad"
                name="reactividad"
                required
                value={ficha.reactividad}
                onChange={cambiar("reactividad")}
              >
                <option value="">Seleccione...</option>
                <option value="Tranquilo">Tranquilo</option>
                <option value="Reactivo a otros perros">Reactivo a otros perros</option>
                <option value="Miedoso / Asustadizo">Miedoso / Asustadizo</option>
              </select>
            </div>
          </fieldset>

          <fieldset className="alert-fieldset">
            <legend>Alertas para el Prestador</legend>

            <div className="form-group">
              <label htmlFor="alerta-general">
                ¿Hay alguna alerta o indicación importante que el prestador deba saber?
              </label>
              <textarea
                id="alerta-general"
                name="alerta-general"
                placeholder="Ej: Toma medicación a las 18 hs, necesita evitar ciertos alimentos, etc."
                required
                value={ficha.alertaGeneral}
                onChange={cambiar("alertaGeneral")}
              ></textarea>
            </div>
          </fieldset>

          <AvisoAlerta aviso={aviso} />

          <button type="submit" className="btn-submit">
            Guardar Ficha de Salud
          </button>
        </form>
      )}

      {!formularioVisible && <AvisoAlerta aviso={aviso} />}
    </div>
  );
}
