# PAC-COP

Plataforma de gestión de servicios para mascotas. Un dueño busca un prestador (paseo, guardería o traslado), reserva, paga con custodia, sigue el servicio por GPS, conversa por chat y califica. El prestador administra precios, solicitudes, cobros y reclamos desde su panel.

Este repositorio es el resultado de integrar dos líneas de trabajo:

1. La rama menotti-organizado, de Luciana Menotti. Aporta la estructura backend y frontend con React y Vite, los reclamos, las reservas, el chat unificado con fotos y las notificaciones.
2. La rama prueba-integracion, de Maxi. Aporta el precio por volumen, las calificaciones, el panel de administración, la recuperación de contraseña, el tiempo real por SSE, la limitación de intentos, los estados de pago fallido y expirado, y el seguimiento GPS.

La integración mantiene una sola carpeta de backend y una sola de frontend. El frontend heredado de la rama de Maxi (HTML suelto, la carpeta prestador-react y las demás carpetas de páginas) se reescribió en React dentro de frontend. No queda código en carpetas heredadas.

## 1. Estructura del repositorio

```text
backend/       API Express 5 con Sequelize y MySQL (ES Modules)
frontend/      Aplicación React 18 con Vite 5
README.md
CONTEXTO.md    Contexto técnico para quien modifique el proyecto
PASO_A_PASO.md Guía de instalación y primer arranque en Windows
.gitignore
```

### Backend

```text
backend/
  app.js
  package.json
  .env.example
  config/
    database.js
  controllers/
    admin.controller.js
    mascota.controller.js
    mensaje.controller.js
    notificacion.controller.js
    pago.controller.js
    reclamo.controller.js
    reserva.controller.js
    servicio.controller.js
    user.controller.js
  helpers/
    auth.helper.js
    email.helper.js
    email.templates.js
    imagen.helper.js
    password.helper.js
    precio.helper.js
    realtime.helper.js
  middlewares/
    admin.middleware.js
    auth.middleware.js
    rateLimit.middleware.js
    upload.middleware.js
    validation.middleware.js
  models/
    calificacion.model.js
    mascota.model.js
    mensaje.model.js
    notificacion.model.js
    pago.model.js
    reclamo.model.js
    reserva.model.js
    servicio.model.js
    ubicacion.model.js
    user.model.js
  routes/
    admin.routes.js
    evento.routes.js
    mascota.routes.js
    mensaje.routes.js
    notificacion.routes.js
    pago.routes.js
    reclamo.routes.js
    reserva.routes.js
    servicio.routes.js
    user.routes.js
  test/
    helpers.test.js
    precio.test.js
```

Responsabilidades:

1. config: conexión de Sequelize con las variables DB_.
2. models: tablas y relaciones.
3. routes: asociación entre rutas HTTP y controladores.
4. controllers: lógica de cada recurso.
5. middlewares: sesión, rol de administrador, limitación de intentos, validación de datos y recepción de imágenes con multer.
6. helpers: firma de sesión, hash de contraseñas, guardado de imágenes del chat, cálculo de precios, correo y canal de eventos en tiempo real.

El servidor solo expone la API bajo /api, más las evidencias de reclamos en /uploads/reclamos. No sirve páginas. Cualquier ruta /api sin coincidencia responde JSON 404.

### Frontend

```text
frontend/
  index.html
  package.json
  vite.config.js
  public/img/
  src/
    main.jsx
    App.jsx
    config/        api.js, rutas.js, estilos/ (estilos como módulos JS y la hoja de Tailwind del panel)
    helpers/       funciones puras (precios, niveles, servicios, notificaciones, mapas, PDF, tarjeta)
    hooks/         sesión, tiempo real (SSE), servicios, chat, seguimiento, estilos, Bootstrap
    components/
      admin/       tablas del panel de administración
      chat/        conversación unificada
      panel/       secciones del panel del prestador
      pago/        piezas de la pantalla de pago
      reclamos/    modal de reclamo
      servicios/   modales de calificar y cancelar
    pages/         una página por ruta
```

Criterios de la arquitectura de React:

