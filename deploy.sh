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
echo "📦 Setting up application..."
# Note: In a real server, you would git clone here
# git clone https://github.com/sulhanrohman/notary.git
# cd notary

npm install
npm run build

# 6. Install PM2 for process management
sudo npm install -g pm2

# 7. Start/Restart Application
# For a SPA, we serve via Nginx, so we don't necessarily need PM2 for the front-end
# but if you add a backend server.ts later, you'd use:
# pm2 start ecosystem.config.js

# 8. Configure Nginx
echo "🌐 Configuring Nginx..."
cat <<EOF | sudo tee /etc/nginx/sites-available/notary
server {
    listen 80;
    server_name _; # Replace with your domain

    root $(pwd)/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API Proxy (future proofing)
    # location /api {
    #     proxy_pass http://localhost:3000;
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade \$http_upgrade;
    #     proxy_set_header Connection 'upgrade';
    #     proxy_set_header Host \$host;
    #     proxy_cache_bypass \$http_upgrade;
    # }
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
