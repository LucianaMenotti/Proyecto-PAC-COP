const estilos = String.raw`
:root {
  --bg-app: var(--bg);
  --bg-card: var(--surface);
  --bg-input: var(--surface-input);
  --primary: var(--pac-primary);
  --primary-hover: var(--pac-primary-dark);
  --primary-focus: var(--pac-primary-ring);
  --primary-border: var(--pac-primary);
  --text-main: var(--text);
  --text-label: var(--text-muted);
  --border-light: var(--border);
  --border-input: var(--border-strong);
  --alert-bg: var(--danger-soft);
  --alert-border: var(--danger-border);
  --alert-text: var(--danger-text);
  --alert-main: var(--pac-accent);
  --shadow-card: var(--shadow-md);
  --radius-card: 12px;
  --radius-btn: 8px;
  --radius-input: 6px;
}
.pagina-alertas .header-app h2 {
  font-family: "Fraunces", serif;
}
.pagina-alertas .header-app {
  background-color: var(--primary);
  box-shadow: var(--shadow-card);
}
.pagina-alertas .card-custom {
  background-color: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.pagina-alertas .header-teal {
  background-color: var(--primary);
}
.pagina-alertas .card-alert-danger {
  background-color: var(--alert-bg);
  border-color: var(--alert-border);
}
.pagina-alertas .card-alert-danger .card-header {
  background-color: var(--alert-main);
  color: #ffffff;
}
.pagina-alertas .card-alert-danger #mostrar-alerta {
  color: var(--alert-text);
}
.pagina-alertas .label-custom {
  color: var(--text-label);
  font-weight: 600;
}
.pagina-alertas .form-control {
  background-color: var(--bg-input);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-input);
  color: var(--text-main);
  font-family: inherit;
}
.pagina-alertas .form-control:focus {
  background-color: var(--surface);
  border-color: var(--primary-border);
  box-shadow: 0 0 0 3px var(--primary-focus);
}
.pagina-alertas .input-danger {
  border-color: var(--alert-border);
}
.pagina-alertas .input-danger:focus {
  border-color: var(--alert-main);
  box-shadow: 0 0 0 3px rgba(255, 111, 82, 0.15);
}
.pagina-alertas .custom-radio,
.pagina-alertas .custom-checkbox {
  border-color: var(--border-input);
  background-color: var(--bg-input);
}
.pagina-alertas .custom-radio:checked,
.pagina-alertas .custom-checkbox:checked {
  background-color: var(--primary);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-focus);
}
.pagina-alertas .btn-teal {
  background-color: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-btn);
}
.pagina-alertas .btn-teal:hover {
  background-color: var(--primary-hover);
  color: #ffffff;
}
.pagina-alertas .btn-danger-custom {
  background-color: var(--alert-main);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-btn);
}
.pagina-alertas .btn-danger-custom:hover {
  background-color: var(--pac-accent-dark);
  color: #ffffff;
}
.pagina-alertas .list-group-item {
  border-color: var(--border-light);
  color: var(--text-main);
  padding: 12px 20px;
}
.pagina-alertas .list-group-item strong {
  color: var(--text-label);
}
.pagina-alertas #motivo-rechazo-container {
  transition: all 0.3s ease-in-out;
}
.pagina-alertas .transition-btn {
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
}
.pagina-alertas .transition-btn:active {
  transform: translateY(2px);
}
`;

export default estilos;
