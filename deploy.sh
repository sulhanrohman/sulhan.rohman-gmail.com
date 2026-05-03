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
PROJECT_ROOT="/var/www/html/notaris"
echo "📦 Setting up application in $PROJECT_ROOT..."
sudo mkdir -p "$PROJECT_ROOT"

# CRITICAL: Copy the source files to the deployment directory
echo "📂 Copying files to $PROJECT_ROOT..."
sudo cp -r . "$PROJECT_ROOT/"
sudo chown -R $USER:$USER "$PROJECT_ROOT"

cd "$PROJECT_ROOT"

echo "Installing local dependencies..."
npm install

echo "🏗️ Building Frontend and Server..."
npm run build

# 7. Start/Restart Application with PM2
echo "🚀 Starting Node.js server with PM2..."
pm2 delete notary || true

# Now we run the COMPILED dist/server.js
# This eliminates the need for tsx/ts-node in production
NODE_ENV=production pm2 start dist/server.js --name notary --log-date-format "YYYY-MM-DD HH:mm:ss"

pm2 save

# Wait for startup
echo "⏳ Waiting for server to initialize..."
sleep 5

# 8. Check if port 3000 is alive
echo "🔍 Checking port 3000..."
if sudo netstat -tulpn | grep :3000 > /dev/null; then
    echo "✅ SUCCESS: Port 3000 is LISTENING!"
else
    echo "❌ ERROR: Port 3000 is STILL NOT LISTENING."
    echo "📜 RECENT LOGS:"
    pm2 logs notary --lines 30 --no-daemon & 
    LOG_PID=$!
    sleep 3
    kill $LOG_PID 2>/dev/null || true
fi

# 9. Simplified Nginx Configuration Recommendation
echo "--------------------------------------------------------"
echo "🌐 RECOMMENDED NGINX CONFIG FOR clients.ardigi.id"
echo "--------------------------------------------------------"
echo "Your Express server now handles BOTH static files and API."
echo "You only need one proxy block in your Nginx SSL config:"
echo ""
echo "    location / {"
echo "        proxy_pass http://localhost:3000;"
echo "        proxy_http_version 1.1;"
echo "        proxy_set_header Upgrade \$http_upgrade;"
echo "        proxy_set_header Connection 'upgrade';"
echo "        proxy_set_header Host \$host;"
echo "        proxy_cache_bypass \$http_upgrade;"
echo "    }"
echo "--------------------------------------------------------"
echo "✅ Deployment finished!"
