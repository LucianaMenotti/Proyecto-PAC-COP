# PAC-COP

Aplicación web para gestionar usuarios, mascotas, fichas de salud y servicios para mascotas.

## Requisitos

- Node.js 20 o superior.
- MySQL 8 o superior.
- XAMPP u otro servidor local para iniciar MySQL.

## Instalación

1. Instalar dependencias:

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

`AUTH_SECRET` debe ser privada y tener al menos 32 caracteres. No subir `.env` al repositorio.

## Ejecución

Iniciar MySQL y después ejecutar:

```bash
npm start
```

Abrir [http://localhost:3000](http://localhost:3000).

El servidor no se inicia si no puede conectarse a MySQL. En desarrollo crea las tablas y actualiza automáticamente las columnas faltantes con Sequelize. En producción no modifica la estructura existente.

La actualización automática se controla con `DB_SYNC_ALTER`. Para desarrollo debe permanecer en `true` (o puede omitirse, porque ese es el valor predeterminado). Si se establece en `false`, el backend solo sincroniza las tablas sin alterar columnas. En producción la actualización automática se desactiva siempre.

## Autenticación

El registro y el login usan una cookie `httpOnly` llamada `pac_cop_session`. Las contraseñas se almacenan mediante un hash con `scrypt` y nunca se devuelven en las respuestas.

Endpoints principales:

```text
POST /api/users
POST /api/users/login
POST /api/users/logout
GET  /api/users/me
GET  /api/users
POST /api/mascotas
GET  /api/mascotas/usuario/:userId
GET  /api/mascotas/:id
PUT  /api/mascotas/:id
```

Las rutas de mascotas requieren sesión y verifican que la mascota pertenezca al usuario autenticado.

## Pruebas

Ejecutar las pruebas unitarias disponibles con:

```bash
npm test
```

También conviene probar manualmente el registro, login, cierre de sesión, creación de mascota y actualización de la ficha de salud.

## Estructura

```text
assets/       recursos visuales
css/          estilos
js/           lógica del frontend
paginas/      páginas HTML
src/config/   conexión a MySQL
src/models/   modelos Sequelize
src/routes/   rutas HTTP
src/controllers/ controladores
src/helpers/  contraseñas y sesiones
src/middlewares/ autenticación y validaciones
test/         pruebas automatizadas
```
