// PM2 — gestión de procesos en VPS
// Instalar: npm install -g pm2
// Arrancar:  pm2 start ecosystem.config.js --env production
// Guardar:   pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: 'sarui-api',
      cwd: './apps/api',
      script: 'dist/server.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: '/var/log/sarui/api-error.log',
      out_file: '/var/log/sarui/api-out.log',
    },
    {
      name: 'sarui-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      error_file: '/var/log/sarui/web-error.log',
      out_file: '/var/log/sarui/web-out.log',
    },
  ],
};
