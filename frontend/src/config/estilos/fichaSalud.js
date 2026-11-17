const estilos = String.raw`
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  background-color: #f4fbf9;
  color: #2c3e50;
  line-height: 1.5;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start; 
  min-height: 100vh;
}
#vista-dueno {
  background-color: #ffffff;
  width: 100%;
  max-width: 900px; 
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}
h1 {
  color: #1f7a74;
  margin-bottom: 8px;
  font-size: 1.75rem;
  text-align: center;
}
p {
  color: #64748b;
  margin-bottom: 25px;
  font-size: 0.95rem;
  text-align: center;
}
fieldset {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
legend {
  background-color: #1f7a74;
  color: #ffffff;
  padding: 4px 14px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}
label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #475569;
  margin-bottom: 6px;
  display: block;
}
input[type="text"],
input[type="number"],
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  background-color: #f8fafc;
  transition: all 0.2s ease;
}
input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #1f7a74;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(31, 122, 116, 0.15);
}
textarea {
  min-height: 80px;
  resize: vertical;
}
.alert-fieldset {
  background-color: #fff1ec;
  border-color: #ffd6c9;
}
.alert-fieldset legend {
  background-color: #ff6f52;
  color: #ffffff;
}
.alert-fieldset label {
  color: #b23a2a;
}
.alert-fieldset textarea {
  border-color: #ffb4a0;
}
.alert-fieldset textarea:focus {
  border-color: #ff6f52;
  box-shadow: 0 0 0 3px rgba(255, 111, 82, 0.15);
}
button[type="submit"] {
  background-color: #1f7a74;
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
button[type="submit"]:hover {
  background-color: #155551;
}
button[type="submit"]:active {
  transform: translateY(2px);
}
.hidden {
  display: none !important;
}
#resumen-pantalla {
  background-color: #ffffff;
  width: 100%;
  max-width: 600px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}
#resumen-contenido {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}
#resumen-contenido p {
  text-align: left;
  margin-bottom: 12px;
  color: #2c3e50;
  font-size: 1rem;
}
#resumen-contenido span.label-resumen {
  font-weight: bold;
  color: #1f7a74;
  display: inline-block;
  min-width: 130px;
}
@media (min-width: 768px) {
  .normal-fieldset {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .normal-fieldset legend {
    grid-column: 1 / -1;
  }
  .normal-fieldset .form-group:nth-child(4), 
  .normal-fieldset .form-group:nth-child(5) {
    grid-column: 1 / -1;
  }
}
.botones-acciones {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
.btn-secondary {
  background-color: #64748b;
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
.btn-secondary:hover {
  background-color: #475569;
}
.btn-secondary:active {
  transform: translateY(2px);
}
#btn-finalizar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
`;

export default estilos;
