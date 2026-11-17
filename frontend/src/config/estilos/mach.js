const estilos = String.raw`
:root {
  --panel-bg: var(--surface);
  --celeste: var(--pac-primary-text);
  --celeste-hover: var(--pac-primary-dark);
  --text-main: var(--text);
  --border-color: var(--border);
}
.pagina-mach .dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 2.25rem 1.25rem 3rem;
}
.pagina-mach .search-header {
  margin-bottom: 30px;
}
.pagina-mach .search-header h1 {
  font-family: "Fraunces", serif;
  font-weight: 600;
  color: var(--celeste);
  margin-bottom: 8px;
}
.pagina-mach .search-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 0;
}
.pagina-mach .search-bar {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
.pagina-mach .search-bar input {
  flex: 1;
  background-color: var(--surface);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px 16px;
  color: var(--text-main);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}
.pagina-mach .search-bar input:focus {
  border-color: var(--celeste);
}
.pagina-mach .results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
  margin-bottom: 20px;
}
.pagina-mach .results-header h2 {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}
.pagina-mach .results-count {
  color: var(--text-muted);
  font-size: 0.85rem;
}
.pagina-mach .providers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pagina-mach .provider-card {
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.pagina-mach .provider-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(31, 122, 116, 0.15);
}
.pagina-mach .provider-card.certified {
  border-color: var(--celeste);
  box-shadow: 0 2px 10px rgba(31, 122, 116, 0.08);
}
.pagina-mach .provider-info h3 {
  margin: 0 0 6px 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}
.pagina-mach .provider-service {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0 0 10px 0;
}
.pagina-mach .badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.pagina-mach .badge-certified {
  background-color: rgba(31, 122, 116, 0.12);
  color: var(--celeste);
  border: 1px solid var(--celeste);
}
.pagina-mach .badge-uncertified {
  background-color: rgba(217, 119, 6, 0.15);
  color: var(--warning-text);
  border: 1px solid var(--warning-border);
}
.pagina-mach .btn {
  display: inline-block;
  text-align: center;
  padding: 10px 18px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  border: none;
}
.pagina-mach .btn-solid {
  background-color: var(--pac-primary);
  color: #fff;
}
.pagina-mach .btn-solid:hover {
  background-color: var(--pac-primary-dark);
}
.pagina-mach .btn-outline {
  background-color: transparent;
  color: var(--celeste);
  border: 1px solid var(--celeste);
}
.pagina-mach .btn-outline:hover {
  background-color: rgba(31, 122, 116, 0.1);
}
.pagina-mach .modal-overlay {
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
}
.pagina-mach .modal-overlay.hidden {
  display: none;
}
.pagina-mach .modal-content {
  background-color: var(--panel-bg);
  width: 90%;
  max-width: 480px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.pagina-mach .modal-header {
  background-color: var(--panel-bg);
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}
.pagina-mach .modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--celeste);
  font-weight: 500;
}
.pagina-mach .close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s;
}
.pagina-mach .close-btn:hover {
  color: var(--text-main);
}
.pagina-mach .modal-body {
  padding: 24px;
}
.pagina-mach .alert-box {
  background-color: var(--warning-soft);
  border-left: 3px solid var(--warning-text);
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
}
.pagina-mach .alert-title {
  margin: 0 0 8px 0;
  color: var(--warning-text);
  font-weight: 600;
  font-size: 0.95rem;
}
.pagina-mach .alert-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}
.pagina-mach .modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
`;

export default estilos;
