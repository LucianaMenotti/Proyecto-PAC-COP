import React, { useState } from 'react';
import { updateVehiculo } from '../../api/prestador';

export default function VehiculoSection({ user, onUserDataUpdated }) {
  const [vehiculo, setVehiculo] = useState(user?.vehiculo || '');
  const [saving, setSaving] = useState(false);
  const [msgOk, setMsgOk] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsgOk(null);
    setErrorMsg(null);

    try {
      const res = await updateVehiculo(vehiculo);
      setMsgOk('Vehículo actualizado correctamente.');
      onUserDataUpdated?.({ ...user, vehiculo: res.vehiculo || vehiculo });
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar vehículo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
          Movilidad y traslados
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">Tu vehículo de trabajo</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Declarar un vehículo te permite ofrecer el servicio de Traslados de mascotas con mayor seguridad para los dueños.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Tipo de vehículo
            </label>
            <select
              value={vehiculo}
              onChange={(e) => setVehiculo(e.target.value)}
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

          {errorMsg && (
            <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>
          )}
          {msgOk && (
            <p className="text-xs text-emerald-600 font-semibold">{msgOk}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar vehículo'}
          </button>
        </form>
      </div>
    </div>
  );
}
