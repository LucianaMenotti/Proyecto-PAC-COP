export default function ContadorNotificaciones({ cantidad }) {
  if (!cantidad) {
    return null;
  }

  return <span className="badge bg-danger rounded-pill ms-1">{cantidad}</span>;
}
