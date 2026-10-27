import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BarraMarca from "../components/BarraMarca";
import { apiJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

export default function MisMascotas() {
  const { usuario } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [aviso, setAviso] = useState(null);

  useBootstrap();
  useEstilos("base", estilosBase);

  useEffect(() => {
    const cargarMascotas = async () => {
      try {
        const { ok, datos } = await apiJson(`/api/mascotas/usuario/${usuario.id}`);

        if (!ok) {
          throw new Error("No se pudieron obtener las mascotas");
        }

        setMascotas(datos);

        if (datos.length === 0) {
          setAviso({
            tipo: "info",
            texto:
              "Todavía no tenés mascotas registradas. Podés agregar una usando el botón de abajo."
          });
        } else {
          setAviso(null);
        }
      } catch (error) {
        console.error("Error al cargar mascotas:", error);
        setAviso({ tipo: "danger", texto: "No se pudieron cargar las mascotas." });
      }
    };

    cargarMascotas();
  }, [usuario.id]);

  return (
    <>
      <BarraMarca />

      <main className="container py-5">
        <div className="text-center mb-5">
          <h1 className="fw-bold">Mis mascotas</h1>
          <p className="text-secondary">Administrá las mascotas de tu cuenta.</p>
        </div>

        {aviso && (
          <div className="mb-4">
            <div className={`alert alert-${aviso.tipo}`}>{aviso.texto}</div>
          </div>
        )}

        <div className="row g-4">
          {mascotas.map((mascota) => {
            const fichaCompleta =
              mascota.condicion ||
              mascota.alergias ||
              mascota.vacunacion ||
              mascota.reactividad ||
              mascota.alertaDueno;

            return (
              <div className="col-md-6 col-lg-4" key={mascota.id}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <h4 className="fw-bold">{mascota.nombre}</h4>
                    <p>
                      <strong>Especie:</strong> {mascota.especie}
                    </p>
                    <p>
                      <strong>Raza:</strong> {mascota.raza || "No especificada"}
                    </p>
                    <p>
                      <strong>Edad:</strong> {mascota.edad ?? "No especificada"}
                    </p>

                    {mascota.descripcion && <p className="text-secondary">{mascota.descripcion}</p>}

                    <hr />

                    <Link
                      to={`${RUTAS.fichaSalud}?id=${mascota.id}`}
                      className="btn btn-outline-primary w-100"
                    >
                      {fichaCompleta ? "Editar ficha de salud" : "Completar ficha de salud"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-5">
          <Link to={RUTAS.registroMascota} className="btn btn-primary">
            + Agregar mascota
          </Link>
        </div>
      </main>
    </>
  );
}
