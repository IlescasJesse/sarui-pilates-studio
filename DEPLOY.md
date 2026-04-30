# Guía de Despliegue — Sarui Studio (VPS)

## 1. DNS — Configurar en tu registrador de dominio

Crea los siguientes registros DNS apuntando a la IP pública de tu VPS:

| Tipo  | Nombre | Valor           | TTL  |
|-------|--------|-----------------|------|
| A     | @      | IP_DE_TU_VPS    | 3600 |
| A     | www    | IP_DE_TU_VPS    | 3600 |
| A     | api    | IP_DE_TU_VPS    | 3600 |

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
git clone https://github.com/TU_USUARIO/sarui-studio.git /var/www/sarui-studio
cd /var/www/sarui-studio

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
# Copiar configuración
sudo cp /var/www/sarui-studio/nginx/sarui.conf /etc/nginx/sites-available/sarui
sudo ln -s /etc/nginx/sites-available/sarui /etc/nginx/sites-enabled/

# Reemplazar TU_DOMINIO.COM en el archivo
sudo nano /etc/nginx/sites-available/sarui

# Verificar y recargar
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. SSL con Certbot (Let's Encrypt gratis)

```bash
# Emite certificado para dominio + subdominio api
sudo certbot --nginx -d TU_DOMINIO.COM -d www.TU_DOMINIO.COM -d api.TU_DOMINIO.COM
```

> Certbot edita automáticamente el nginx.conf con las rutas del certificado.

---

## 7. Levantar con PM2

```bash
cd /var/www/sarui-studio

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

- [ ] DNS propagado (A records para @, www, api)
- [ ] `apps/api/.env` con JWT_SECRET y MP_ACCESS_TOKEN LIVE
- [ ] `apps/web/.env.local` con NEXT_PUBLIC_API_URL apuntando a api.TU_DOMINIO.COM
- [ ] SSL activo (https verde en el browser)
- [ ] `pm2 list` muestra `online` para sarui-api y sarui-web
- [ ] Webhook MercadoPago actualizado a `https://api.TU_DOMINIO.COM/api/v1/portal/webhook/mercadopago`
- [ ] MP_WEBHOOK_SECRET con valor real obtenido del panel de MP (ver sección 9)

---

## 9. MercadoPago — Configurar webhook

### 9.1 Registrar la URL en el panel de MP

1. Panel MP → **Tu negocio → Configuración → Notificaciones → Webhooks**
2. Crear notificación:
   - **URL**: `https://api.TU_DOMINIO.COM/api/v1/portal/webhook/mercadopago`
   - **Eventos**: `payment`
3. Al guardar, MP muestra una **"Clave secreta"** — cópiala.

### 9.2 Pegar el secret en el servidor

```bash
nano /var/www/sarui-studio/apps/api/.env
# Buscar MP_WEBHOOK_SECRET y reemplazar con la clave del paso anterior:
MP_WEBHOOK_SECRET=<clave_secreta_del_panel_mp>
```

> ⚠️ Usa la clave que genera MP, no una inventada. MP firma las notificaciones con esa clave y el API la verifica con HMAC-SHA256.

### 9.3 Reiniciar y verificar

```bash
pm2 restart sarui-api
```

En el panel de MP → **Simular notificación**:
- Respuesta `200` → firma válida, todo OK.
- Respuesta `401` → secret mal copiado, revisar.
