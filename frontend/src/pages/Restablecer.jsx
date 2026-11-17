import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { enviarJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

// Paso 2 de la recuperación: el enlace del correo abre /restablecer?token=...
// POST /api/users/restablecer { token, password } (mínimo 8 caracteres)
export default function Restablecer() {
  const [parametros] = useSearchParams();
  const token = parametros.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [aviso, setAviso] = useState(
    token ? null : { tipo: "danger", texto: "El enlace no es válido o está incompleto." }
  );
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  useEstilos("base", estilosBase);

  const enviar = async (evento) => {
    evento.preventDefault();

    if (password !== confirmar) {
      setAviso({ tipo: "danger", texto: "Las contraseñas no coinciden." });
      return;
    }

    setEnviando(true);

    try {
      const { ok, datos } = await enviarJson("/api/users/restablecer", "POST", { token, password });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo restablecer la contraseña");
      }

      setAviso({ tipo: "success", texto: `${datos.mensaje}. Ya podés iniciar sesión.` });
      setPassword("");
      setConfirmar("");
      setListo(true);
    } catch (fallo) {
      setAviso({ tipo: "danger", texto: fallo.message });
      setEnviando(false);
    }
  };

  return (
    <>

      <main className="container">
        <div className="form-container">
          <div className="text-center mb-4">
            <h1>Restablecer contraseña</h1>
            <p className="text-secondary">Elegí una nueva contraseña para tu cuenta.</p>
          </div>

          <form onSubmit={enviar}>
            <div className="mb-3">
              <label className="form-label" htmlFor="password">
                Nueva contraseña
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                minLength={8}
                required
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="confirmar">
                Repetir contraseña
              </label>
              <input
                type="password"
                id="confirmar"
                className="form-control"
                minLength={8}
                required
                value={confirmar}
                onChange={(evento) => setConfirmar(evento.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={!token || enviando || listo}
            >
              Guardar contraseña
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
