import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Prestador Sections
import PreciosSection from './components/sections/PreciosSection';
import RendimientoSection from './components/sections/RendimientoSection';
import SolicitudesSection from './components/sections/SolicitudesSection';
import MiTrabajoSection from './components/sections/MiTrabajoSection';
import CobrosGuarderiaSection from './components/sections/CobrosGuarderiaSection';
import VehiculoSection from './components/sections/VehiculoSection';
import ChatReportesSection from './components/sections/ChatReportesSection';
import PerfilSection from './components/sections/PerfilSection';

// Dueño Sections
import MisReservasSection from './components/dueno/MisReservasSection';
import BuscarPrestadoresSection from './components/dueno/BuscarPrestadoresSection';
import PagoSeguroSection from './components/dueno/PagoSeguroSection';
import SeguimientoGpsSection from './components/dueno/SeguimientoGpsSection';

import { getCurrentUser, logoutUser } from './api/auth';
import { getServicios } from './api/prestador';

const DEFAULT_PRESTADOR = {
  id: 1,
  nombre: 'Maximiliano',
  apellido: 'Soria',
  email: 'maxi.prestador@paccop.com',
  telefono: '+54 11 5555-8888',
  rol: 'prestador',
  zona: 'Palermo / Belgrano, CABA',
  verificado: true,
  serviciosCompletados: 18,
  calificacion: 4.8,
  resenas: 12,
  vehiculo: 'Auto',
  servicios: ['Paseo', 'Guarderia'],
  preciosServicios: {
    Paseo: 4500,
    Guarderia: 9000,
  },
  disponibilidad: {
    lunes: { activo: true, desde: '08:00', hasta: '19:00' },
    martes: { activo: true, desde: '08:00', hasta: '19:00' },
    miercoles: { activo: true, desde: '08:00', hasta: '19:00' },
    jueves: { activo: true, desde: '08:00', hasta: '19:00' },
    viernes: { activo: true, desde: '08:00', hasta: '18:00' },
    sabado: { activo: true, desde: '09:00', hasta: '14:00' },
    domingo: { activo: false, desde: '09:00', hasta: '18:00' },
  },
  tamanosAceptados: ['pequeño', 'mediano', 'grande'],
  restricciones: ['dogo argentino'],
  cuentaCobro: {
    tipo: 'banco',
    titular: 'Maximiliano Soria',
    cbu: '0000003100012345678901',
    alias: 'maxi.paccop.mp',
  },
};

