import { useEffect, useMemo, useState } from "react";
import { apiDatos } from "../../config/api";
import { leerPrecios } from "../../helpers/listas";
import { normalizarConfigPrecio, formatearPesos } from "../../helpers/precios";
import EncabezadoSeccion from "./EncabezadoSeccion";

const DIAS_RECIENTES = 14;

// Recomendación de precio según demanda reciente, calificación y precio de mercado (promedio)
const crearRecomendacion = ({ recientes, promedio, mercadoPromedio, preciosActuales }) => {
  if (recientes === 0) {
    return {
      titulo: "Te recomendamos mantener tu precio actual",
      texto: `Tuviste ${recientes} reservas en las últimas 2 semanas. Antes de subir el precio, esperá a validar que la demanda se sostenga.`
    };
  }

  if (
    recientes >= 3 &&
    promedio >= 4 &&
    mercadoPromedio &&
    preciosActuales.some((precio) => precio < mercadoPromedio * 0.9)
  ) {
    return {
      titulo: "Podés subir tu precio",
      texto: `Tu demanda es alta (${recientes} reservas recientes) y tenés ${promedio}★ de promedio. El mercado para tu zona promedia ${formatearPesos(mercadoPromedio)}; podés acercarte a ese rango.`
    };
  }

  return {
    titulo: "Tu precio actual está bien",
    texto: `Con ${recientes} reservas recientes y ${promedio}★ de promedio, mantené tu precio para consolidar la demanda.`
  };
};

export default function SeccionRendimiento({ usuario, servicios, rangos }) {
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const datos = await apiDatos(
          `/api/servicios/prestador/${usuario.id}/resenas`,
          {},
          "Error al cargar reseñas"
        );

        if (activo) {
          setResenas(datos.resenas || []);
        }
      } catch (fallo) {
        if (activo) {
          setError(fallo.message);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [usuario.id]);

  const finalizados = (servicios || []).filter((servicio) => servicio.estado === "finalizado");
  const completados = finalizados.length;
  const limite = Date.now() - DIAS_RECIENTES * 24 * 60 * 60 * 1000;
  const recientes = finalizados.filter(
    (servicio) => servicio.finalizadoEn && new Date(servicio.finalizadoEn).getTime() >= limite
  ).length;

  const promedio = Number(usuario.calificacion) || 0;
  const totalResenas = Number(usuario.resenas) || resenas.length;

  const recomendacion = useMemo(() => {
    const precios = leerPrecios(usuario.preciosServicios);
    const mercado = Object.values(rangos || {}).find((rango) => rango?.promedio);

    return crearRecomendacion({
      recientes,
      promedio,
      mercadoPromedio: mercado?.promedio,
      preciosActuales: Object.values(precios)
        .map((item) => normalizarConfigPrecio(item).precioBase)
        .filter(Boolean)
    });
  }, [recientes, promedio, rangos, usuario.preciosServicios]);

  return (
    <div className="space-y-6 animate-fade-in">
      <EncabezadoSeccion
        etiqueta="Estadísticas y reputación"
        titulo="Cómo viene tu rendimiento"
        descripcion="Estas métricas ayudan a definir tus recomendaciones de precio y visibilidad frente a los clientes."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center">
          <span className="text-4xl font-extrabold text-teal-800 font-mono block mb-1">
            {completados}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Servicios completados
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center">
          <div className="flex items-center justify-center gap-1 text-4xl font-extrabold text-amber-500 font-mono mb-1">
            <span>{promedio.toFixed(1)}</span>
            <span className="text-2xl">★</span>
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Calificación promedio
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center">
          <span className="text-4xl font-extrabold text-teal-800 font-mono block mb-1">
            {recientes}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Reservas últimas 2 semanas
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200/80 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-lg shrink-0 mt-0.5">
            <i className="bi bi-lightbulb"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base">{recomendacion.titulo}</h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              {recomendacion.texto} Mantener una puntuación superior a 4.5 te acerca a la categoría{" "}
              <strong>Top</strong>. Recordá responder a tiempo los mensajes y registrar fotos con GPS
              durante los paseos para generar confianza.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Opiniones de clientes</h3>
          <span className="text-xs text-slate-400 font-semibold">{totalResenas} valoraciones</span>
        </div>

        {cargando ? (
          <p className="text-sm text-slate-400 py-4 text-center">Cargando reseñas...</p>
        ) : error ? (
          <p className="text-sm text-rose-500 py-4 text-center">{error}</p>
        ) : resenas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <i className="bi bi-chat-quote text-3xl mb-2 block"></i>
            <p className="text-sm font-semibold">Todavía no recibiste reseñas</p>
            <p className="text-xs text-slate-400 mt-1">
              Aparecerán aquí cuando los clientes califiquen tus servicios.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resenas.map((resena) => {
              const estrellas = Math.max(0, Math.min(5, Math.round(Number(resena.puntuacion) || 0)));

              return (
                <div
                  key={resena.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-800">{resena.autor || "Cliente"}</span>
                    <div className="text-amber-400 text-sm">
                      {"★".repeat(estrellas)}
                      <span className="text-slate-300">{"☆".repeat(5 - estrellas)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    {resena.comentario ? `"${resena.comentario}"` : "Sin comentario escrito."}
                  </p>
                  <span className="text-[11px] text-slate-400 block pt-1 font-mono">
                    {resena.fecha ? new Date(resena.fecha).toLocaleDateString("es-AR") : "Reciente"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
