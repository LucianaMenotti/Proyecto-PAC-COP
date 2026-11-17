const estilos = String.raw`
#notifWidget {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 1080;
  font-family: "Inter", system-ui, sans-serif;
}
#notifToggle {
  position: relative;
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 50%;
  background: var(--pac-primary);
  color: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
#notifToggle:hover {
  background: var(--pac-primary-dark);
}
#notifToggle svg {
  width: 24px;
  height: 24px;
}
#notifBadge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: var(--pac-accent);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
#notifPanel {
  border: 1px solid var(--border);
  position: absolute;
  right: 0;
  bottom: 64px;
  width: min(340px, 86vw);
  max-height: 420px;
  overflow: auto;
  background: var(--surface);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  color: var(--text);
}
#notifPanel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--surface);
  border-radius: 16px 16px 0 0;
}
#notifPanel header button {
  border: 0;
  background: transparent;
  color: var(--pac-primary-text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.notif-item {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
  cursor: pointer;
}
.notif-item.no-leida {
  background: var(--pac-primary-soft);
}
.notif-item h6 {
  margin: 0 0 0.15rem;
  font-size: 0.85rem;
  font-weight: 700;
}
.notif-item p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}
.notif-item time {
  color: var(--text-muted);
  font-size: 0.7rem;
}
.notif-vacio {
  padding: 1.2rem 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.notif-footer {
  display: block;
  width: 100%;
  border: 0;
  border-top: 1px solid var(--border);
  background: var(--bg);
  color: var(--pac-primary-text);
  font-weight: 600;
  font-size: 0.82rem;
  padding: 0.65rem;
  cursor: pointer;
}
.notif-footer:hover {
  background: var(--surface-2);
}
#notifToasts {
  position: fixed;
  right: 1rem;
  bottom: 5rem;
  z-index: 1079;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: min(320px, 86vw);
}
.notif-toast {
  background: var(--pac-primary-dark);
  color: #fff;
  border-radius: 12px;
  padding: 0.7rem 0.9rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  font-size: 0.82rem;
}
.notif-toast strong {
  display: block;
  margin-bottom: 0.1rem;
  font-size: 0.85rem;
}
.notif-toast p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.78rem;
}
`;

export default estilos;