export default function App() {
  const [user, setUser] = useState(DEFAULT_PRESTADOR);
  const [activeRole, setActiveRole] = useState('prestador'); // 'prestador' | 'dueno'
  const [currentSection, setCurrentSection] = useState('precios');
  const [servicios, setServicios] = useState(DEFAULT_PRESTADOR.servicios);
  const [precios, setPrecios] = useState(DEFAULT_PRESTADOR.preciosServicios);

  // Cross-navigation context
  const [activeServicioId, setActiveServicioId] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Inicializar sesión real si existe
  useEffect(() => {
    async function initSession() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          if (currentUser.rol === 'dueño') {
            setActiveRole('dueno');
            setCurrentSection('mis-reservas');
          }
          const rawServs = currentUser.servicios;
          const parsedServs = Array.isArray(rawServs)
            ? rawServs
            : typeof rawServs === 'string'
            ? JSON.parse(rawServs)
            : [];
          setServicios(parsedServs);
          setPrecios(currentUser.preciosServicios || {});
        }
      } catch (err) {
        console.warn('Usando usuario demo:', err);
      }
    }

    initSession();

    const hash = window.location.hash.replace('#', '');
    if (hash) {
      if (['mis-reservas', 'buscar', 'pago', 'tracking'].includes(hash)) {
        setActiveRole('dueno');
      }
      setCurrentSection(hash);
    }
  }, []);

  // Consultar solicitudes pendientes
  useEffect(() => {
    async function checkPending() {
      try {
        const data = await getServicios();
        const count = (data.servicios || []).filter((s) => s.estado === 'programado').length;
        setPendingCount(count);
      } catch {
        /* ignore */
      }
    }
    checkPending();
    const interval = setInterval(checkPending, 20000);
    return () => clearInterval(interval);
  }, []);

  const nivel = useMemo(() => {
    const cant = Number(user?.serviciosCompletados || 0);
    const calif = Number(user?.calificacion || 0);

    if (cant >= 50 && calif >= 4.5) return 'top';
    if (cant >= 10 && calif >= 4.0) return 'establecido';
    return 'nuevo';
  }, [user]);

  const handleToggleRole = (role) => {
    setActiveRole(role);
    setCurrentSection(role === 'prestador' ? 'precios' : 'mis-reservas');
  };

  const handleServiciosUpdated = (nuevosServicios, nuevosPrecios) => {
    setServicios(nuevosServicios);
    setPrecios(nuevosPrecios);
    setUser((prev) => ({
      ...prev,
      servicios: nuevosServicios,
      preciosServicios: nuevosPrecios,
    }));
  };

  const handleOpenChat = (servicioId) => {
    setActiveServicioId(servicioId);
    setCurrentSection('chat');
  };

  const handleNavigateToPay = (servicioId) => {
    setActiveServicioId(servicioId);
    setCurrentSection('pago');
  };

  const handleNavigateToTracking = (servicioId) => {
    setActiveServicioId(servicioId);
    setCurrentSection('tracking');
  };

  const handleReservaCreada = (servicioId) => {
    setActiveServicioId(servicioId);
    setCurrentSection('pago');
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/paginas/login.html';
  };

  return (
    <div className="min-h-screen bg-[#f4fbf9] flex flex-col text-slate-800">
      {/* Top Navbar */}
      <Navbar
        user={user}
        nivel={nivel}
        activeRole={activeRole}
        onToggleRole={handleToggleRole}
        onSelectSection={setCurrentSection}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Sidebar Navigation */}
          <Sidebar
            activeRole={activeRole}
            currentSection={currentSection}
            onSelectSection={setCurrentSection}
            pendingCount={pendingCount}
          />

          {/* Section Dynamic View */}
          <div className="flex-1 w-full min-w-0">
            {/* SECCIONES MODO PRESTADOR */}
            {activeRole === 'prestador' && (
              <>
                {currentSection === 'precios' && (
                  <PreciosSection
                    user={user}
                    nivel={nivel}
                    servicios={servicios}
                    precios={precios}
                    onServiciosUpdated={handleServiciosUpdated}
                  />
                )}

                {currentSection === 'rendimiento' && (
                  <RendimientoSection user={user} />
                )}

                {currentSection === 'solicitudes' && (
                  <SolicitudesSection onOpenChat={handleOpenChat} />
                )}

                {currentSection === 'trabajo' && (
                  <MiTrabajoSection
                    user={user}
                    onUserDataUpdated={setUser}
                  />
                )}

                {currentSection === 'cobros' && (
                  <CobrosGuarderiaSection
                    user={user}
                    onUserDataUpdated={setUser}
                  />
                )}

                {currentSection === 'vehiculo' && (
                  <VehiculoSection
                    user={user}
                    onUserDataUpdated={setUser}
                  />
                )}

                {currentSection === 'chat' && (
                  <ChatReportesSection
                    user={user}
                    initialServicioId={activeServicioId}
                  />
                )}

                {currentSection === 'perfil' && (
                  <PerfilSection
                    user={user}
                    servicios={servicios}
                    precios={precios}
                    onSelectSection={setCurrentSection}
                    onServiciosUpdated={handleServiciosUpdated}
                  />
                )}
              </>
            )}

            {/* SECCIONES MODO DUEÑO DE MASCOTA */}
            {activeRole === 'dueno' && (
              <>
                {currentSection === 'mis-reservas' && (
                  <MisReservasSection
                    onNavigateToPay={handleNavigateToPay}
                    onNavigateToTracking={handleNavigateToTracking}
                    onNavigateToChat={handleOpenChat}
                  />
                )}

                {currentSection === 'buscar' && (
                  <BuscarPrestadoresSection
                    user={user}
                    onReservaCreada={handleReservaCreada}
                  />
                )}

                {currentSection === 'pago' && (
                  <PagoSeguroSection
                    servicioId={activeServicioId}
                    onVolverReservas={() => setCurrentSection('mis-reservas')}
                  />
                )}

                {currentSection === 'tracking' && (
                  <SeguimientoGpsSection
                    servicioId={activeServicioId}
                    onVolver={() => setCurrentSection('mis-reservas')}
                    onOpenChat={handleOpenChat}
                  />
                )}

                {currentSection === 'chat' && (
                  <ChatReportesSection
                    user={user}
                    initialServicioId={activeServicioId}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Pac-Cop &copy; 2026 · Plataforma Integral de Servicios para Mascotas (React 19 + Vite 6 + Tailwind CSS v4)
        </div>
      </footer>
    </div>
  );
}
