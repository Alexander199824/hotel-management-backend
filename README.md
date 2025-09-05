# 🏨 Hotel Mar Azul - Sistema de Gestión Hotelera

**Desarrollador:** Alexander Echeverria

Sistema completo de gestión hotelera desarrollado en Node.js con Express, PostgreSQL y arquitectura REST API. Diseñado para manejar reservas, huéspedes, habitaciones, servicios adicionales, incidencias y reportes.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Base de Datos](#-base-de-datos)
- [Testing](#-testing)
- [Despliegue](#-despliegue)
- [Contribución](#-contribución)

## ✨ Características

### 🎯 Funcionalidades Principales
- **Gestión de Reservas**: Creación, modificación, check-in/check-out automático
- **Administración de Habitaciones**: Control de disponibilidad, estado y mantenimiento
- **Registro de Huéspedes**: Perfiles completos con historial y preferencias
- **Servicios Adicionales**: Restaurante, spa, transporte y más
- **Sistema de Incidencias**: Reporte y seguimiento de mantenimiento
- **Reportes Avanzados**: Ocupación, ventas, huéspedes y análisis financiero
- **Dashboard en Tiempo Real**: Métricas y KPIs del hotel

### 🔐 Seguridad y Autenticación
- JWT para autenticación de usuarios
- Roles y permisos granulares (Admin, Manager, Recepcionista, Limpieza)
- Rate limiting y protección contra ataques
- Validación exhaustiva de datos
- Logging de auditoría completo

### 🌐 Características Técnicas
- API RESTful con documentación completa
- Soporte multiidioma (ES, EN, FR, DE, PT)
- Notificaciones por email automáticas
- Integración con pasarelas de pago
- Exportación de reportes en múltiples formatos
- Arquitectura escalable y modular

## 🛠 Tecnologías

### Backend
- **Node.js** (>= 14.0.0) - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos principal
- **Sequelize** - ORM para PostgreSQL
- **JWT** - Autenticación de usuarios
- **Bcrypt** - Hashing de contraseñas

### Herramientas y Librerías
- **Nodemailer** - Envío de emails
- **Morgan & Winston** - Logging
- **Helmet** - Seguridad HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Express Validator** - Validación de datos
- **Express Rate Limit** - Control de tasa de requests

### Desarrollo
- **Nodemon** - Auto-restart en desarrollo
- **Jest** - Framework de testing
- **ESLint** - Linting de código
- **Prettier** - Formateo de código

## 🚀 Instalación

### Prerrequisitos

Asegúrate de tener instalado:
- **Node.js** 14.0.0 o superior
- **npm** 6.0.0 o superior
- **PostgreSQL** 12.0 o superior
- **Git**

### Paso 1: Clonar el Repositorio

```bash
# Crear directorio del proyecto
mkdir hotel-management-backend
cd hotel-management-backend

# Si usas Git (opcional)
git init
```

### Paso 2: Crear Estructura de Archivos

Copia todos los archivos proporcionados siguiendo la estructura:

```
hotel-management-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── environment.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── reservationController.js
│   │   ├── roomController.js
│   │   ├── guestController.js
│   │   ├── reportController.js
│   │   └── incidentController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Room.js
│   │   ├── Reservation.js
│   │   ├── Guest.js
│   │   ├── Invoice.js
│   │   ├── AdditionalService.js
│   │   └── Incident.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── reservations.js
│   │   ├── rooms.js
│   │   ├── guests.js
│   │   ├── reports.js
│   │   └── incidents.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── emailService.js
│   │   ├── paymentService.js
│   │   └── reportService.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── constants.js
│   └── app.js
├── migrations/
│   └── init.sql
├── package.json
├── .env.example
├── .gitignore
├── server.js
└── README.md
```

### Paso 3: Instalar Dependencias

```bash
# Instalar dependencias de producción y desarrollo
npm install
```

### Paso 4: Configurar Base de Datos

#### Opción A: PostgreSQL Local

```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crear usuario y base de datos
sudo -u postgres psql
CREATE DATABASE hotel_mar_azul;
CREATE USER hotel_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE hotel_mar_azul TO hotel_user;
\q
```

#### Opción B: PostgreSQL en Render (Recomendado)

1. Crear cuenta en [Render.com](https://render.com)
2. Crear nueva base de datos PostgreSQL
3. Copiar los datos de conexión

## ⚙️ Configuración

### Paso 1: Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar variables de entorno
nano .env
```

Configurar las siguientes variables en `.env`:

```bash
# Configuración del servidor
NODE_ENV=development
PORT=3000

# Base de datos PostgreSQL
DB_HOST=tu-postgres-host
DB_PORT=5432
DB_NAME=hotel_mar_azul
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
DB_SSL=true

# JWT
JWT_SECRET=tu-clave-secreta-muy-segura-aqui
JWT_EXPIRES_IN=24h

# Email (Gmail ejemplo)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
EMAIL_FROM=Hotel Mar Azul <noreply@hotelmarazul.com>

# Stripe (opcional)
STRIPE_PUBLIC_KEY=pk_test_tu_clave_publica
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta

# URLs
FRONTEND_URL=http://localhost:3001
API_BASE_URL=http://localhost:3000/api
```

### Paso 2: Inicializar Base de Datos

```bash
# Ejecutar migración inicial
psql -h tu-host -U tu-usuario -d hotel_mar_azul -f migrations/init.sql

# O si usas un cliente GUI como pgAdmin, ejecuta el contenido de migrations/init.sql
```

## 🎯 Uso

### Desarrollo

```bash
# Iniciar servidor en modo desarrollo
npm run dev

# Iniciar con watch mode (reinicia automáticamente)
npm run dev:watch

# Ver logs en tiempo real
tail -f logs/combined.log
```

### Producción

```bash
# Iniciar servidor en producción
npm start
```

### Verificación

```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/health

# Verificar API
curl http://localhost:3000/api
```

### Primera Configuración

1. **Acceder al sistema con cuenta de administrador:**
   - Email: `admin@hotelmarazul.com`
   - Contraseña: `Admin123!`

2. **Crear usuarios adicionales del staff**
3. **Configurar habitaciones del hotel**
4. **Probar funcionalidades básicas**

## 📡 API Endpoints

### Autenticación
```bash
POST   /api/auth/login              # Login de usuario
POST   /api/auth/register           # Registro de usuario
POST   /api/auth/logout             # Logout
GET    /api/auth/profile            # Obtener perfil
PUT    /api/auth/profile            # Actualizar perfil
POST   /api/auth/change-password    # Cambiar contraseña
POST   /api/auth/forgot-password    # Solicitar reset
POST   /api/auth/reset-password/:token # Reset con token
```

### Habitaciones
```bash
GET    /api/rooms                   # Listar habitaciones
POST   /api/rooms                   # Crear habitación
GET    /api/rooms/:id               # Obtener habitación
PUT    /api/rooms/:id               # Actualizar habitación
GET    /api/rooms/search            # Buscar disponibles
PATCH  /api/rooms/:id/status        # Cambiar estado
```

### Reservas
```bash
GET    /api/reservations            # Listar reservas
POST   /api/reservations            # Crear reserva
GET    /api/reservations/:id        # Obtener reserva
PUT    /api/reservations/:id        # Actualizar reserva
POST   /api/reservations/:id/confirm # Confirmar reserva
POST   /api/reservations/:id/checkin # Check-in
POST   /api/reservations/:id/checkout # Check-out
POST   /api/reservations/:id/cancel # Cancelar
```

### Huéspedes
```bash
GET    /api/guests                  # Listar huéspedes
POST   /api/guests                  # Crear huésped
GET    /api/guests/:id              # Obtener huésped
PUT    /api/guests/:id              # Actualizar huésped
GET    /api/guests/:id/history      # Historial del huésped
POST   /api/guests/:id/promote-vip  # Promover a VIP
```

### Reportes
```bash
GET    /api/reports/dashboard       # Dashboard principal
GET    /api/reports/occupancy       # Reporte de ocupación
GET    /api/reports/sales           # Reporte de ventas
GET    /api/reports/guests          # Reporte de huéspedes
GET    /api/reports/financial       # Reporte financiero
GET    /api/reports/incidents       # Reporte de incidencias
```

### Incidencias
```bash
GET    /api/incidents               # Listar incidencias
POST   /api/incidents               # Crear incidencia
GET    /api/incidents/:id           # Obtener incidencia
PUT    /api/incidents/:id           # Actualizar incidencia
POST   /api/incidents/:id/assign    # Asignar incidencia
POST   /api/incidents/:id/resolve   # Resolver incidencia
```

## 🗃 Base de Datos

### Esquema Principal

- **users** - Usuarios del sistema
- **rooms** - Habitaciones del hotel
- **guests** - Huéspedes registrados
- **reservations** - Reservas de habitaciones
- **invoices** - Facturas generadas
- **additional_services** - Servicios adicionales
- **incidents** - Incidencias y mantenimiento

### Relaciones Clave

```
users (1:N) reservations
guests (1:N) reservations
rooms (1:N) reservations
reservations (1:1) invoices
guests (1:N) additional_services
rooms (1:N) incidents
```

### Comandos Útiles

```bash
# Backup de base de datos
pg_dump -h host -U user -d hotel_mar_azul > backup.sql

# Restaurar backup
psql -h host -U user -d hotel_mar_azul < backup.sql

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Formateo de código
npm run format
```

## 🚀 Despliegue

### Render (Recomendado)

1. **Crear cuenta en Render.com**
2. **Conectar repositorio de Git**
3. **Configurar variables de entorno en Render**
4. **Desplegar automáticamente**

### Variables de Entorno en Render

```bash
NODE_ENV=production
PORT=10000
DB_HOST=tu-render-postgres-host
DB_NAME=hotel_mar_azul
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
DB_SSL=true
JWT_SECRET=tu-clave-secreta-production
# ... resto de variables
```

### Heroku

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login y crear app
heroku login
heroku create hotel-mar-azul-api

# Configurar variables de entorno
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=tu-host
# ... resto de variables

# Desplegar
git push heroku main
```

### VPS/Servidor Dedicado

```bash
# Instalar PM2 para gestión de procesos
npm install -g pm2

# Crear archivo ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hotel-mar-azul-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};

# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📊 Monitoreo y Logs

### Estructura de Logs

```
logs/
├── combined.log      # Todos los logs
├── error.log         # Solo errores
└── access.log        # Logs de acceso HTTP
```

### Comandos de Monitoreo

```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# Buscar errores
grep "ERROR" logs/combined.log

# Limpiar logs antiguos
npm run logs:clear

# Verificar estado del servidor
curl http://localhost:3000/health
```

## 🔧 Resolución de Problemas

### Problemas Comunes

**Error de conexión a base de datos:**
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar variables de entorno
echo $DB_HOST
echo $DB_USER
```

**Puerto en uso:**
```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Matar proceso
kill -9 PID
```

**Problemas de permisos:**
```bash
# Verificar permisos de archivos
ls -la

# Corregir permisos si es necesario
chmod 755 server.js
```

### Logs de Debug

```bash
# Activar logs detallados
export LOG_LEVEL=debug
npm run dev

# Ver logs de Sequelize
export DB_LOGGING=true
npm run dev
```

## 📚 Documentación Adicional

### Estructura del Proyecto

- `src/config/` - Configuraciones de base de datos y entorno
- `src/controllers/` - Lógica de negocio de los endpoints
- `src/models/` - Modelos de Sequelize para la base de datos
- `src/routes/` - Definición de rutas y validaciones
- `src/middleware/` - Middleware personalizado (auth, validación, errores)
- `src/services/` - Servicios externos (email, pagos, reportes)
- `src/utils/` - Utilidades y constantes del sistema

### Patrones de Diseño Utilizados

- **MVC** - Separación de responsabilidades
- **Repository Pattern** - Abstracción de acceso a datos
- **Middleware Pattern** - Procesamiento de requests
- **Factory Pattern** - Creación de objetos complejos
- **Observer Pattern** - Sistema de eventos y notificaciones

## 🤝 Contribución

### Proceso de Desarrollo

1. **Fork del repositorio**
2. **Crear rama feature:** `git checkout -b feature/nueva-funcionalidad`
3. **Commit cambios:** `git commit -m 'Agregar nueva funcionalidad'`
4. **Push a la rama:** `git push origin feature/nueva-funcionalidad`
5. **Crear Pull Request**

### Estándares de Código

- Usar ESLint y Prettier
- Comentarios en español
- Tests para nuevas funcionalidades
- Documentación actualizada

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Desarrollador

**Alexander Echeverria**
- Email: alexander.echeverria@example.com
- GitHub: @alexander-echeverria

---

## 🆘 Soporte

Para soporte técnico o preguntas:

1. **Revisar esta documentación**
2. **Buscar en los issues del repositorio**
3. **Crear un nuevo issue con detalles del problema**
4. **Contactar al desarrollador**

---

> **¡Gracias por usar el Sistema de Gestión Hotelera "Mar Azul"!** 🏨✨