1. Una página por ruta. Los componentes agrupan piezas reutilizables y los hooks aíslan la lógica con estado.
2. La sesión se concentra en el proveedor ProveedorAuth y el hook useAuth. El acceso por rol, en RutaProtegida.
3. Vite hace de proxy de /api y /uploads hacia el backend (puerto 3000). Navegador y API comparten origen y las cookies httpOnly funcionan sin configuración adicional.
4. Bootstrap, los iconos de Bootstrap, Leaflet y jsPDF se instalan por npm.
5. Estilos. `src/styles/tema.css` define tipografía (Inter y Fraunces), colores y modo oscuro. Todas las páginas comparten la barra `NavbarApp` y el pie `PieApp` a través de `LayoutApp`. Bootstrap se inyecta en todas las rutas menos el panel del prestador, que usa Tailwind 4 (ver `hooks/useMotorEstilos.js`). Detalle del rediseño en README_FUSION.md.

## 2. Rutas del frontend

| Ruta | Acceso |
| --- | --- |
| / | Público. Landing para visitantes, resumen de cuenta para dueños y administradores, redirige al panel si es prestador |
| /login | Público |
| /registro | Público |
| /recuperar | Público |
| /restablecer?token= | Público |
| /buscar-prestadores | Público. Reservar exige ser dueño con sesión |
| /alertas, /mach, /numero | Público |
| /pago?servicioId= | Cualquier usuario con sesión |
| /seguimiento?servicioId= | Cualquier usuario con sesión |
| /inicio | Redirige a / |
| /mis-mascotas, /registro-mascota, /ficha-salud | Dueño |
| /mis-servicios | Dueño y prestador |
| /panel-prestador/:seccion? | Prestador |
| /perfil-prestador | Prestador. Redirige a /panel-prestador/perfil |
| /chat?servicioId= | Cualquier usuario con sesión |
| /notificaciones | Cualquier usuario con sesión |
| /admin | Administrador |
| /admin-reclamos | Administrador |

Cualquier otra ruta redirige a /. Son administradores los roles admin y administrador.

Secciones del panel del prestador (/panel-prestador/:seccion): precios (por defecto), rendimiento, solicitudes, trabajo, cobros, vehiculo, chat, reclamos y perfil.

## 3. Funcionalidades

### Aportadas por la rama menotti-organizado (Luciana)

1. Reclamos de servicios finalizados con hasta 5 imágenes de evidencia (jpeg, png o webp, 5 MB cada una). Estados pendiente, en-revision y finalizado, que solo avanzan en ese orden. Solo el administrador cambia el estado. Cada alta o cambio genera notificaciones.
2. Chat unificado por servicio. Un único chat al que entran dueño, prestador y administrador, disponible con el servicio aceptado o en curso. Cada mensaje lleva texto, imagen o ambos. Se puede adjuntar desde la galería o tomar con la cámara, con ubicación GPS y hora. El servidor acepta jpeg, png y webp de hasta 6 MB y las guarda en backend/uploads/chat. Las imágenes se entregan con sesión y permiso sobre el servicio.
3. Reservas (POST /api/reservas), tabla Reservas. Es un endpoint heredado que el frontend no usa. El flujo real de contratación es Servicio.
4. Notificaciones por usuario con contador de no leídas.
5. Mascotas con ficha de salud, búsqueda de prestadores, mis servicios, alertas, mach y número.
6. Sesión con cookie httpOnly pac_cop_session y contraseñas con scrypt.

### Aportadas por la rama prueba-integracion (Maxi)

