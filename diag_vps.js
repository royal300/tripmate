const { Client } = require('ssh2');
const conn = new Client();

const commands = `
cat << 'NGINXEOF' > /etc/nginx/sites-available/tripmate
server {
    listen 80;
    server_name tripmate.royal300.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name tripmate.royal300.com;

    ssl_certificate /etc/letsencrypt/live/tripmate.royal300.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tripmate.royal300.com/privkey.pem;

    # ── Admin Panel SPA ─────────────────────────────────────────────
    # Named fallback location: serves index.html for all admin sub-routes
    location @admin_spa {
        root /var/www/tripmate/admin/dist;
        try_files /index.html =500;
    }

    location ^~ /admin {
        alias /var/www/tripmate/admin/dist;
        index index.html;
        # Try file → directory → fallback to SPA index (not 404 loop)
        try_files $uri $uri/ =404;
        error_page 404 = @admin_spa;
        log_not_found off;
    }

    # ── Backend API ──────────────────────────────────────────────────
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # ── Chat UI SPA ──────────────────────────────────────────────────
    root /var/www/tripmate/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

echo "Config written ✓"
nginx -t && systemctl reload nginx && echo "Nginx reloaded ✓"
`;

conn.on('ready', () => {
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({ host: '93.127.206.52', port: 22, username: 'root', password: 'Royal300@2026' });
