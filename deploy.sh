#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment stay for Ubuntu 22.04..."

# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies
sudo apt install -y curl git nginx postgresql postgresql-contrib

# 3. Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Configure PostgreSQL
echo "🐘 Configuring PostgreSQL..."
DB_NAME="notary_db"
DB_USER="notary_user"
DB_PASS="secure_password_change_me"

sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# 5. Application Setup
echo "📦 Setting up application in /var/www/html/notaris..."
sudo mkdir -p /var/www/html/notaris
# In your actual server, you would move files here or clone
# sudo cp -r . /var/www/html/notaris
# cd /var/www/html/notaris

npm install
npm run build

# 6. Install PM2 for process management
sudo npm install -g pm2

# 7. Start/Restart Application with PM2
echo "🚀 Starting Node.js server with PM2..."
pm2 delete notary || true
# We use tsx to run the TypeScript server directly in production for ease of use
pm2 start server.ts --name notary --interpreter $(which tsx)

# 8. Configure Nginx as Reverse Proxy with SPA Fallback
echo "🌐 Configuring Nginx for clients.ardigi.id..."
cat <<EOF | sudo tee /etc/nginx/sites-available/notary
server {
    listen 80;
    server_name clients.ardigi.id;

    root /var/www/html/notaris/dist;
    index index.html;

    # Try to serve static files first (Frontend)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to the Node.js server (Backend)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/notary /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "✅ Deployment complete! App is running."
echo "🔗 Database Info:"
echo "   Name: $DB_NAME"
echo "   User: $DB_USER"
echo "   Pass: $DB_PASS"
