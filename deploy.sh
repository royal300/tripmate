#!/bin/bash
# deploy.sh
# Script to automate deployment of TripMate AI to the VPS

VPS_IP="93.127.206.52"
VPS_USER="root"

echo "Deploying to VPS ($VPS_IP)..."

# SSH and run git pull + build
ssh $VPS_USER@$VPS_IP << 'EOF'
  set -e
  echo "--- Starting Deployment ---"
  
  cd /var/www/tripmate
  git pull origin main
  
  cd frontend
  # Try to load nvm if available
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
  fi
  
  npm install
  npm run build
  
  echo "--- Deployment Complete ---"
EOF

echo "Done!"
