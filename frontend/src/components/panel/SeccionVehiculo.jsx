import { useState } from "react";
import { enviarDatos } from "../../config/api";
import EncabezadoSeccion from "./EncabezadoSeccion";

export default function SeccionVehiculo({ usuario, alActualizar }) {
  const [vehiculo, setVehiculo] = useState(usuario.vehiculo || "");
  const [guardando, setGuardando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState(null);
  const [mensajeError, setMensajeError] = useState(null);

  const guardar = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setMensajeOk(null);
    setMensajeError(null);

    try {
      await enviarDatos("/api/users/me/vehiculo", "PUT", { vehiculo: vehiculo || null }, "Error al guardar vehículo");
      setMensajeOk("Vehículo actualizado correctamente.");
      await alActualizar();
    } catch (error) {
      setMensajeError(error.message || "Error al guardar vehículo");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <EncabezadoSeccion
        etiqueta="Movilidad y traslados"
        titulo="Tu vehículo de trabajo"
        descripcion="Declarar un vehículo te permite ofrecer el servicio de Traslados de mascotas con mayor seguridad para los dueños."
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs max-w-xl">
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Tipo de vehículo
            </label>
            <select
              value={vehiculo}
              onChange={(evento) => setVehiculo(evento.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">— Sin vehículo registrado —</option>
              <option value="Auto">Auto (Sedan / Hatchback)</option>
              <option value="Camioneta">Camioneta / SUV</option>
              <option value="Moto">Moto con caja adaptada</option>
            </select>
            <span className="text-xs text-slate-400 mt-1 block">
              Si no contás con vehículo, no podrás publicar el servicio de Traslado.
            </span>
          </div>

          {mensajeError && <p className="text-xs text-rose-600 font-semibold">{mensajeError}</p>}
          {mensajeOk && <p className="text-xs text-emerald-600 font-semibold">{mensajeOk}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar vehículo"}
          </button>
        </form>
      </div>
    </div>
  );
}
