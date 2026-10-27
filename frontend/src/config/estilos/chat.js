const estilos = String.raw`
.chat-app {
  --chat-primario: #4f46e5;
  --chat-primario-oscuro: #4338ca;
  --chat-fondo: #f4f6f8;
  --chat-propio: #4f46e5;
  --chat-ajeno: #ffffff;
  --chat-borde: #e5e7eb;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  max-width: 800px;
  margin: 0 auto;
  background: var(--chat-fondo);
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  border-left: 1px solid var(--chat-borde);
  border-right: 1px solid var(--chat-borde);
}

.chat-app *,
.chat-app *::before,
.chat-app *::after {
  box-sizing: border-box;
}

.chat-app [hidden] {
  display: none !important;
}

.chat-encabezado {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid var(--chat-borde);
}

.chat-volver {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #374151;
  text-decoration: none;
  font-size: 1.25rem;
}

.chat-volver:hover {
  background: #f3f4f6;
}

.chat-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e0e7ff;
  color: var(--chat-primario);
  font-weight: 700;
}

.chat-contacto {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-contacto-nombre {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-contacto-detalle {
  font-size: 0.78rem;
  color: #6b7280;
}

.chat-hilo {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
}

.chat-vacio,
.chat-error {
  margin: auto;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  text-align: center;
}

.chat-vacio {
  color: #6b7280;
  background: #ffffff;
}

.chat-error {
  color: #991b1b;
  background: #fee2e2;
}

.chat-fila {
  display: flex;
}

.chat-fila.propio {
  justify-content: flex-end;
}

.chat-burbuja {
  max-width: 78%;
  padding: 0.5rem 0.75rem 0.4rem;
  border-radius: 14px;
  background: var(--chat-ajeno);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
  word-break: break-word;
  white-space: pre-wrap;
}

.chat-fila.propio .chat-burbuja {
  background: var(--chat-propio);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.chat-fila.ajeno .chat-burbuja {
  border-bottom-left-radius: 4px;
}

.chat-burbuja.con-imagen {
  padding: 0.3rem 0.3rem 0.4rem;
}

.chat-burbuja.con-imagen .chat-texto,
.chat-burbuja.con-imagen .chat-meta {
  padding: 0 0.45rem;
}

.chat-imagen {
  display: block;
  width: 100%;
  max-width: 320px;
  max-height: 360px;
  object-fit: cover;
  border-radius: 10px;
  cursor: zoom-in;
  background: #e5e7eb;
}

.chat-texto {
  margin-top: 0.3rem;
}

.chat-burbuja:not(.con-imagen) .chat-texto {
  margin-top: 0;
}

.chat-meta {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.2rem;
  font-size: 0.7rem;
  opacity: 0.75;
}

.chat-ubicacion {
  margin-right: auto;
}

.chat-formulario {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: #ffffff;
  border-top: 1px solid var(--chat-borde);
}

.chat-formulario textarea {
  flex: 1;
  resize: none;
  max-height: 110px;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--chat-borde);
  border-radius: 20px;
  font: inherit;
  line-height: 1.3;
  outline: none;
}

.chat-formulario textarea:focus {
  border-color: var(--chat-primario);
}

.chat-boton-icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
}

.chat-boton-icono:hover {
  background: #f3f4f6;
}

.chat-boton-icono.enviar {
  background: var(--chat-primario);
  color: #ffffff;
}

.chat-boton-icono.enviar:hover {
  background: var(--chat-primario-oscuro);
}

.chat-boton-icono:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-capa {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.92);
}

.chat-capa-contenido {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  height: 100%;
}

.chat-capa video,
.chat-capa .chat-capa-imagen {
  width: 100%;
  flex: 1;
  min-height: 0;
  object-fit: contain;
}

.chat-capa video {
  object-fit: cover;
}

.chat-capa-barra {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  font-size: 0.8rem;
}

.chat-capa-controles {
  position: absolute;
  bottom: 1.5rem;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 1rem;
}

.chat-obturador {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.45);
  background: #ffffff;
  cursor: pointer;
}

.chat-capa-icono {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 1.1rem;
  cursor: pointer;
}

.chat-camara-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.85);
}

.chat-boton {
  padding: 0.6rem 1.1rem;
  border: none;
  border-radius: 10px;
  background: #ffffff;
  color: #1f2937;
  font-weight: 600;
  cursor: pointer;
}

.chat-boton.primario {
  background: var(--chat-primario);
  color: #ffffff;
}

.chat-previa-pie {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #111827;
}

.chat-previa-pie input {
  padding: 0.65rem 0.9rem;
  border: none;
  border-radius: 20px;
  font: inherit;
  outline: none;
}

.chat-previa-acciones {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.chat-previa-info {
  display: flex;
  justify-content: space-between;
  color: #d1d5db;
  font-size: 0.8rem;
}

@media (min-width: 600px) {
  .chat-app {
    height: calc(100vh - 2rem);
    height: calc(100dvh - 2rem);
    margin-top: 1rem;
    border-radius: 12px;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
}
`;

export default estilos;
