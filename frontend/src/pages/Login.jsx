import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEstilos } from "../hooks/useEstilos";
import { RUTAS } from "../config/rutas";
import estilosBase from "../config/estilos/base";

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aviso, setAviso] = useState(null);
  const [cuentaSuspendida, setCuentaSuspendida] = useState(false);
  useEstilos("base", estilosBase);

  const enviar = async (evento) => {
    evento.preventDefault();

    try {
      const { ok, datos } = await iniciarSesion(email, password);

      if (!ok) {
        setCuentaSuspendida(Boolean(datos.suspendida));
        setAviso({
          tipo: "danger",
          texto: datos.mensaje || "Correo o contraseña incorrectos."
        });
        return;
      }

      setCuentaSuspendida(false);

      setAviso({ tipo: "success", texto: "Inicio de sesión correcto." });

      setTimeout(() => {
        navegar(datos.usuario.rol === "prestador" ? RUTAS.panelPrestador : RUTAS.cuenta, {
          replace: true
        });
      }, 500);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setAviso({ tipo: "danger", texto: "No se pudo conectar con el servidor." });
    }
  };

  return (
    <>
      <main className="container">
        <div className="form-container">
          <div className="text-center mb-4">
            <h1>Iniciar sesión</h1>
            <p className="text-secondary">Ingresá a tu cuenta de Pac-Cop.</p>
          </div>
          <form onSubmit={enviar}>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="password">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Iniciar sesión
            </button>
          </form>
          {aviso && (
            <div className="mt-3">
              <div className={`alert alert-${aviso.tipo}`}>{aviso.texto}</div>
            </div>
          )}
          {cuentaSuspendida && (
            <div className="alert alert-warning mt-3 mb-0">
              ¿Creés que la suspensión es un error?{" "}
              <Link to={`${RUTAS.apelacionSuspension}?email=${encodeURIComponent(email.trim())}`}>
                Enviar una solicitud a administración
              </Link>
              .
            </div>
          )}
          <p className="text-center mt-3 mb-0">
            <Link to={RUTAS.recuperar}>¿Olvidaste tu contraseña?</Link>
          </p>
          <div className="text-center mt-4">
            <p>¿Todavía no tenés una cuenta?</p>
            <Link to="/registro">Registrate</Link>
          </div>
        </div>
      </main>
    </>
  );
}
