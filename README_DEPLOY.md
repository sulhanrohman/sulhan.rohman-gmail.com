# Notary Dashboard Deployment Guide

This project is a bilingual (EN/ID) Banking Notary Dashboard.

## Deployment Instructions (Ubuntu 22.04)

1. **Setup Path**: Your application should live in `/var/www/html/notaris`.
2. **Run Deployment**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Simplified Deployment Flow (Recommended)

The deployment now compiles the entire application (Frontend + Backend) into the `dist/` folder. This makes it much more stable and removes common TypeScript/ESM errors in production.

### 1. Run Deployment
```bash
./deploy.sh
```

### 2. Verify Port 3000
```bash
sudo netstat -tulpn | grep 3000
```

### 3. Update Nginx Config
Since the Node server now handles **both** static files and the API, your Nginx configuration at `/etc/nginx/sites-enabled/notary` can be much simpler.

**Recommended SSL Block**:
```nginx
server {
    server_name clients.ardigi.id;
    
    access_log /var/log/nginx/notaris.access.log;
    error_log  /var/log/nginx/notaris.error.log;

    # Proxy everything to the Node.js server
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ... Your Certbot SSL lines below ...
    listen 443 ssl;
    ssl_certificate ...
}
```

## Why is this easier?
- **No `tsx` in production**: We use standard `node dist/server.js`.
- **Single Entry Point**: Express handles everything; Nginx is just a simple "doorway".
- **Bundled Server**: `esbuild` bundles the server-side code, fixing most "Module not found" issues automatically.

## Troubleshooting
- **Logs**: `pm2 logs notary`
- **Restart**: `pm2 restart notary`
- **Manual Test**: `NODE_ENV=production node dist/server.js`

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Animation**: Motion (motion/react)
- **i18n**: i18next
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Server (Deployment)**: Nginx (Static Serving)
- **Database**: PostgreSQL (Provisioned in script)
