import { useCallback, useEffect, useState } from "react";
import { apiDatos, enviarDatos } from "../../config/api";

const ROLES_ASIGNABLES = ["dueño", "prestador", "admin", "administrador"];
const LIMITE = 10;

function FilaUsuario({ usuario, alGuardar }) {
  const [rol, setRol] = useState(usuario.rol);
  const [verificado, setVerificado] = useState(Boolean(usuario.verificado));

  return (
    <tr>
      <td>{usuario.id}</td>
      <td>
        {usuario.nombre} {usuario.apellido}
      </td>
      <td>{usuario.email}</td>
      <td>
        <select
          className="form-select form-select-sm"
          style={{ minWidth: "130px" }}
          value={rol}
          onChange={(evento) => setRol(evento.target.value)}
        >
          {ROLES_ASIGNABLES.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="checkbox"
          className="form-check-input"
          checked={verificado}
          onChange={(evento) => setVerificado(evento.target.checked)}
        />
      </td>
      <td className="text-end">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => alGuardar(usuario.id, { rol, verificado })}
        >
          Guardar
        </button>
      </td>
    </tr>
  );
}

// GET /api/admin/usuarios?pagina=&limite=&buscar=&rol=&verificado=  |  PUT /api/admin/usuarios/:id { rol, verificado }
export default function TablaUsuarios({ alAvisar, alCambiar }) {
  const [filtros, setFiltros] = useState({ pagina: 1, buscar: "", rol: "", verificado: "" });
  const [busqueda, setBusqueda] = useState("");
  const [datos, setDatos] = useState(null);

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
    if (filtros.verificado) parametros.set("verificado", filtros.verificado);

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

  const guardar = async (id, cambios) => {
    try {
      await enviarDatos(`/api/admin/usuarios/${id}`, "PUT", cambios);
      alAvisar("Usuario actualizado");
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
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={filtros.verificado}
              onChange={cambiarFiltro("verificado")}
            >
              <option value="">Verificación</option>
              <option value="true">Verificados</option>
              <option value="false">Sin verificar</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Verificado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {datos === null && (
                <tr>
                  <td colSpan="6" className="text-center text-secondary py-4">
                    Cargando...
                  </td>
                </tr>
              )}

              {datos !== null && datos.usuarios.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-secondary py-4">
                    Sin resultados.
                  </td>
                </tr>
              )}

              {(datos?.usuarios || []).map((usuario) => (
                <FilaUsuario
                  key={`${usuario.id}-${usuario.rol}-${usuario.verificado}`}
                  usuario={usuario}
                  alGuardar={guardar}
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
    </div>
  );
}
