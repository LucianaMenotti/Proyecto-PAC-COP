# PAC-COP

Plataforma de gestión de servicios para mascotas. Este documento describe la reorganización del proyecto de la rama menotti hacia la rama menotti-organizado.

## 1. Alcance

La rama menotti no se modifica. Todo el trabajo se aplica en la rama menotti-organizado.

La lógica de negocio se mantiene. Los modelos, las rutas, los permisos, los estados del servicio y las reglas de pago no cambian.

La única funcionalidad modificada es el chat entre dueño y prestador. Se describe en la sección 6.

## 2. Cambios estructurales

1. El proyecto se divide en dos carpetas independientes: backend y frontend.
2. El servidor Express deja de servir páginas. Solo expone la API bajo la ruta /api.
3. Cada página HTML se convierte en una página de React.
4. Cada archivo JavaScript que manipulaba el DOM se convierte en un componente, un hook o un helper.
5. Cada archivo CSS se convierte en un módulo JavaScript dentro de frontend/src/config/estilos. Un hook lo inyecta mientras la página está montada.
6. Bootstrap, los iconos de Bootstrap, Leaflet y jsPDF se instalan por npm. Ya no se cargan desde una red de distribución externa.
7. La sesión de usuario se concentra en un proveedor de React con el hook useAuth.
8. El acceso por rol se concentra en el componente RutaProtegida.
9. Vite reemplaza al servidor de archivos estáticos. El único archivo HTML es frontend/index.html, que Vite exige como punto de entrada.

## 3. Motivos de la nueva arquitectura

1. La separación permite desplegar y escalar cada parte por su cuenta.
2. Cada carpeta tiene una responsabilidad única. Esto reduce el costo de mantenimiento.
3. Los componentes de React eliminan la duplicación de marcado entre páginas.
4. Los hooks aíslan la lógica con estado. Las páginas quedan como composición de piezas.
5. El proxy de Vite hace que navegador y API compartan origen. Las cookies httpOnly funcionan sin configuración adicional.

## 4. Estructura del backend

```text
backend/
  app.js
  package.json
  .env.example
  config/
    database.js
  controllers/
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
    imagen.helper.js
    password.helper.js
  middlewares/
    auth.middleware.js
    upload.middleware.js
    validation.middleware.js
  models/
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
```

Responsabilidades:

1. config: conexión de Sequelize con las variables DB_.
2. models: definición de tablas y relaciones.
3. routes: asociación entre rutas HTTP y controladores.
4. controllers: lógica de cada recurso.
5. middlewares: verificación de sesión, de rol y de datos de entrada.
6. helpers: firma de sesión, cifrado de contraseñas y guardado de imágenes.
7. upload.middleware.js: recepción de las imágenes de evidencia de los reclamos con multer.

## 5. Estructura del frontend

```text
frontend/
  index.html
  package.json
  vite.config.js
  public/
    img/
  src/
    main.jsx
    App.jsx
    config/
      api.js
      rutas.js
      estilos/
    helpers/
    hooks/
    components/
      chat/
      pago/
      panel/
    pages/
```

Responsabilidades:

1. pages: una página por ruta.
2. components: piezas reutilizables. Las subcarpetas chat, pago y panel agrupan piezas de una misma página.
3. hooks: sesión, estilos, Bootstrap, servicios, seguimiento y chat.
4. helpers: funciones puras, como PDF del comprobante, validación de tarjeta, niveles y mapas.
5. config: cliente de la API, tabla de rutas y estilos.

Rutas del frontend:

| Ruta | Acceso |
| --- | --- |
| / | Público |
| /login | Público |
| /registro | Público |
| /buscar-prestadores | Público |
| /pago | Público |
| /seguimiento | Público |
| /alertas | Público |
| /mach | Público |
| /numero | Público |
| /inicio | Cualquier usuario con sesión |
| /mis-mascotas | Dueño |
| /registro-mascota | Dueño |
| /ficha-salud | Dueño |
| /mis-servicios | Dueño y prestador |
| /notificaciones | Cualquier usuario con sesión |
| /admin-reclamos | Administrador |
| /panel-prestador | Prestador |
| /perfil-prestador | Prestador |
| /chat | Cualquier usuario con sesión |

Cualquier otra ruta redirige a /.

## 6. Chat unificado

Antes, la subida de fotos y la conversación de texto estaban en secciones separadas. Ahora existe una sola interfaz.

1. Hay un único chat por servicio. Dueño, prestador y administrador entran al mismo.
2. Las reglas de acceso no cambian. El chat solo está disponible con el servicio en estado aceptado o en-curso.
3. Cada mensaje puede llevar texto, una imagen, o ambos.
4. El botón de clip adjunta una imagen desde la galería.
5. El botón de cámara abre la cámara del dispositivo. Agrega ubicación GPS y hora a la foto. Si la cámara no está disponible, se ofrece selección por archivo.
6. Antes de enviar, se muestra una vista previa con descripción opcional.
7. Tocar una imagen del chat la abre en tamaño completo.
8. La conversación se actualiza cada 3 segundos con GET /api/mensajes/:servicioId?desde=ID. Solo se piden los mensajes nuevos.
9. El cliente reduce la imagen a 1280 píxeles y calidad JPEG 0.82 antes de enviarla.
10. El servidor acepta jpeg, png y webp de hasta 6 MB. Las guarda en backend/uploads/chat con nombre aleatorio.
11. Las imágenes se entregan por GET /api/mensajes/:servicioId/imagen/:archivo. Esa ruta exige sesión y permiso sobre el servicio.

Endpoints del chat:

