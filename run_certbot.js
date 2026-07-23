const { Client } = require('ssh2');

const conn = new Client();

const commands = `
  set -e
  echo "--- Running Certbot ---"
  
  # Install certbot if it doesn't exist (assuming Ubuntu/Debian)
  if ! command -v certbot &> /dev/null; then
    echo "Certbot not found, installing..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
  fi

  # Run Certbot to fetch and install the certificate
  echo "Requesting SSL certificate for tripmate.royal300.com..."
  certbot --nginx -d tripmate.royal300.com --non-interactive --agree-tos --register-unsafely-without-email

  echo "--- SSL Certificate Installed Successfully ---"
`;

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '93.127.206.52',
  port: 22,
  username: 'root',
  password: 'Royal300@2026'
});
