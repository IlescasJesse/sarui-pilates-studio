# Guía de Despliegue — Sarui Studio (VPS)

## ⚠️ Coexistencia con Maria Vita

Este VPS **comparte infraestructura** con Maria Vita:
- **maria-vita.mx** → Puertos 3000 (web) + 5000 (api)
- **sarui.com.mx** → Puertos 3001 (web) + 5001 (api)

Nginx actúa como reverse proxy, dirigiendo cada dominio a sus respectivos puertos internos.

---

## 1. DNS — Configurar en tu registrador de dominio

Crea los siguientes registros DNS apuntando a la IP pública de tu VPS:

| Tipo  | Nombre | Valor           | TTL  |
|-------|--------|-----------------|------|
| A     | @      | IP_DE_TU_VPS    | 3600 |
| A     | www    | IP_DE_TU_VPS    | 3600 |
| A     | api    | IP_DE_TU_VPS    | 3600 |

> **Para sarui.com.mx**, estos registros apuntan a: `sarui.com.mx`, `www.sarui.com.mx`, `api.sarui.com.mx`
> Los cambios DNS pueden tardar entre 15 min y 24 h en propagarse.
> Verifica propagación en: https://dnschecker.org

---

## 2. VPS — Preparar servidor (Ubuntu 22.04)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2, Nginx, Certbot
sudo npm install -g pm2
sudo apt install -y nginx certbot python3-certbot-nginx

# Crear directorio de logs
sudo mkdir -p /var/log/sarui
sudo chown $USER:$USER /var/log/sarui
```

---

## 3. Subir el código al VPS

```bash
# Opción A — Git clone directo en el VPS
git clone https://github.com/TU_USUARIO/sarui-studio.git /var/www/sarui-pilates-studio
cd /var/www/sarui-pilates-studio

# Instalar dependencias
npm install

# Copiar y rellenar variables de entorno
cp apps/api/.env.production apps/api/.env
cp apps/web/.env.production apps/web/.env.local
# ↑ Editar ambos archivos con valores reales antes de continuar
nano apps/api/.env
nano apps/web/.env.local
```

---

## 4. Build y migraciones

```bash
# Build API
cd apps/api
npm run build

# Migraciones de base de datos
npx prisma migrate deploy

# Build web
cd ../web
npm run build
```

---

## 5. Nginx

```bash
# Copiar configuración de Sarui
sudo cp /var/www/sarui-pilates-studio/nginx/sarui.conf /etc/nginx/sites-available/sarui
sudo ln -s /etc/nginx/sites-available/sarui /etc/nginx/sites-enabled/

# IMPORTANTE: Maria Vita debe tener su propio archivo de configuración
# Si NO EXISTE /etc/nginx/sites-available/maria-vita, crédito o contacta al admin

# Verificar configuración
sudo nginx -t

# Si hay errores, revisar:
#  - Que sarui.conf tenga "sarui.com.mx" (si no está, es de otra app)
#  - Que maria-vita.conf tenga "maria-vita.mx" (existente, no modificar)

sudo systemctl reload nginx
```

**Configuración esperada:**
- `sarui.conf` → sarui.com.mx (puerto 3001 web, 5001 api)
- `maria-vita.conf` → maria-vita.mx (puerto 3000 web, 5000 api)

---

## 6. SSL con Certbot (Let's Encrypt gratis)

```bash
# Emite certificado SOLO para sarui.com.mx
# (Maria Vita ya debe tener su propio certificado)
sudo certbot --nginx -d sarui.com.mx -d www.sarui.com.mx -d api.sarui.com.mx
```

> Certbot edita automáticamente el nginx.conf con las rutas del certificado.
> Si es la primera vez en el VPS, es posible que Certbot pregunte por email. Úsalo también para Maria Vita si es necesario.

---

## 7. Levantar con PM2

```bash
cd /var/www/sarui-pilates-studio

# Arrancar ambos procesos
pm2 start ecosystem.config.js --env production

# Guardar para que reinicien tras reboot
pm2 save
pm2 startup   # ejecuta el comando que te diga en pantalla
```

### Comandos útiles PM2
```bash
pm2 list                   # estado de procesos
pm2 logs sarui-api         # logs en tiempo real
pm2 restart sarui-web      # reiniciar web
pm2 reload all             # hot-reload sin downtime
```

---

## 8. Checklist final antes de ir live

- [ ] DNS propagado (A records para @, www, api en sarui.com.mx)
- [ ] `apps/api/.env` con JWT_SECRET y MP_ACCESS_TOKEN LIVE
- [ ] `apps/web/.env.local` con NEXT_PUBLIC_API_URL = `https://api.sarui.com.mx`
- [ ] SSL activo (https verde en el browser para sarui.com.mx)
- [ ] `pm2 list` muestra `online` para sarui-api (puerto 5001) y sarui-web (puerto 3001)
- [ ] Maria Vita sigue corriendo sin problemas (puerto 3000 web, 5000 api)
- [ ] RESEND_API_KEY y RESEND_FROM_EMAIL configurados en `apps/api/.env` (ver sección 9)
- [ ] Webhook MercadoPago actualizado a `https://api.sarui.com.mx/api/v1/portal/webhook/mercadopago`
- [ ] MP_WEBHOOK_SECRET con valor real obtenido del panel de MP (ver sección 10)

---

## 9. Email — Resend (correos automáticos)

El sistema envía correos transaccionales (enlace de bienvenida, restablecer contraseña) mediante **Resend**.

### 9.1 Obtener API key

1. Regístrate en https://resend.com
2. Ve a **API Keys** → **Create API Key**
3. Verifica tu dominio en **Domains** (agrega `sarui.com.mx` y sigue las instrucciones DNS)
4. Copia la API key (ej: `re_...`)

### 9.2 Configurar en el servidor

```bash
nano /var/www/sarui-pilates-studio/apps/api/.env
```

Asegúrate de que estas variables existan:
```env
RESEND_API_KEY=re_<tu_api_key>
RESEND_FROM_EMAIL=noreply@sarui.com.mx
```

> `RESEND_FROM_EMAIL` debe usar un dominio verificado en Resend, de lo contrario los correos serán rechazados.

### 9.3 Verificar envío

```bash
pm2 restart sarui-api
pm2 logs sarui-api | grep EMAIL
```

Solicita un restablecimiento de contraseña desde `/tienda/login` — deberías ver:
```
[EMAIL] Reset email sent to cliente@example.com (id: ...)
```

---

## 10. MercadoPago — Configurar webhook

### 10.1 Registrar la URL en el panel de MP

1. Panel MP → **Tu negocio → Configuración → Notificaciones → Webhooks**
2. Crear notificación:
   - **URL**: `https://api.sarui.com.mx/api/v1/portal/webhook/mercadopago`
   - **Eventos**: `payment`
3. Al guardar, MP muestra una **"Clave secreta"** — cópiala.

### 10.2 Pegar el secret en el servidor

```bash
nano /var/www/sarui-pilates-studio/apps/api/.env
# Buscar MP_WEBHOOK_SECRET y reemplazar con la clave del paso anterior:
MP_WEBHOOK_SECRET=<clave_secreta_del_panel_mp>
```

> ⚠️ Usa la clave que genera MP, no una inventada. MP firma las notificaciones con esa clave y el API la verifica con HMAC-SHA256.

### 10.3 Reiniciar y verificar

```bash
pm2 restart sarui-api
```

En el panel de MP → **Simular notificación**:
- Respuesta `200` → firma válida, todo OK.
- Respuesta `401` → secret mal copiado, revisar.