1. Precio por volumen. Cada prestador define un precio base por servicio y una regla de descuento para la segunda mascota en adelante (porcentaje o monto fijo). El precio sugerido sale del rango real de mercado.
2. Reserva con varias mascotas, traslado con origen, destino y motivo, y viaje de vuelta cuando el motivo es queda.
3. Validación en la reserva de disponibilidad horaria, tamaños aceptados y razas excluidas del prestador.
4. Pago con custodia (escrow). Estados pendiente, retenido, liberado, fallido, expirado y reembolsado. Un pago pendiente expira a los 15 minutos. Una tarjeta que termina en 0000 simula un rechazo. Al finalizar el servicio se libera el pago al prestador.
5. Cancelación. El dueño recibe reembolso si cancela con 12 horas o más de anticipación. Si no, el pago se libera al prestador. Cancelaciones del prestador siempre reembolsan.
6. Seguimiento GPS en tiempo real con mapa Leaflet. El prestador inicia y finaliza el servicio y su navegador envía la ubicación.
7. Calificaciones y reseñas del prestador, una por servicio y dueño.
8. Check-in y check-out de guardería, cuenta de cobro y liquidaciones.
9. Panel de administración: resumen, usuarios (rol y verificación) y servicios (cancelación).
10. Recuperación de contraseña por correo.
11. Tiempo real por SSE en GET /api/eventos (eventos conectado, notificacion, mensaje y ubicacion).
12. Limitación de intentos en memoria en registro, login y recuperación. Responde 429 con Retry-After.
13. Notificaciones por reservas, pagos, mensajes, reseñas y administración, con tipos reserva, reserva-aceptada, reserva-rechazada, reserva-cancelada, mensaje, pago-confirmado, pago-fallido, pago-liberado y resena.
14. Niveles del prestador (nuevo, establecido, top) según servicios finalizados y calificación.

### Combinación de ambas ramas

1. Panel del prestador. Se conservó el de Maxi como base, reescrito en React con Tailwind, y se le agregaron las secciones de reclamos y de chat unificado de Luciana. Las pestañas estáticas de la versión de Luciana (niveles, publicar, rendimiento, ruta) se reemplazaron por secciones con datos reales.
2. Notificaciones. Se mantuvo el modelo de Luciana y las de reclamos también se envían por SSE. Hay una campana flotante con avisos en tiempo real y la página /notificaciones.
3. Páginas de dueño. Se mantuvieron las de Luciana (Bootstrap) y se les incorporó la lógica final de Maxi: reserva con varias mascotas y traslado, pago, cancelación, calificación, reseñas y seguimiento.

## 4. API

Todas las rutas, salvo las marcadas como públicas, exigen sesión.

| Recurso | Endpoints |
| --- | --- |
| Usuarios | POST /api/users (público), POST /api/users/login (público), POST /api/users/recuperar (público), POST /api/users/restablecer (público), POST /api/users/logout, GET /api/users/me, GET /api/users (filtros rol, servicio, zona, q), GET /api/users/:id, PUT /api/users/me/servicios, PUT /api/users/me/disponibilidad, PUT /api/users/me/restricciones, PUT /api/users/me/vehiculo, PUT /api/users/me/cuenta-cobro |
| Mascotas | POST /api/mascotas, GET /api/mascotas/usuario/:userId, GET /api/mascotas/:id, PUT /api/mascotas/:id |
| Reservas | POST /api/reservas |
| Servicios | POST /api/servicios, POST /api/servicios/demo, GET /api/servicios (filtros estado, servicio y paginación limite y pagina), GET /api/servicios/precios/sugerido, GET /api/servicios/prestador/ruta, GET /api/servicios/prestador/:id/resenas, GET /api/servicios/:id, POST /api/servicios/:id/{aceptar, rechazar, cancelar, check-in, check-out, iniciar, finalizar, ubicacion, calificacion}, GET /api/servicios/:id/ubicacion |
| Pagos | POST /api/pagos, GET /api/pagos/liquidaciones, GET /api/pagos/servicio/:servicioId, GET /api/pagos/:id, POST /api/pagos/:id/{confirmar, liberar, fallido} |
| Mensajes | GET /api/mensajes/:servicioId (parámetro desde), POST /api/mensajes/:servicioId, GET /api/mensajes/:servicioId/imagen/:archivo |
| Reclamos | GET /api/reclamos, POST /api/reclamos (multipart), PATCH /api/reclamos/:id/estado |
| Notificaciones | GET /api/notificaciones, POST /api/notificaciones/leer-todas, POST /api/notificaciones/:id/leer |
| Eventos | GET /api/eventos (SSE) |
| Administración | GET /api/admin/resumen, GET /api/admin/usuarios, PUT /api/admin/usuarios/:id, GET /api/admin/servicios, POST /api/admin/servicios/:id/cancelar |
| Archivos | GET /uploads/reclamos/:archivo (sin sesión) |

## 5. Requisitos

