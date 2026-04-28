# SaruiStudio

Sistema de gestión integral para **Sarui Pilates Studio** — Oaxaca, México.

Monorepo fullstack que centraliza la administración de clientes, paquetes, membresías, clases, reservaciones y asistencia, más un kiosk de auto check-in por QR/PIN.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS |
| Backend | Express 5 + TypeScript |
| ORM | Prisma (MySQL 8) |
| Logs | MongoDB |
| Autenticación | JWT (access + refresh token) |
| Calendario | FullCalendar |
| Monorepo | npm Workspaces |
| Tipos compartidos | `@sarui/shared` |

---

## Requisitos previos

- **Node.js** 18 o superior
- **npm** 9 o superior
- **MySQL** 8+
- **MongoDB** (para logs de asistencia)
- Git

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url> sarui-studio
cd sarui-studio

# 2. Instalar todas las dependencias del monorepo
npm install

# 3. Copiar variables de entorno
cp .env.example .env
# Editar .env con los valores reales de tu entorno

# 4. Crear la base de datos en MySQL
mysql -u root -p -e "CREATE DATABASE sarui_studio;"

# 5. Ejecutar migraciones Prisma
npm run migrate

# 6. Poblar la base de datos con datos iniciales
npm run seed
```

---

## Desarrollo

```bash
# Levantar frontend y API simultáneamente
npm run dev

# Solo el frontend (Next.js — puerto 3000)
npm run dev:web

# Solo el backend (Express — puerto 4000)
npm run dev:api
```

---

## Migraciones y seed

```bash
# Aplicar migraciones de Prisma
npm run migrate

# Cargar catálogo de paquetes y usuario administrador inicial
npm run seed
```

---

## Estructura del proyecto

```
sarui-studio/
├── apps/
│   ├── web/                   # Next.js — interfaz de administración y kiosk
│   │   └── src/
│   │       ├── app/           # App Router (rutas y páginas)
│   │       ├── components/    # Componentes reutilizables
│   │       ├── hooks/         # Custom hooks
│   │       ├── lib/           # Utilidades y cliente API
│   │       ├── store/         # Estado global (Zustand)
│   │       └── types/         # Tipos locales del frontend
│   └── api/                   # Express — API REST
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
│           ├── config/        # Configuración de DB y entorno
│           ├── modules/       # Módulos de negocio (auth, clients, …)
│           ├── middlewares/   # Auth, errores, validación
│           └── routes/        # Definición de rutas
└── packages/
    └── shared/                # @sarui/shared — tipos TypeScript compartidos
        └── src/
            ├── types/
            └── index.ts
```

---

## Módulos disponibles

| Módulo | Descripción |
|--------|-------------|
| **Auth** | Login, refresh token, logout |
| **Clientes** | Alta, edición, búsqueda, generación de QR y PIN |
| **Paquetes** | Catálogo de paquetes Reformer / Mat / Mix |
| **Membresías** | Compra, seguimiento de sesiones, estado |
| **Clases** | Creación de horarios, capacidad, tipos |
| **Reservaciones** | Reservar, cancelar (política 5 h), walk-in |
| **Asistencia / Kiosk** | Check-in por QR, PIN o manual |
| **Pagos** | Registro de pagos por membresía o sesión suelta |

---

## Kiosk de auto check-in

Accesible en la URL:

```
http://localhost:3000/kiosk
```

Permite a los clientes registrar su asistencia de forma autónoma usando:
- Código QR (impreso en su tarjeta de cliente)
- PIN de 4 dígitos
- Check-in manual por el staff

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión MySQL (Prisma) |
| `MONGODB_URI` | Cadena de conexión MongoDB para logs |
| `PORT` | Puerto en que escucha la API Express (default: 4000) |
| `NODE_ENV` | Entorno de ejecución: `development` / `production` |
| `FRONTEND_URL` | URL del frontend, para CORS |
| `JWT_SECRET` | Secreto para firmar JWTs (mín. 32 caracteres) |
| `JWT_EXPIRES_IN` | Duración del access token (ej. `8h`) |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token (ej. `7d`) |
| `NEXT_PUBLIC_API_URL` | URL base de la API, expuesta al navegador |

---

## Paleta de colores oficiales Sarui

| Nombre | Hex | Uso |
|--------|-----|-----|
| Arena claro | `#F5F0E8` | Fondo principal |
| Arena medio | `#E8DDD0` | Fondos secundarios / cards |
| Terracota | `#C4714A` | Acento primario / CTA |
| Terracota oscuro | `#A05A35` | Hover / estados activos |
| Verde salvia | `#7A8C6E` | Acento secundario |
| Verde oscuro | `#5C6B52` | Texto sobre fondo claro |
| Café oscuro | `#3D2B1F` | Texto principal |
| Blanco hueso | `#FDFAF5` | Superficies elevadas |

---

## Licencia

Privado — uso exclusivo de Sarui Pilates Studio.
# sarui-pilates-studio
