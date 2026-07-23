#!/bin/bash
# ============================================================
# TripMate AI — Full System Deployment Script
# Usage: bash deploy.sh
# Runs from your local machine — SSHes into VPS automatically
# ============================================================

VPS_IP="93.127.206.52"
VPS_USER="root"

echo "🚀 Deploying TripMate AI to VPS ($VPS_IP)..."

ssh $VPS_USER@$VPS_IP << 'EOF'
  set -e
  echo "--- Starting TripMate Deployment ---"
  
  cd /var/www/tripmate
  git pull origin main
  echo "✓ Code pulled from GitHub"

  # Backend
  cd /var/www/tripmate/backend
  npm install --omit=dev
  echo "✓ Backend deps installed"

  # Frontend
  cd /var/www/tripmate/frontend
  npm install
  npm run build
  echo "✓ Frontend built"

  # Admin panel
  cd /var/www/tripmate/admin
  npm install
  npm run build
  echo "✓ Admin panel built"

  # Restart backend with PM2
  pm2 restart tripmate-backend
  echo "✓ Backend restarted"

  # Reload Nginx
  nginx -t && systemctl reload nginx
  echo "✓ Nginx reloaded"

  echo ""
  echo "=== Deployment Complete ==="
  echo "  Chat UI    → https://tripmate.royal300.com"
  echo "  Admin Panel → https://tripmate.royal300.com/admin/"
  echo ""
  pm2 show tripmate-backend | grep -E "status|restart|uptime"
EOF

echo "Done! ✅"