1. Node.js 20 o superior.
2. MySQL 8 o compatible, con una base de datos vacía creada (por ejemplo desde XAMPP).
3. Git.

## 6. Variables de entorno del backend

Crear backend/.env a partir de backend/.env.example. El archivo .env no se sube al repositorio.

| Variable | Descripción |
| --- | --- |
| DB_NAME | Nombre de la base de datos |
| DB_USER | Usuario de la base |
| DB_PASSWORD | Contraseña de la base |
| DB_HOST | Servidor de la base, por ejemplo localhost |
| DB_DIALECT | mysql |
| PORT | Puerto del backend. Por defecto 3000 |
| NODE_ENV | development o production |
| DB_SYNC_ALTER | true en desarrollo. En producción la estructura no se altera |
| FRONTEND_ORIGIN | Origen permitido por CORS, http://localhost:5173 |
| AUTH_SECRET | Clave de al menos 32 caracteres |
| FRONTEND_URL | Opcional. Base del enlace de recuperación. Por defecto FRONTEND_ORIGIN y luego http://localhost:5173 |
| PASSWORD_RESET_PATH | Opcional. Ruta del formulario de nueva contraseña. Por defecto /restablecer |
| SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM | Opcionales. Envío real de correos. Sin ellos, el enlace de recuperación se imprime en la consola del backend |

## 7. Ejecución

Terminal 1, backend (puerto 3000):

```text
cd backend
npm install
npm run dev
```

Terminal 2, frontend (puerto 5173):

```text
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173.

Scripts del backend: npm start (sin reinicio automático), npm run dev (reinicia al cambiar un archivo) y npm test (pruebas con node --test).

Scripts del frontend: npm run dev, npm run build (genera frontend/dist) y npm run preview.

Al iniciar, el backend crea las tablas y agrega las columnas que falten. Si no puede conectarse a MySQL, no arranca y explica el motivo en la consola.

## 8. Pruebas realizadas y límites

Verificado en este entorno:

1. node --check sobre todos los archivos del backend y carga de todos los módulos sin errores de importación.
2. npm test del backend: 7 pruebas correctas (hash y sesión, y cálculo de precios).
3. npm run build del frontend sin errores.
4. Renderizado de las páginas con datos simulados.

No verificado, porque no hay MySQL con credenciales en el entorno de integración:

1. Arranque real con MySQL y sincronización de tablas.
2. Recorrido completo contra la API real: login, SSE a través del proxy, pagos, cancelaciones, reclamos con imágenes, chat con cámara y GPS del navegador, y panel de administración.

## 9. Notas y puntos a tener en cuenta

1. Las evidencias de reclamos y las imágenes del chat se guardan en el disco del servidor, en backend/uploads. Con varias instancias hace falta almacenamiento compartido.
2. Los eventos en tiempo real y la limitación de intentos viven en la memoria del proceso. Con varias instancias no se comparten.
3. Detrás del proxy de Vite todos los usuarios de desarrollo comparten una IP, por lo que el límite de intentos puede alcanzarse. Los valores están en backend/routes/user.routes.js.
4. POST /api/reservas no exige sesión y toma userId del cuerpo. Es un endpoint heredado que el frontend no usa.
5. Si el traslado de ida y vuelta tiene una hora de regreso inválida, el servicio de ida ya se creó cuando se devuelve el error 400.
6. El panel de administración de reclamos (/admin-reclamos) y el de gestión general (/admin) son páginas distintas.
7. El resumen de /api/admin/resumen incluye los servicios rechazados en el total.
8. Las columnas de las tablas existentes se agregan al iniciar. Una base creada solo con la rama de Maxi tiene una tabla Notificacions que este proyecto no usa. Las notificaciones viven en la tabla Notificaciones.
9. Un servicio nace en estado programado. El prestador debe aceptarlo para poder iniciar el seguimiento, y el chat solo está disponible con el servicio aceptado o en curso.
10. Pueden aparecer avisos de fin de línea (LF y CRLF) al confirmar cambios. Son inofensivos.
11. El registro solo permite los roles dueño y prestador. Un administrador se crea cambiando a mano la columna rol de un usuario a admin en la tabla Users.
