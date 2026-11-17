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
  background: #1f7a74;
  color: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
#notifToggle:hover {
  background: #155551;
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
  background: #ff6f52;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
#notifPanel {
  position: absolute;
  right: 0;
  bottom: 64px;
  width: min(340px, 86vw);
  max-height: 420px;
  overflow: auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
  color: #2c3e50;
}
#notifPanel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eef2f1;
  position: sticky;
  top: 0;
  background: #fff;
  border-radius: 16px 16px 0 0;
}
#notifPanel header button {
  border: 0;
  background: transparent;
  color: #1f7a74;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.notif-item {
  padding: 0.7rem 1rem;
  border-bottom: 1px solid #f2f5f4;
  font-size: 0.85rem;
  cursor: pointer;
}
.notif-item.no-leida {
  background: #f4fbf9;
}
.notif-item h6 {
  margin: 0 0 0.15rem;
  font-size: 0.85rem;
  font-weight: 700;
}
.notif-item p {
  margin: 0;
  color: #5b6b69;
  font-size: 0.8rem;
}
.notif-item time {
  color: #93a3a1;
  font-size: 0.7rem;
}
.notif-vacio {
  padding: 1.2rem 1rem;
  text-align: center;
  color: #93a3a1;
  font-size: 0.85rem;
}
.notif-footer {
  display: block;
  width: 100%;
  border: 0;
  border-top: 1px solid #e2e8f0;
  background: #f4fbf9;
  color: #1f7a74;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 0.65rem;
  cursor: pointer;
}
.notif-footer:hover {
  background: #e4f3f1;
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
  background: #155551;
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
