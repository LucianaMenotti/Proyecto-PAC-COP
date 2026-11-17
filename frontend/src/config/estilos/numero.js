const estilos = String.raw`
:root {
  --bg-app: var(--bg);
  --bg-card: var(--surface);
  --bg-input: var(--surface-2);
  --primary: var(--pac-primary-text);
  --primary-hover: var(--pac-primary-dark);
  --text-main: var(--text);
  --text-label: var(--text-muted);
  --border-light: var(--border);
  --border-input: var(--border-strong);
  --alert-bg: var(--danger-soft);
  --alert-main: var(--pac-accent);
  --alert-hover: var(--pac-accent-dark);
  --shadow-card: var(--shadow-md);
  --shadow-fab: 0 8px 20px rgba(255, 111, 82, 0.3);
  --radius-card: 12px;
  --radius-btn: 8px;
  --radius-input: 6px;
}
.pagina-numero .dashboard {
  padding: 2.25rem 1.25rem 3rem;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}
.pagina-numero .dashboard h1 {
  color: var(--primary);
  font-size: 2rem;
  margin-bottom: 10px;
}
.pagina-numero .dashboard p {
  color: var(--text-muted);
}
.pagina-numero .fab-emergency {
  position: fixed;
  bottom: 30px;
  left: 30px;
  background-color: var(--alert-main);
  color: #ffffff;
  border: none;
  border-radius: 50px;
  padding: 16px 28px;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: var(--shadow-fab);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
}
.pagina-numero .fab-emergency:hover {
  background-color: var(--alert-hover);
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(255, 111, 82, 0.4);
}
.pagina-numero .modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--overlay);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  opacity: 1;
  transition: opacity 0.3s ease;
}
.pagina-numero .modal-overlay.hidden {
  display: none;
  opacity: 0;
}
.pagina-numero .modal-content {
  background-color: var(--bg-card);
  width: 90%;
  max-width: 450px;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-light);
  overflow: hidden;
  transform: translateY(0);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.pagina-numero .modal-header {
  background-color: var(--alert-main);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagina-numero .modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #ffffff;
  font-weight: 600;
}
.pagina-numero .close-btn {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.pagina-numero .close-btn:hover {
  opacity: 1;
}
.pagina-numero .modal-body {
  padding: 24px;
}
.pagina-numero .call-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.pagina-numero .btn {
  display: block;
  text-align: center;
  padding: 14px;
  border-radius: var(--radius-btn);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.pagina-numero .btn-outline {
  background-color: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}
.pagina-numero .btn-outline:hover {
  background-color: var(--bg-app);
}
.pagina-numero .btn-solid {
  background-color: var(--alert-main);
  color: #ffffff;
  border: none;
  width: 100%;
}
.pagina-numero .btn-solid:hover {
  background-color: var(--alert-hover);
}
.pagina-numero .btn-solid:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}
.pagina-numero .location-section {
  background-color: var(--bg-input);
  border: 1px solid var(--border-input);
  padding: 16px;
  border-radius: var(--radius-input);
  margin-bottom: 24px;
}
.pagina-numero .location-section h3 {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  color: var(--text-label);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}
.pagina-numero .location-box {
  color: var(--text-main);
  margin: 0;
  font-size: 0.95rem;
}
.pagina-numero .location-box a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}
.pagina-numero .location-box a:hover {
  text-decoration: underline;
}
.pagina-numero .status-msg {
  text-align: center;
  font-size: 0.9rem;
  margin-top: 12px;
  height: 20px;
  font-weight: 600;
}
`;

export default estilos;
