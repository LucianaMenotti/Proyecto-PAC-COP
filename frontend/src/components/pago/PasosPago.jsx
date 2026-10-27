const PASOS = [
  { id: "metodo", titulo: "Método de pago", descripcion: "Tarjeta o billetera" },
  { id: "confirmar", titulo: "Confirmar y pagar", descripcion: "Retención segura" },
  { id: "comprobante", titulo: "Comprobante", descripcion: "Descargá constancia" }
];

export default function PasosPago({ pasoActual }) {
  const indiceActual = PASOS.findIndex((paso) => paso.id === pasoActual);

  return (
    <nav className="col-12 col-md-4 col-lg-3 pasos-nav" aria-label="Progreso del pago">
      <ol className="list-unstyled pasos-lista position-relative m-0 p-0 d-flex d-md-block justify-content-between">
        {PASOS.map((paso, indice) => {
          let clase = "paso";

          if (indice === indiceActual) {
            clase += " activo";
          } else if (indice < indiceActual) {
            clase += " hecho";
          }

          return (
            <li key={paso.id} data-paso={paso.id} className={clase}>
              <span className="paso-marca"></span>

              <div className="paso-info">
                <p className="paso-titulo fw-semibold mb-0">{paso.titulo}</p>
                <p className="paso-desc text-secondary small d-none d-md-block mb-0">
                  {paso.descripcion}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
