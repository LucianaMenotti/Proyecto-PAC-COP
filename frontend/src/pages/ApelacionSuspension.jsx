import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RUTAS } from "../config/rutas";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

const WHATSAPP_EMPRESA = String(import.meta.env.VITE_EMPRESA_WHATSAPP || "").replace(/\D/g, "");

export default function ApelacionSuspension() {
  const [parametros] = useSearchParams();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState(parametros.get("email") || "");
  const [detalle, setDetalle] = useState("");
  useEstilos("base", estilosBase);

  const mensaje = [
    "Solicitud de revisión de cuenta suspendida",
    `Nombre: ${nombre.trim()}`,
    `Correo de la cuenta: ${email.trim()}`,
    `Motivo: ${detalle.trim()}`,
  ].join("\n");

  const enlaceWhatsApp = WHATSAPP_EMPRESA
    ? `https://wa.me/${WHATSAPP_EMPRESA}?text=${encodeURIComponent(mensaje)}`
    : "";

  const enviar = (evento) => {
    evento.preventDefault();
    if (enlaceWhatsApp) window.open(enlaceWhatsApp, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="container py-5">
      <div className="form-container">
        <div className="text-center mb-4">
          <h1>Solicitar revisión de suspensión</h1>
          <p className="text-secondary">
            Completá los datos y se abrirá WhatsApp con un mensaje preparado para administración.
          </p>
        </div>

        <form onSubmit={enviar}>
          <div className="mb-3">
            <label className="form-label" htmlFor="apelacion-nombre">Nombre y apellido</label>
            <input id="apelacion-nombre" className="form-control" required maxLength={120} value={nombre} onChange={(evento) => setNombre(evento.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="apelacion-email">Correo de la cuenta suspendida</label>
            <input id="apelacion-email" type="email" className="form-control" required maxLength={255} value={email} onChange={(evento) => setEmail(evento.target.value)} />
          </div>
          <div className="mb-4">
            <label className="form-label" htmlFor="apelacion-detalle">Motivo de la solicitud</label>
            <textarea id="apelacion-detalle" className="form-control" required minLength={10} maxLength={1500} rows={5} value={detalle} onChange={(evento) => setDetalle(evento.target.value)} placeholder="Explicá por qué solicitás que revisemos la suspensión." />
          </div>

          {WHATSAPP_EMPRESA ? (
            <button className="btn btn-primary w-100" type="submit">
              Enviar solicitud por WhatsApp
            </button>
          ) : (
            <div className="alert alert-warning mb-0">
              El WhatsApp de la empresa todavía no está configurado. Administración debe definir
              <code> VITE_EMPRESA_WHATSAPP</code> en el entorno del frontend.
            </div>
          )}
        </form>

        <div className="text-center mt-4">
          <Link to={RUTAS.login}>Volver al inicio de sesión</Link>
        </div>
      </div>
    </main>
  );
}
