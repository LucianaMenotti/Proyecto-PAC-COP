import React, { useState, useEffect } from 'react';
import { getDetalleServicio, getPagoServicio, procesarPago } from '../../api/dueno';

export default function PagoSeguroSection({ servicioId, onVolverReservas }) {
  const [servicio, setServicio] = useState(null);
  const [pagoExistente, setPagoExistente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metodo, setMetodo] = useState('tarjeta'); // 'tarjeta' | 'billetera'

  // Datos Tarjeta
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [titularTarjeta, setTitularTarjeta] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvc, setCvc] = useState('');

  const [procesando, setProcesando] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [comprobanteDatos, setComprobanteDatos] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function load() {
      if (!servicioId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [det, p] = await Promise.allSettled([
          getDetalleServicio(servicioId),
          getPagoServicio(servicioId),
        ]);
        if (det.status === 'fulfilled') setServicio(det.value);
        if (p.status === 'fulfilled' && p.value) {
          setPagoExistente(p.value);
          if (p.value.estado === 'retenido' || p.value.estado === 'completado') {
            setPagoExitoso(true);
            setComprobanteDatos(p.value);
          }
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error al cargar detalles de la reserva');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [servicioId]);

  const handleProcesarPago = async (e) => {
    e.preventDefault();
    if (!servicio) return;
    setErrorMsg(null);
    setProcesando(true);

    try {
      const payload = {
        servicioId: servicio.id,
        metodo,
        monto: servicio.monto,
        detalles: metodo === 'tarjeta' ? { numeroUltimos4: numeroTarjeta.slice(-4), titular: titularTarjeta } : { tipo: 'transferencia' },
      };

      const res = await procesarPago(payload);
      setPagoExitoso(true);
      setComprobanteDatos(res.pago || {
        id: Date.now(),
        servicioId: servicio.id,
        monto: servicio.monto,
        fecha: new Date().toISOString(),
        metodo,
      });
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo procesar el pago.');
    } finally {
      setProcesando(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  if (loading) {
    return <p className="text-sm text-slate-400 py-10 text-center">Cargando pasarela de pago segura...</p>;
  }

  if (!servicio && !servicioId) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
        <i className="bi bi-credit-card-2-front text-4xl text-slate-300"></i>
        <h3 className="font-bold text-slate-700">No hay ninguna reserva seleccionada para pagar</h3>
        <p className="text-xs text-slate-500">Ingresá a "Mis Reservas" y seleccioná la reserva que desees abonar.</p>
        <button
          onClick={onVolverReservas}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
        >
          Ir a Mis Reservas
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-500 block mb-1">
          Checkout Seguro
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">Pago en Plataforma con Custodia</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Garantizamos la seguridad de tu dinero: el pago queda retenido hasta que el servicio sea completado.
        </p>
      </div>

      {pagoExitoso ? (
        /* Vista Comprobante Digital Descargable / Imprimible */
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6 print:border-none print:shadow-none">
          <div className="text-center space-y-2 border-b border-slate-100 pb-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 text-2xl flex items-center justify-center mx-auto shadow-xs">
              <i className="bi bi-shield-check"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Comprobante Digital de Pago</h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block">
              ✓ Pago Protegido en Custodia (Escrow)
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Código de Operación:</span>
              <strong className="font-mono text-slate-800">#PAC-{comprobanteDatos?.id || servicio?.id}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Servicio contratado:</span>
              <span className="font-semibold text-slate-800">{servicio?.tipo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Mascota:</span>
              <span className="font-semibold text-slate-800">{servicio?.mascota}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Prestador asignado:</span>
              <span className="font-semibold text-slate-800">{servicio?.prestador}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Fecha y Hora del pago:</span>
              <span className="font-mono text-slate-700">
                {new Date(comprobanteDatos?.fecha || Date.now()).toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between py-2 text-base font-bold text-slate-800">
              <span>Total abonado:</span>
              <span className="text-emerald-700 font-mono text-lg">
                ${Number(servicio?.monto || 0).toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
            <i className="bi bi-info-circle text-base text-teal-700 mt-0.5"></i>
            <span>
              El monto queda retenido en la plataforma. Una vez que el prestador finalice el servicio y confirmes el cuidado, los fondos se transferirán a su cuenta.
            </span>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 print:hidden">
            <button
              type="button"
              onClick={handleImprimir}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2"
            >
              <i className="bi bi-printer"></i> Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={onVolverReservas}
              className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              <i className="bi bi-arrow-left"></i> Volver a Mis Reservas
            </button>
          </div>
        </div>
      ) : (
        /* Formulario de Pago */
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          {/* Resumen del servicio */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Reserva #{servicio?.id}</span>
              <h4 className="font-bold text-slate-800 text-base">{servicio?.tipo} para {servicio?.mascota}</h4>
              <span className="text-slate-500 text-xs">Prestador: {servicio?.prestador}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-xs">Total a pagar:</span>
              <strong className="text-2xl font-extrabold text-emerald-700 font-mono">
                ${Number(servicio?.monto || 0).toLocaleString('es-AR')}
              </strong>
            </div>
          </div>

          {/* Selector de Método */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Medio de pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMetodo('tarjeta')}
                className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                  metodo === 'tarjeta'
                    ? 'border-teal-700 bg-teal-50 text-teal-900 shadow-xs ring-1 ring-teal-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <i className="bi bi-credit-card text-base"></i> Tarjeta Débito / Crédito
              </button>
              <button
                type="button"
                onClick={() => setMetodo('billetera')}
                className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                  metodo === 'billetera'
                    ? 'border-teal-700 bg-teal-50 text-teal-900 shadow-xs ring-1 ring-teal-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <i className="bi bi-wallet2 text-base"></i> Billetera Virtual (CVU)
              </button>
            </div>
          </div>

          <form onSubmit={handleProcesarPago} className="space-y-4">
            {metodo === 'tarjeta' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Número de tarjeta
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="19"
                    placeholder="4500 0000 0000 0000"
                    value={numeroTarjeta}
                    onChange={(e) => setNumeroTarjeta(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Nombre y Apellido impreso en la tarjeta
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: MARÍA GONZÁLEZ"
                    value={titularTarjeta}
                    onChange={(e) => setTitularTarjeta(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Vencimiento (MM/AA)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="12/28"
                      maxLength="5"
                      value={vencimiento}
                      onChange={(e) => setVencimiento(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Código de seguridad (CVC)
                    </label>
                    <input
                      type="password"
                      required
                      maxLength="4"
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Datos para transferir con tu billetera:</span>
                <p><strong>Alias PAC-COP:</strong> <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">paccop.pagos.mp</span></p>
                <p><strong>CVU:</strong> <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">0000003100099887766554</span></p>
                <span className="text-[11px] text-slate-400 block pt-1">
                  Al hacer clic en pagar, la plataforma verifica automáticamente la acreditación.
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i className="bi bi-shield-lock-fill"></i>
              {procesando ? 'Procesando pago seguro...' : `Pagar $${Number(servicio?.monto || 0).toLocaleString('es-AR')} con Custodia`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
