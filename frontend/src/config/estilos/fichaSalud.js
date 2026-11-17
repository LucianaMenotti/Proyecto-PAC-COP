const estilos = String.raw`
.ficha-pagina #vista-dueno {
  background-color: var(--surface);
  width: 100%;
  max-width: 900px; 
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}
.ficha-pagina h1 {
  color: var(--pac-primary-text);
  margin-bottom: 8px;
  font-size: 1.75rem;
  text-align: center;
}
.ficha-pagina p {
  color: var(--text-muted);
  margin-bottom: 25px;
  font-size: 0.95rem;
  text-align: center;
}
.ficha-pagina fieldset {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.ficha-pagina legend {
  background-color: var(--pac-primary);
  color: #ffffff;
  padding: 4px 14px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}
.ficha-pagina label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  display: block;
}
.ficha-pagina input[type="text"],
.ficha-pagina input[type="number"],
.ficha-pagina select,
.ficha-pagina textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  background-color: var(--surface-2);
  transition: all 0.2s ease;
}
.ficha-pagina input:focus,
.ficha-pagina select:focus,
.ficha-pagina textarea:focus {
  outline: none;
  border-color: var(--pac-primary);
  background-color: var(--surface);
  box-shadow: 0 0 0 3px rgba(31, 122, 116, 0.15);
}
.ficha-pagina textarea {
  min-height: 80px;
  resize: vertical;
}
.ficha-pagina .alert-fieldset {
  background-color: var(--danger-soft);
  border-color: var(--danger-border);
}
.ficha-pagina .alert-fieldset legend {
  background-color: var(--pac-accent);
  color: #ffffff;
}
.ficha-pagina .alert-fieldset label {
  color: var(--danger-text);
}
.ficha-pagina .alert-fieldset textarea {
  border-color: var(--danger-border);
}
.ficha-pagina .alert-fieldset textarea:focus {
  border-color: var(--pac-accent);
  box-shadow: 0 0 0 3px rgba(255, 111, 82, 0.15);
}
.ficha-pagina button[type="submit"] {
  background-color: var(--pac-primary);
  color: #ffffff;
  border: none;
  padding: 14px 20px;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
  margin-top: 10px;
}
.ficha-pagina button[type="submit"]:hover {
  background-color: var(--pac-primary-dark);
}
.ficha-pagina button[type="submit"]:active {
  transform: translateY(2px);
}
.ficha-pagina .hidden {
  display: none !important;
}
.ficha-pagina #resumen-pantalla {
  background-color: var(--surface);
  width: 100%;
  max-width: 600px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}
.ficha-pagina #resumen-contenido {
  background-color: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}
.ficha-pagina #resumen-contenido p {
  text-align: left;
  margin-bottom: 12px;
  color: var(--text);
  font-size: 1rem;
}
.ficha-pagina #resumen-contenido span.label-resumen {
  font-weight: bold;
  color: var(--pac-primary-text);
  display: inline-block;
  min-width: 130px;
}
@media (min-width: 768px) {
  .ficha-pagina .normal-fieldset {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .ficha-pagina .normal-fieldset legend {
    grid-column: 1 / -1;
  }
  .ficha-pagina .normal-fieldset .form-group:nth-child(4),
.ficha-pagina .normal-fieldset .form-group:nth-child(5) {
    grid-column: 1 / -1;
  }
}
.ficha-pagina .botones-acciones {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
.ficha-pagina .btn-secondary {
  background-color: var(--text-muted);
  color: #ffffff;
  border: none;
  padding: 14px 20px;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}
.ficha-pagina .btn-secondary:hover {
  background-color: var(--text-muted);
}
.ficha-pagina .btn-secondary:active {
  transform: translateY(2px);
}
.ficha-pagina #btn-finalizar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.ficha-pagina {
  padding: 2.25rem 1.25rem 3rem;
  line-height: 1.5;
}
.ficha-pagina #vista-dueno,
.ficha-pagina #resumen-pantalla {
  margin: 0 auto;
}
.ficha-pagina legend {
  float: none;
  width: auto;
  margin-bottom: 0;
  line-height: 1.5;
}
.ficha-pagina h1 {
  color: var(--pac-primary-text);
}
.ficha-pagina fieldset {
  min-width: 0;
}
.ficha-pagina button[type="submit"],
.ficha-pagina .btn-secondary {
  color: #fff;
}
`;

export default estilos;
