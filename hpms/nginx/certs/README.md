# HTTPS Setup for Nginx

The Gate Scanner app uses `html5-qrcode` which requires `getUserMedia` API. Modern browsers block `getUserMedia` (camera access) on non-HTTPS connections, except for `localhost`. 

If you are running this on a college LAN (e.g. `192.168.1.50`), you MUST serve it over HTTPS.

## Generating a Self-Signed Certificate

Run this command inside the `nginx/certs` folder:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem
```

Then uncomment the SSL lines in `nginx/nginx.conf` to serve over 443.
