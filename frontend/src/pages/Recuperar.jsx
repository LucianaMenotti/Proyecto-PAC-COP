import { useState } from "react";
import { Link } from "react-router-dom";
import BarraMarca from "../components/BarraMarca";
import { enviarJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

// Paso 1 de la recuperación de contraseña: POST /api/users/recuperar { email }
// El backend envía por correo un enlace a /restablecer?token=... (válido 30 minutos, un solo uso).
export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useBootstrap();
  useEstilos("base", estilosBase);

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);

    try {
      const { ok, datos } = await enviarJson("/api/users/recuperar", "POST", { email: email.trim() });

      setAviso({
        tipo: ok ? "success" : "danger",
        texto: datos.mensaje || "No se pudo procesar la solicitud."
      });

      if (ok) {
        setEmail("");
      }
    } catch {
      setAviso({ tipo: "danger", texto: "No se pudo procesar la solicitud." });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <BarraMarca />

      <main className="container">
        <div className="form-container">
          <div className="text-center mb-4">
            <h1 className="fw-bold">Recuperar contraseña</h1>
            <p className="text-secondary">
              Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={enviar}>
            <div className="mb-4">
              <label className="form-label" htmlFor="email">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                required
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              Enviar enlace
            </button>
          </form>

          {aviso && (
            <div className="mt-3">
              <div className={`alert alert-${aviso.tipo}`}>{aviso.texto}</div>
            </div>
          )}

          <div className="text-center mt-4">
            <Link to={RUTAS.login}>Volver a iniciar sesión</Link>
          </div>
        </div>
      </main>
    </>
  );
}
