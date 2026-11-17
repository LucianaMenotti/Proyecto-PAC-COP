import { Link } from "react-router-dom";
import { enviarDatos } from "../../config/api";
import { RUTAS } from "../../config/rutas";
import { leerLista, leerPrecios } from "../../helpers/listas";
import { formatearResumenPrecio } from "../../helpers/precios";
import { NOMBRES_SERVICIO } from "../../helpers/servicios";
import TarjetaVerificacion from "./TarjetaVerificacion";

const DIAS_PERFIL = [
  ["lunes", "Lunes"],
  ["martes", "Martes"],
  ["miercoles", "Miércoles"],
  ["jueves", "Jueves"],
  ["viernes", "Viernes"],
  ["sabado", "Sábado"],
  ["domingo", "Domingo"]
];

// Acepta array, JSON o texto "pitbull, rottweiler" (formatos viejos en la base)
const leerTexto = (valor) => {
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof valor === "string" && valor.trim()) {
    const lista = leerLista(valor);

    return lista.length > 0
      ? lista
      : valor
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
  }

  return [];
};

const capitalizar = (texto) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto);

export default function SeccionPerfil({ usuario, alActualizar }) {
  const servicios = leerLista(usuario.servicios);
  const precios = leerPrecios(usuario.preciosServicios);
  const nombreCompleto = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() || "Prestador de Servicios";
  const inicial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : "P";
  const calificacion = Number(usuario.calificacion) || 0;
  const totalResenas = Number(usuario.resenas) || 0;
  const muestraVehiculo = servicios.includes("Traslado") || Boolean(usuario.vehiculo);

  const disponibilidad = usuario.disponibilidad && typeof usuario.disponibilidad === "object" ? usuario.disponibilidad : {};
  const diasActivos = DIAS_PERFIL.filter(([clave]) => disponibilidad[clave]?.activo);
  const tamanos = leerTexto(usuario.tamanosAceptados);
  const razas = leerTexto(usuario.restricciones);

  const eliminar = async (servicio) => {
    if (!window.confirm(`¿Seguro que deseás eliminar el servicio "${NOMBRES_SERVICIO[servicio] || servicio}" de tu perfil?`)) {
      return;
    }

    const nuevosPrecios = { ...precios };

    delete nuevosPrecios[servicio];

    try {
      await enviarDatos("/api/users/me/servicios", "PUT", {
        servicios: servicios.filter((item) => item !== servicio),
        preciosServicios: nuevosPrecios
      }, "No se pudo guardar");

      await alActualizar();
    } catch (error) {
      alert(error.message || "Error al eliminar servicio");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-4xl shadow-md shrink-0">
            {inicial}
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-serif">
                {nombreCompleto}
              </h1>
              {usuario.verificado ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <i className="bi bi-patch-check-fill"></i> Identidad verificada
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Identidad no verificada
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-600 mt-2">
              <span className="flex items-center gap-1">
                <strong className="text-amber-500 font-bold">{calificacion.toFixed(1)} ★</strong>
                <span className="text-slate-400">({totalResenas} reseñas)</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <i className="bi bi-geo-alt-fill text-teal-600"></i>
                <span>{usuario.zona || "Zona no especificada"}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <TarjetaVerificacion usuario={usuario} alActualizar={alActualizar} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-tag text-teal-600"></i> Mis servicios ofrecidos
            </h3>
            <Link
              to={`${RUTAS.panelPrestador}/precios`}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 transition"
            >
              Agregar / Cambiar precios
            </Link>
          </div>

          {servicios.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">
              Todavía no ofrecés ningún servicio. Agregalos desde la sección de precios.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {servicios.map((servicio) => (
                <div key={servicio} className="py-3 flex justify-between items-center text-sm gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800">{NOMBRES_SERVICIO[servicio] || servicio}</h4>
                    <span className="text-xs text-teal-700 font-extrabold font-mono">
                      {formatearResumenPrecio(precios[servicio], "Sin precio cargado")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminar(servicio)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-person-lines-fill text-teal-600"></i> Mi cuenta
          </h3>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block">Correo electrónico</span>
              <span className="font-semibold text-slate-700 break-all">{usuario.email || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Teléfono / WhatsApp</span>
              <span className="font-semibold text-slate-700">{usuario.telefono || "No especificado"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Zona</span>
              <span className="font-semibold text-slate-700">{usuario.zona || "No especificada"}</span>
            </div>
            {muestraVehiculo && (
              <div>
                <span className="text-slate-400 block">Vehículo registrado</span>
                <span className="font-semibold text-slate-700">{usuario.vehiculo || "Sin vehículo cargado"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-calendar-week text-teal-600"></i> Disponibilidad semanal
            </h3>
            <Link
              to={`${RUTAS.panelPrestador}/trabajo`}
              className="text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              Editar
            </Link>
          </div>

          {diasActivos.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Sin horarios cargados: se aceptan reservas cualquier día.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {diasActivos.map(([clave, etiqueta]) => (
                <div
                  key={clave}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex justify-between"
                >
                  <span className="font-semibold text-slate-700">{etiqueta}</span>
                  <span className="font-mono text-teal-800 font-medium">
                    {disponibilidad[clave].desde} - {disponibilidad[clave].hasta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-shield-check text-teal-600"></i> Políticas de mascotas
            </h3>
            <Link
              to={`${RUTAS.panelPrestador}/trabajo`}
              className="text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              Editar
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Tamaños que aceptás:</span>
              <div className="flex flex-wrap gap-1.5">
                {tamanos.length > 0 ? (
                  tamanos.map((tamano) => (
                    <span
                      key={tamano}
                      className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 font-semibold"
                    >
                      {capitalizar(tamano)}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 font-medium">Cualquier tamaño</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Razas excluidas:</span>
              <div className="flex flex-wrap gap-1.5">
                {razas.length > 0 ? (
                  razas.map((raza) => (
                    <span
                      key={raza}
                      className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-semibold"
                    >
                      {capitalizar(raza)}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 font-medium">Aceptás todas las razas</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
