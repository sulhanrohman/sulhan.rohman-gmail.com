# Notary Dashboard Deployment Guide

This project is a bilingual (EN/ID) Banking Notary Dashboard.

## Deployment Instructions (Ubuntu 22.04)

1. **Setup Path**: Your application should live in `/var/www/html/notaris`.
2. **Run Deployment**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Why was port 3000 not running?
If you just serve the `dist` folder via Nginx (static mode), port 3000 won't be active because the Node.js server hasn't been started. 

To fix this:
1. Ensure the `pm2 start` command in `deploy.sh` executes successfully.
2. Check logs: `pm2 logs notary`.
3. The new Nginx config I provided handles **both**:
   - It serves your React app from `/dist` (super fast).
   - It proxies any `/api` calls to the Node.js server on port 3000.

## Troubleshooting 404
- Ensure you have run `npm run build` so the `/var/www/html/notaris/dist` directory exists.
- Ensure the Nginx user (`www-data`) has permission to read that directory.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Animation**: Motion (motion/react)
- **i18n**: i18next
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Server (Deployment)**: Nginx (Static Serving)
- **Database**: PostgreSQL (Provisioned in script)