| Método | Ruta | Función |
| --- | --- | --- |
| GET | /api/mensajes/:servicioId | Lista mensajes. Acepta el parámetro desde |
| POST | /api/mensajes/:servicioId | Envía texto, imagen, latitud y longitud |
| GET | /api/mensajes/:servicioId/imagen/:archivo | Entrega una imagen |

Campos nuevos del modelo Mensaje: imagenArchivo, latitud y longitud. El campo texto ahora admite cadena vacía cuando el mensaje solo trae imagen.

## 7. Reclamos y notificaciones

Estos módulos ya existían en la rama menotti. Se migraron sin cambiar su lógica.

Reclamos:

1. Solo se reclaman servicios en estado finalizado.
2. Dueño y prestador pueden reclamar. El reclamo se dirige a la otra parte del servicio.
3. Cada usuario puede abrir un solo reclamo por servicio.
4. La descripción debe tener entre 10 y 2000 caracteres.
5. Se aceptan hasta 5 imágenes jpeg, png o webp de hasta 5 MB cada una.
6. El administrador no puede abrir reclamos. Es el único que cambia el estado.
7. Los estados son pendiente, en-revision y finalizado. Solo avanzan en ese orden.
8. Cada alta o cambio de estado genera notificaciones para las partes y para los administradores.

Las imágenes se guardan en backend/uploads/reclamos. El servidor las entrega por GET /uploads/reclamos/:archivo, igual que en la rama menotti, sin pedir sesión. El proxy de Vite redirige esa ruta al backend.

Notificaciones:

1. Cada usuario ve solo las suyas.
2. El contador de no leídas aparece en Inicio, Mis servicios, el panel del prestador y la gestión de reclamos.
3. El contador se actualiza cada 15 segundos en Mis servicios y en el panel. En la gestión de reclamos, cada 20.

Endpoints:

| Método | Ruta | Función |
| --- | --- | --- |
| GET | /api/reclamos | Lista reclamos. El administrador ve todos |
| POST | /api/reclamos | Crea un reclamo con imágenes en formato multipart |
| PATCH | /api/reclamos/:id/estado | Cambia el estado. Solo administrador |
| GET | /api/notificaciones | Lista las notificaciones y el total de no leídas |
| POST | /api/notificaciones/leer-todas | Marca todas como leídas |
| POST | /api/notificaciones/:id/leer | Marca una como leída |

Tablas nuevas: Reclamos y Notificaciones. Sequelize las crea al iniciar el servidor. No modifican las tablas existentes.

Dependencia nueva del backend: multer.

## 8. Requisitos

1. Node.js 18 o superior.
2. MySQL 8 o compatible, con una base de datos vacía creada.
3. Git.

Verificado: la compilación del frontend y las pruebas de punta a punta se ejecutaron con una base SQLite temporal, no con MySQL. El uso con MySQL no se probó en este entorno.

## 9. Variables de entorno del backend

Crear el archivo backend/.env a partir de backend/.env.example.

| Variable | Descripción |
| --- | --- |
| DB_NAME | Nombre de la base de datos |
| DB_USER | Usuario de la base |
| DB_PASSWORD | Contraseña de la base |
| DB_HOST | Servidor de la base, por ejemplo localhost |
| DB_DIALECT | mysql |
| PORT | 3000 |
| NODE_ENV | development |
| DB_SYNC_ALTER | true en desarrollo |
| FRONTEND_ORIGIN | http://localhost:5173 |
| AUTH_SECRET | Clave de al menos 32 caracteres |

## 10. Ejecución

Terminal 1, backend:

```text
cd backend
npm install
npm run dev
```

Terminal 2, frontend:

```text
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173 en el navegador.

Compilar el frontend para producción:

```text
cd frontend
npm run build
```

Ejecutar las pruebas del backend:

```text
cd backend
npm test
```

## 11. Supuestos y puntos pendientes

1. Se eligió Vite como herramienta del frontend. El enunciado no la especificaba.
2. Se eligió actualización por consulta periódica y no WebSockets. El documento CONTEXTO.md de la rama original desaconseja WebSockets.
3. Las imágenes del chat se guardan en el disco del servidor. En un despliegue con varias instancias se requiere almacenamiento compartido.
4. El prototipo panel-prestador no se migró. No está enlazado desde ninguna página y su script no coincide con su HTML.
5. La carpeta prestadordeServicio duplicada se descartó. Su contenido quedó reemplazado por la página de chat unificada.
6. Se retiraron los emojis de la interfaz. Se conservaron los símbolos de estrella y de verificación.
7. La imagen assets/img/descarga (58).png no venía en el archivo de código recibido. Debe copiarse a frontend/public/img. Mientras falte, el navegador muestra un error 404 solo para esa imagen.
8. Los modales de Bootstrap con JavaScript, incluido el de reclamo, se reemplazaron por modales controlados con estado de React. El aspecto y el comportamiento se mantienen.
9. Con el prestador en la ruta /pago aparece el mensaje de que no tiene servicios asignados. Es el comportamiento original.
10. Un servicio demo nace en estado programado. El backend exige estado aceptado para iniciar el seguimiento. Es la lógica original.
11. Mis servicios admite dueño y prestador, igual que en la rama menotti actual.
12. Los archivos de evidencia que ya existan en la carpeta uploads de la raíz deben moverse a backend\uploads. Si no, los reclamos antiguos no mostrarán sus imágenes.
13. En la rama menotti, Express servía toda la raíz del proyecto como archivos estáticos. En la rama nueva solo se sirve uploads/reclamos.
14. Los reclamos y las notificaciones se probaron de punta a punta con una base SQLite temporal: alta con imagen, contadores, cambio de estado, filtros y permisos por rol.
