# PAC-COP

Aplicación web para gestionar usuarios, mascotas, fichas de salud y servicios para mascotas.

## Requisitos

* Node.js 20 o superior.
* MySQL 8 o superior.
* XAMPP u otro servidor local para iniciar MySQL.

## Instalación

1. Instalar las dependencias:

```bash
npm install
```

2. Crear `.env` en la raíz copiando `.env.example`.

3. Completar las variables:

```text
DB_NAME=pac_cop
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_DIALECT=mysql
PORT=3000
FRONTEND_ORIGIN=http://localhost:3000
AUTH_SECRET=una-clave-local-de-al-menos-32-caracteres
```

`AUTH_SECRET` debe ser privada y tener al menos 32 caracteres.

**No subir `.env` al repositorio.**

## Base de datos

El proyecto utiliza MySQL mediante Sequelize.

Antes de iniciar el proyecto:

1. Abrir XAMPP.
2. Iniciar MySQL.
3. Verificar las credenciales del archivo `.env`.
4. Ejecutar el proyecto.

La base de datos utilizada por defecto es:

```text
pac_cop
```

Durante el desarrollo, Sequelize puede crear las tablas y actualizar columnas automáticamente.

La actualización se controla mediante:

```text
DB_SYNC_ALTER=true
```

Para desarrollo puede permanecer en `true` o puede omitirse porque es el valor predeterminado.

Si se establece en `false`, Sequelize sincroniza las tablas sin modificar columnas existentes.

## Ejecución

Iniciar MySQL y ejecutar:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

`npm run dev` es el comando recomendado durante el desarrollo porque reinicia el backend cuando se modifica un archivo.

También está disponible:

```bash
npm start
```

`npm start` ejecuta el servidor sin reinicio automático.

## Autenticación

El registro y el login utilizan una cookie `httpOnly` llamada:

```text
pac_cop_session
```

Las contraseñas se almacenan mediante un hash con `scrypt` y nunca se devuelven en las respuestas.

Endpoints principales:

```text
POST /api/users
POST /api/users/login
POST /api/users/logout
GET  /api/users/me
GET  /api/users
```

Las rutas protegidas requieren una sesión válida.

## Mascotas

Las mascotas pertenecen a un usuario y pueden utilizarse posteriormente para solicitar servicios.

Endpoints principales:

```text
POST /api/mascotas
GET  /api/mascotas/usuario/:userId
GET  /api/mascotas/:id
PUT  /api/mascotas/:id
```

Las rutas verifican que el usuario tenga permisos sobre la mascota.

## Servicios y reservas

Los dueños pueden buscar prestadores y solicitar servicios para sus mascotas.

Los servicios utilizan los siguientes estados:

```text
programado
aceptado
en-curso
finalizado
rechazado
```

Endpoints principales:

```text
POST /api/servicios
POST /api/servicios/demo

GET  /api/servicios
GET  /api/servicios/:id

POST /api/servicios/:id/aceptar
POST /api/servicios/:id/rechazar
POST /api/servicios/:id/iniciar
POST /api/servicios/:id/finalizar

POST /api/servicios/:id/ubicacion
GET  /api/servicios/:id/ubicacion
```

El endpoint `GET /api/servicios` devuelve los servicios correspondientes al usuario autenticado.

* Dueño: sus servicios.
* Prestador: servicios asignados.
* Administrador: servicios disponibles para administración.

## Mis servicios

Los dueños cuentan con una pantalla para consultar sus reservas:

```text
paginas/mis-servicios.html
js/mis-servicios.js
```

La pantalla obtiene los datos mediante:

```text
GET /api/servicios
```

Muestra:

* Tipo de servicio.
* Mascota.
* Prestador.
* Fecha programada.
* Monto.
* Estado.

Cuando el servicio está `aceptado` o `en-curso`, el dueño puede abrir el chat correspondiente.

## Chat

El proyecto cuenta con un sistema de chat asociado a los servicios.

Cada servicio tiene una conversación propia y tanto el dueño como el prestador utilizan el mismo chat.

La página es:

```text
prestadordeServicio/chatApp.html?servicioId=<id>
```

Endpoints:

```text
GET  /api/mensajes/:servicioId
POST /api/mensajes/:servicioId
```

El backend verifica que el usuario sea:

* El dueño del servicio.
* El prestador del servicio.
* Un administrador.

El chat está disponible cuando el servicio está:

```text
aceptado
en-curso
```

Los mensajes se almacenan en MySQL.

## Panel del prestador

La lógica del panel del prestador se encuentra separada en módulos:

```text
js/panel-prestador.js
js/panel-rendimiento.js
js/panel-servicios.js
js/panel-solicitudes.js
js/panel-activos.js
```

Esto permite separar:

* Información general.
* Rendimiento.
* Servicios ofrecidos.
* Solicitudes.
* Servicios activos.

Los servicios activos permiten acceder al chat correspondiente.

## Pagos

El módulo de pagos se encuentra en:

```text
pagos/
├── pago.html
├── pago.js
└── pago.css
```

## Seguimiento GPS

El seguimiento GPS se encuentra en:

```text
seguimiento gps en tiempo real/
├── seguimiento.html
├── seguimiento.js
└── seguimiento.css
```

Permite guardar y consultar la ubicación asociada a un servicio.

## Pruebas

Ejecutar:

```bash
npm test
```

También se recomienda probar manualmente:

* Registro.
* Login.
* Logout.
* Registro de mascotas.
* Solicitud de servicios.
* Aceptación y rechazo de servicios.
* Consulta de Mis servicios.
* Acceso al chat desde el dueño.
* Acceso al mismo chat desde el prestador.
* Envío y recepción de mensajes.
* Inicio y finalización de servicios.
* Seguimiento GPS.
* Pagos.

## Estructura

```text
assets/                         recursos visuales

css/                            estilos

js/                             lógica del frontend

paginas/                        páginas HTML

pagos/                          módulo de pagos

prestadordeServicio/            chat, cámara y reportes

seguimiento gps en tiempo real/ seguimiento GPS

src/
    config/                     conexión a MySQL
    models/                     modelos Sequelize
    routes/                     rutas HTTP
    controllers/                controladores
    helpers/                    contraseñas y sesiones
    middlewares/                autenticación y validaciones

test/                           pruebas automatizadas

.env.example                    variables de entorno de ejemplo
package.json                    dependencias y scripts
README.md                       documentación principal
CONTEXTO_IA.md                  contexto técnico para asistentes de IA
```

## Scripts

```bash
npm install
npm run dev
npm start
npm test
```

* `npm install`: instala las dependencias.
* `npm run dev`: inicia el servidor en desarrollo.
* `npm start`: inicia el servidor normalmente.
* `npm test`: ejecuta las pruebas automatizadas.

## Documentación técnica adicional

El archivo `CONTEXTO_IA.md` contiene información técnica detallada sobre la arquitectura actual del proyecto y las relaciones entre sus módulos.

Se recomienda consultarlo antes de realizar modificaciones importantes.
