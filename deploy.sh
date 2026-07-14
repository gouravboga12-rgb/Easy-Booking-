#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$PATH:/usr/local/bin:/usr/bin"

# 1. Pull latest code from GitHub
cd /home/ubuntu/Easy-Booking-
echo "=== Git Pull ==="
git pull origin main

# 2. Update and build Frontend
echo "=== Frontend: npm install ==="
npm install
echo "=== Frontend: npm run build ==="
npm run build

# 3. Update and restart Backend
cd /home/ubuntu/Easy-Booking-/backend
echo "=== Backend: npm install ==="
npm install
echo "=== Backend: pm2 restart ==="
pm2 restart all
echo "=== pm2 status ==="
pm2 list
