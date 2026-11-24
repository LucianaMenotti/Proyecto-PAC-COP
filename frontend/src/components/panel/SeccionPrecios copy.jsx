import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { enviarDatos } from "../../config/api";
import { RUTAS } from "../../config/rutas";
import { leerLista, leerPrecios } from "../../helpers/listas";
import { NOMBRES_SERVICIO } from "../../helpers/servicios";
import { obtenerPrecioNivel, PRECIOS, TIPOS_SERVICIO } from "../../helpers/niveles";
import { formatearPesos, formatearResumenPrecio } from "../../helpers/precios";
import EncabezadoSeccion from "./EncabezadoSeccion";

export default function SeccionPrecios({
  usuario,
  nivel,
  completados,
  rangos,
  alActualizar
}) {
  const servicios = leerLista(usuario.servicios);
  const precios = leerPrecios(usuario.preciosServicios);

  const [tipoServicio, setTipoServicio] = useState("Paseo");
  const [precioInput, setPrecioInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState(null);
  const [mensajeError, setMensajeError] = useState(null);

  // La sugerencia representa siempre una tarifa por hora, sin adicionales por mascota o distancia.
  const sugerencia = useMemo(() => {
    const precio = obtenerPrecioNivel(tipoServicio, nivel, rangos?.[tipoServicio]) || 0;
    return { precio, detalle: "Tarifa por cada hora de servicio" };
  }, [tipoServicio, nivel, rangos]);

  const cambiarTipo = (evento) => {
    const nuevoTipo = evento.target.value;

    setTipoServicio(nuevoTipo);
    setMensajeError(null);
  };

  const guardar = async (nuevosServicios, nuevosPrecios) => {
    await enviarDatos("/api/users/me/servicios", "PUT", {
      servicios: nuevosServicios,
      preciosServicios: nuevosPrecios
    }, "No se pudo guardar");

    await alActualizar();
  };

  const publicar = async (evento) => {
    evento.preventDefault();
    setMensajeOk(null);
    setMensajeError(null);

    const precio = Number(precioInput);

    if (!Number.isFinite(precio) || precio <= 0) {
      setMensajeError("Por favor ingresá un precio válido mayor a 0.");
      return;
    }


    setEnviando(true);

    try {
      // El backend exige un vehículo para cualquier lista que incluya Traslado.
      let nuevosServicios = [...servicios];
      const nuevosPrecios = { ...precios };
      let aviso = "";

      if (tipoServicio === "Traslado" || nuevosServicios.includes("Traslado")) {
        const perfil = await alActualizar();
        const vehiculo = perfil?.vehiculo ?? usuario.vehiculo;

        if (!vehiculo) {
          if (tipoServicio === "Traslado") {
            setMensajeError(
              "Para publicar Traslado primero cargá tu vehículo en la sección Vehículo."
            );
            return;
          }

          // La lista tenía Traslado publicado sin vehículo: se retira para poder guardar.
          nuevosServicios = nuevosServicios.filter((item) => item !== "Traslado");
          delete nuevosPrecios.Traslado;
          aviso =
            "Quitamos Traslado de tu lista: necesitás cargar un vehículo para ofrecerlo (sección Vehículo).";
        }
      }

      if (!nuevosServicios.includes(tipoServicio)) {
        nuevosServicios.push(tipoServicio);
      }

      nuevosPrecios[tipoServicio] = { precioBase: precio };

      await guardar(nuevosServicios, nuevosPrecios);

      setPrecioInput("");

      if (aviso) {
        setMensajeError(aviso);
      } else {
        setMensajeOk(`¡Servicio "${NOMBRES_SERVICIO[tipoServicio]}" publicado con éxito!`);
      }
    } catch (error) {
      setMensajeError(error.message || "Error al publicar el servicio");
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (servicio) => {
    if (!window.confirm(`¿Querés eliminar el servicio de ${NOMBRES_SERVICIO[servicio] || servicio}?`)) {
      return;
    }

    try {
      const nuevosPrecios = { ...precios };

      delete nuevosPrecios[servicio];

      await guardar(
        servicios.filter((item) => item !== servicio),
        nuevosPrecios
      );
    } catch (error) {
      alert(error.message || "Error al eliminar el servicio");
    }
  };

  const porcentajeNivel = Math.min(100, Math.round((completados / 50) * 100));
  const calificacion = Number(usuario.calificacion) || 0;
  const faltan = Math.max(0, 50 - completados);

  const claseNivel = (id) =>
    nivel === id
      ? id === "top"
        ? "bg-amber-50 border border-amber-200 font-bold text-amber-900"
        : "bg-teal-50 border border-teal-200 font-bold text-teal-900"
      : "text-slate-500";

  return (
    <div className="space-y-6 animate-fade-in">
      <EncabezadoSeccion
        etiqueta="Tarifas y catálogo"
        titulo="Definí tu precio libremente"
        descripcion="Según tus servicios completados y tu calificación te sugerimos un rango de precio. Es solo una referencia: vos decidís cuánto cobrar."
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Progreso de prestador
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            {completados} servicios completados
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 mb-4">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(8, porcentajeNivel)}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-3 text-center gap-2 text-xs">
          <div className={`p-2 rounded-xl transition ${claseNivel("nuevo")}`}>
            <span className="block text-sm">🌱 Nuevo</span>
            <span className="text-[11px] text-slate-400">0–9 servicios</span>
          </div>
          <div className={`p-2 rounded-xl transition ${claseNivel("establecido")}`}>
            <span className="block text-sm">⭐ Establecido</span>
            <span className="text-[11px] text-slate-400">10–49 · +4.0★</span>
          </div>
          <div className={`p-2 rounded-xl transition ${claseNivel("top")}`}>
            <span className="block text-sm">🏆 Top</span>
            <span className="text-[11px] text-slate-400">50+ · +4.5★</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-4 mb-0">
          Llevás <strong>{completados} servicios</strong> con <strong>{calificacion}★</strong> de
          promedio.{" "}
          {nivel === "top" ? (
            "Estás en el nivel Top."
          ) : (
            <>
              Te faltan <strong>{faltan} servicios</strong> para alcanzar Top.
            </>
          )}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <i className="bi bi-table text-teal-600"></i> Precios sugeridos por hora
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Si hay datos del mercado en tu zona se usa el rango real (mínimo, promedio y máximo); si no,
          una tabla de referencia.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Servicio</th>
                <th className="py-2.5 px-4">Nuevo (por hora)</th>
                <th className="py-2.5 px-4">Establecido (por hora)</th>
                <th className="py-2.5 px-4">Top (por hora)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TIPOS_SERVICIO.map((tipo) => (
                <tr key={tipo} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-800">{PRECIOS[tipo].nombre}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatearPesos(obtenerPrecioNivel(tipo, "nuevo", rangos?.[tipo]))}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {formatearPesos(obtenerPrecioNivel(tipo, "establecido", rangos?.[tipo]))}
                  </td>
                  <td className="py-3 px-4 font-medium text-emerald-700">
                    {formatearPesos(obtenerPrecioNivel(tipo, "top", rangos?.[tipo]))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Publicar o actualizar servicio</h3>

          <form onSubmit={publicar} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Tipo de servicio
              </label>
              <select
                value={tipoServicio}
                onChange={cambiarTipo}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Paseo">Paseo de mascotas</option>
                <option value="Guarderia">Guardería de día / noche</option>
                <option value="Traslado">Traslado en vehículo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Precio por hora ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  placeholder={sugerencia.precio ? `Ej: ${sugerencia.precio}` : "Ingresá tu precio por hora"}
                  value={precioInput}
                  onChange={(evento) => setPrecioInput(evento.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                La tarifa se multiplica por las horas contratadas. No cambia según la cantidad de mascotas ni los kilómetros.
              </p>
            </div>

            {mensajeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {mensajeError}{" "}
                {mensajeError.includes("Vehículo") && (
                  <Link
                    to={`${RUTAS.panelPrestador}/vehiculo`}
                    className="underline font-bold text-rose-800"
                  >
                    Ir a Vehículo
                  </Link>
                )}
              </div>
            )}

            {mensajeOk && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
                {mensajeOk}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl shadow transition active:scale-[0.99] disabled:opacity-50 text-sm"
            >
              {enviando ? "Publicando..." : "Publicar / Actualizar Servicio"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 bg-gradient-to-br from-teal-50 via-emerald-50/50 to-white rounded-2xl p-6 border border-teal-200/80 shadow-xs space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Sugerencia inteligente
            </span>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5">Precio recomendado</h4>
            <p className="text-xs text-slate-500 mt-1">
              Calculado para tu nivel{" "}
              <span className="font-bold text-teal-800">{nivel.toUpperCase()}</span> según los
              parámetros seleccionados.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-teal-100 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs text-slate-400 block">Sugerido para tu caso:</span>
              <span className="text-3xl font-extrabold text-teal-800 font-mono">
                {sugerencia.precio ? formatearPesos(sugerencia.precio) : "—"}
              </span>
            </div>
            <button
              type="button"
              disabled={!sugerencia.precio}
              onClick={() => setPrecioInput(String(sugerencia.precio))}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs disabled:opacity-40"
            >
              Usar precio
            </button>
          </div>

          <p className="text-xs text-slate-500 italic">Detalle del cálculo: {sugerencia.detalle || "—"}</p>

          {rangos?.[tipoServicio] && (
            <div className="grid grid-cols-3 text-center gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Mínimo</span>
                <strong>{formatearPesos(rangos[tipoServicio].min)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Promedio</span>
                <strong>{formatearPesos(rangos[tipoServicio].promedio)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Máximo</span>
                <strong>{formatearPesos(rangos[tipoServicio].max)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Mis servicios publicados</h3>
        <p className="text-xs text-slate-500 mb-4">
          Estos son los servicios que ofrecés actualmente en la plataforma.
        </p>

        {servicios.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <i className="bi bi-tag text-3xl mb-2 block"></i>
            <p className="text-sm font-semibold">Todavía no tenés servicios publicados</p>
            <p className="text-xs text-slate-400 mt-1">
              Usá el formulario superior para crear tu primer servicio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {servicios.map((servicio) => (
              <div
                key={servicio}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition flex justify-between items-center gap-2"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {NOMBRES_SERVICIO[servicio] || servicio}
                  </h4>
                  <span className="text-teal-700 font-extrabold font-mono text-sm">
                    {formatearResumenPrecio(precios[servicio])}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => eliminar(servicio)}
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition"
                  title="Eliminar servicio"
                >
                  <i className="bi bi-trash3 text-base"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
