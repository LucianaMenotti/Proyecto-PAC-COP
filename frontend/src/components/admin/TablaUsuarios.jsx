import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDatos, enviarDatos } from "../../config/api";
import { RUTAS } from "../../config/rutas";
import { ESTADOS_CUENTA, ROLES_ASIGNABLES, nombreDe } from "../../helpers/admin";
import { obtenerEstadoAprobacion } from "../../helpers/documentacion";
import { useAuth } from "../../hooks/useAuth";
import ModalMotivo from "./ModalMotivo";

const LIMITE = 10;

const esRolAdmin = (rol) => rol === "admin" || rol === "administrador";

function FilaUsuario({ usuario, esPropio, alGuardarRol, alSuspender, alReactivar }) {
  // "administrador" se muestra dentro de la opción "admin"
  const rolInicial = esRolAdmin(usuario.rol) ? "admin" : usuario.rol;
  const [rol, setRol] = useState(rolInicial);
  const cuenta = ESTADOS_CUENTA[usuario.estadoCuenta] || ESTADOS_CUENTA.activa;
  const suspendida = usuario.estadoCuenta === "suspendida";

  return (
    <tr>
      <td>{usuario.id}</td>
      <td>
        <Link to={`${RUTAS.adminLegajo}/${usuario.id}`} className="fw-semibold text-decoration-none">
          {nombreDe(usuario)}
        </Link>
        <div className="small text-secondary">{usuario.email}</div>
      </td>
      <td>
        <div className="d-flex gap-1">
          <select
            className="form-select form-select-sm"
            style={{ minWidth: "120px" }}
            value={rol}
            disabled={esPropio}
            onChange={(evento) => setRol(evento.target.value)}
          >
            {ROLES_ASIGNABLES.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
          {rol !== rolInicial && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => alGuardarRol(usuario, rol)}>
              Guardar
            </button>
          )}
        </div>
      </td>
      <td>
        <span className={`badge ${cuenta.clase} me-1`}>{cuenta.texto}</span>
        {usuario.rol === "prestador" && (
          <span className={`badge ${obtenerEstadoAprobacion(usuario.estadoAprobacion).clase}`}>
            {obtenerEstadoAprobacion(usuario.estadoAprobacion).texto}
          </span>
        )}
      </td>
      <td className="text-end text-nowrap">
        {!esPropio && !esRolAdmin(usuario.rol) && (
          suspendida ? (
            <button type="button" className="btn btn-outline-success btn-sm" onClick={() => alReactivar(usuario)}>
              Reactivar
            </button>
          ) : (
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => alSuspender(usuario)}>
              Suspender
            </button>
          )
        )}
      </td>
    </tr>
  );
}

