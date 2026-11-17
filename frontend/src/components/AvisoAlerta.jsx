export default function AvisoAlerta({ aviso, clase = "" }) {
  if (!aviso) {
    return null;
  }

  return (
    <div className={clase}>
      <div className={`alert alert-${aviso.tipo}`}>{aviso.texto}</div>
    </div>
  );
}