// GET /api/admin/usuarios?pagina=&limite=&buscar=&rol=&estadoCuenta=
// PUT /api/admin/usuarios/:id { rol } · POST /api/admin/usuarios/:id/suspension
export default function TablaUsuarios({ alAvisar, alCambiar }) {
  const { usuario: sesion } = useAuth();
  const [filtros, setFiltros] = useState({ pagina: 1, buscar: "", rol: "", estadoCuenta: "" });
  const [busqueda, setBusqueda] = useState("");
  const [datos, setDatos] = useState(null);
  const [suspendiendo, setSuspendiendo] = useState(null);
  const [cancelarReservas, setCancelarReservas] = useState(true);

  // La búsqueda por texto espera 350 ms después de la última tecla
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setFiltros((anterior) =>
        anterior.buscar === busqueda.trim() ? anterior : { ...anterior, buscar: busqueda.trim(), pagina: 1 }
      );
    }, 350);

    return () => clearTimeout(temporizador);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    const parametros = new URLSearchParams({ pagina: filtros.pagina, limite: LIMITE });

    if (filtros.buscar) parametros.set("buscar", filtros.buscar);
    if (filtros.rol) parametros.set("rol", filtros.rol);
    if (filtros.estadoCuenta) parametros.set("estadoCuenta", filtros.estadoCuenta);

    try {
      setDatos(await apiDatos(`/api/admin/usuarios?${parametros}`));
    } catch (error) {
      alAvisar(error.message, "danger");
      setDatos((anterior) => anterior ?? { usuarios: [], pagina: 1, totalPaginas: 1, total: 0 });
    }
  }, [filtros, alAvisar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarRol = async (usuario, rol) => {
    if (!window.confirm(`¿Cambiar el rol de ${nombreDe(usuario)} a "${rol}"?`)) {
      return;
    }

    try {
      await enviarDatos(`/api/admin/usuarios/${usuario.id}`, "PUT", { rol });
      alAvisar("Rol actualizado");
      await cargar();
      alCambiar();
    } catch (error) {
      alAvisar(error.message, "danger");
    }
  };

  const suspender = async (motivo) => {
    const datosRespuesta = await enviarDatos(`/api/admin/usuarios/${suspendiendo.id}/suspension`, "POST", {
      suspender: true,
      motivo,
      cancelarReservas
    });

    alAvisar(datosRespuesta.mensaje);
    setSuspendiendo(null);
    await cargar();
    alCambiar();
  };

  const reactivar = async (usuario) => {
    if (!window.confirm(`¿Reactivar la cuenta de ${nombreDe(usuario)}?`)) {
      return;
    }

    try {
      await enviarDatos(`/api/admin/usuarios/${usuario.id}/suspension`, "POST", { suspender: false });
      alAvisar("Cuenta reactivada");
      await cargar();
      alCambiar();
    } catch (error) {
      alAvisar(error.message, "danger");
    }
  };

  const cambiarFiltro = (campo) => (evento) =>
    setFiltros((anterior) => ({ ...anterior, [campo]: evento.target.value, pagina: 1 }));

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="row g-2 mb-3">
          <div className="col-md-6">
            <input
              type="search"
              className="form-control"
              placeholder="Buscar por nombre, email o DNI"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          </div>

          <div className="col-md-3">
            <select className="form-select" value={filtros.rol} onChange={cambiarFiltro("rol")}>
              <option value="">Todos los roles</option>
              <option value="dueño">Dueño</option>
              <option value="prestador">Prestador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="col-md-3">
            <select className="form-select" value={filtros.estadoCuenta} onChange={cambiarFiltro("estadoCuenta")}>
              <option value="">Todas las cuentas</option>
              <option value="activa">Activas</option>
              <option value="suspendida">Suspendidas</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {datos === null && (
                <tr>
                  <td colSpan="5" className="text-center text-secondary py-4">
                    Cargando...
                  </td>
                </tr>
              )}

              {datos !== null && datos.usuarios.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-secondary py-4">
                    Sin resultados.
                  </td>
                </tr>
              )}

              {(datos?.usuarios || []).map((usuario) => (
                <FilaUsuario
                  key={`${usuario.id}-${usuario.rol}-${usuario.estadoCuenta}`}
                  usuario={usuario}
                  esPropio={Number(usuario.id) === Number(sesion?.id)}
                  alGuardarRol={guardarRol}
                  alSuspender={(elegido) => {
                    setCancelarReservas(true);
                    setSuspendiendo(elegido);
                  }}
                  alReactivar={reactivar}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            disabled={!datos || datos.pagina <= 1}
            onClick={() => setFiltros((anterior) => ({ ...anterior, pagina: anterior.pagina - 1 }))}
          >
            Anterior
          </button>
          <span className="small text-secondary">
            {datos ? `Página ${datos.pagina} de ${datos.totalPaginas} (${datos.total})` : ""}
          </span>
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            disabled={!datos || datos.pagina >= datos.totalPaginas}
            onClick={() => setFiltros((anterior) => ({ ...anterior, pagina: anterior.pagina + 1 }))}
          >
            Siguiente
          </button>
        </div>
      </div>

      {suspendiendo && (
        <ModalMotivo
          titulo={`Suspender a ${nombreDe(suspendiendo)}`}
          descripcion="La cuenta no podrá iniciar sesión y las sesiones abiertas se cierran. El motivo queda en el registro de acciones."
          minimo={5}
          textoConfirmar="Suspender"
          alCerrar={() => setSuspendiendo(null)}
          alConfirmar={suspender}
        >
          <div className="form-check mt-3">
            <input
              id="cancelar-reservas"
              type="checkbox"
              className="form-check-input"
              checked={cancelarReservas}
              onChange={(evento) => setCancelarReservas(evento.target.checked)}
            />
            <label className="form-check-label small" htmlFor="cancelar-reservas">
              Cancelar con reembolso sus reservas programadas o aceptadas y avisar a la otra parte
            </label>
          </div>
        </ModalMotivo>
      )}
    </div>
  );
}
