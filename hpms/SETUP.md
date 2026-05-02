# HPMS Setup Guide

## 1. Prerequisites

The following software must be installed before starting the application. Do not install Node.js or PostgreSQL on your host machine, as they run securely inside Docker containers.

- **Docker Desktop** (or Docker Engine + Compose plugin)
  - Minimum version: Docker 24.x, Compose v2
  - Download URL: https://docs.docker.com/get-docker/
- **Git**
  - Download URL: https://git-scm.com
- **A terminal**
  - Windows: PowerShell or Windows Terminal
  - Mac/Linux: Standard Terminal
- **openssl** (Required for SSL certificate generation)
  - Mac/Linux: Usually pre-installed.
  - Windows: Available via Git Bash or Windows Subsystem for Linux (WSL).

---

## 2. Clone & Initial Setup

First, clone the repository to your local machine and navigate into the project directory:

```bash
git clone https://github.com/your-org/hpms.git
cd hpms
```

Then, duplicate the example environment variables file to create your active `.env` configuration:

```bash
cp .env.example .env
```

---

## 3. Environment Variables — Complete Reference

This is the most critical configuration step. Go through every variable in the `.env` file and set it according to the instructions below.

### Database

#### DATABASE_URL
- **Required:** Yes — app cannot start without it
- **Description:** PostgreSQL connection string. Points to the `db` Docker service by hostname.
- **How to get it:** Set POSTGRES_PASSWORD below first, then construct: `postgresql://hpms_user:YOUR_PASSWORD@db:5432/hpms_db`
- **Example:** `postgresql://hpms_user:MySecurePass123@db:5432/hpms_db`
- **Warning:** Do not change the hostname `db` — it matches the Docker Compose service name. Only change the password segment.

#### POSTGRES_PASSWORD
- **Required:** Yes
- **Description:** Password for the PostgreSQL hpms_user account. Must match the password segment in DATABASE_URL exactly.
- **How to get it:** Choose any strong password. Generate one using: `openssl rand -base64 24`
- **Example:** `Xk9#mP2$vL8nQr`

### Authentication

#### JWT_SECRET
- **Required:** Yes
- **Description:** Secret key used to sign and verify access tokens. If changed after deployment, all active sessions are invalidated.
- **How to get it:** Run `openssl rand -base64 64`
- **Example:** `(never use a real value here — generate your own securely)`
- **Warning:** Must be at least 32 characters. Never reuse across environments.

#### JWT_EXPIRES_IN
- **Required:** No
- **Default:** 8h
- **Description:** How long an access token is valid. After expiry, the frontend automatically attempts a refresh.
- **Accepted formats:** `8h`, `1d`, `30m`
- **Recommendation:** `8h` for a college environment (one working day).

#### JWT_REFRESH_SECRET
- **Required:** Yes
- **Description:** Separate secret for refresh tokens. Must be different from JWT_SECRET.
- **How to get it:** Run `openssl rand -base64 64`

#### JWT_REFRESH_EXPIRES_IN
- **Required:** No
- **Default:** 7d
- **Description:** How long a refresh token is valid. After this, the user must log in again.

#### COOKIE_SECRET
- **Required:** Yes
- **Description:** Used to sign cookies. Prevents cookie tampering.
- **How to get it:** Run `openssl rand -base64 32`

### Application

#### NODE_ENV
- **Required:** Yes
- **Values:** `development` | `production`
- **Description:** Controls security settings, error verbosity, and cookie security flags. In production, cookies are set with secure:true (HTTPS only). In development, HTTP is allowed.
- **Warning:** Never run with `NODE_ENV=development` in production. It exposes stack traces in error responses.

#### PORT
- **Required:** No
- **Default:** 3000
- **Description:** Port the Express server listens on inside Docker. Do not change unless you also update `docker-compose.yml`.

#### CORS_ORIGIN
- **Required:** Yes
- **Description:** The URL of the frontend. Express allows cookies only from this origin.
- **Development:** `http://localhost:5173`
- **Production:** `https://your-college-server-ip-or-domain`
- **Warning:** Must be an exact match including protocol. Trailing slash will break CORS.

### Email (SMTP)

#### SMTP_HOST
- **Required:** Yes (if email notifications are enabled)
- **Description:** Hostname of the SMTP server.
- **Gmail:** `smtp.gmail.com`
- **College mail server:** ask your IT cell for the SMTP hostname.

#### SMTP_PORT
- **Required:** Yes
- **Description:** SMTP port.
- **Gmail TLS:** `587`
- **College server:** typically `587` or `465`.

#### SMTP_USER
- **Required:** Yes
- **Description:** The email address used as the sender.
- **Example:** `hpms-noreply@yourcollege.edu`

#### SMTP_PASS
- **Required:** Yes
- **Description:** Password for the SMTP account.
- **Gmail users:** Do NOT use your Google account password. You must use an App Password.
- **How to generate a Gmail App Password:**
  1. Go to myaccount.google.com
  2. Security → 2-Step Verification (must be enabled)
  3. Search "App passwords" in the search bar
  4. Create a new app password for "Mail"
  5. Copy the 16-character code — this is your SMTP_PASS
  6. No spaces when pasting it into `.env`

#### SMTP_FROM_NAME
- **Required:** No
- **Default:** HPMS Notifications
- **Description:** The display name shown in notification emails.

### SMS

#### SMS_PROVIDER
- **Required:** No (SMS is optional but recommended for parent alerts)
- **Description:** Identifier for the SMS service being used. The backend notifications module checks this value to determine which SMS client to initialize.
- **Supported values:** `textbee` | `twilio` | `none`
- **Default:** `none` (SMS notifications will be skipped silently)

#### SMS_API_KEY
- **Required:** Only if SMS_PROVIDER is not "none"
- **Description:** API key for the configured SMS provider.
- **TextBee:** Found in your TextBee dashboard under API Keys.
- **Twilio:** Your Account SID + Auth Token (see TWILIO_ vars below).

#### SMS_API_URL
- **Required:** Only for TextBee
- **Description:** TextBee API endpoint.
- **Value:** `https://api.textbee.dev/api/v1/gateway/devices/YOUR_DEVICE_ID/send-sms`
- **How to get device ID:** TextBee dashboard → Devices → copy Device ID.

#### TWILIO_ACCOUNT_SID
- **Required:** Only if SMS_PROVIDER=twilio
- **Description:** Twilio Account SID. Found in your Twilio console.

#### TWILIO_AUTH_TOKEN
- **Required:** Only if SMS_PROVIDER=twilio
- **Description:** Twilio Auth Token. Found in your Twilio console.

#### TWILIO_FROM_NUMBER
- **Required:** Only if SMS_PROVIDER=twilio
- **Description:** The purchased Twilio phone number used as the sender.
- **Example format:** `+911234567890`

---

## 4. SSL Certificate Setup (Required for Gate Scanner)

The web-based QR scanner located at `/gate/scan` must be served over HTTPS, as the `getUserMedia` API for camera access is strictly restricted by modern browsers in non-secure contexts.

Generate a self-signed certificate using the following command:

```bash
mkdir -p nginx/certs
# -x509: output an X.509 certificate instead of a cert request
# -nodes: do not encrypt the private key
# -days: validity duration
# -newkey rsa:2048: create a new RSA 2048-bit key
# -keyout/-out: specify output paths for key and cert
# -subj: set subject info directly without interactive prompts
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/key.pem \
  -out nginx/certs/cert.pem \
  -subj "/C=IN/ST=Karnataka/L=YourCity/O=YourCollege/CN=localhost"
```

**Important Notes:**
- **For development:** This self-signed cert will show a browser warning ("Your connection is not private"). Click "Advanced → Proceed" once. This is completely expected on a LAN.
- **For production with a real domain:** Replace the generated `cert.pem` and `key.pem` with a valid Let's Encrypt certificate using [Certbot](https://certbot.eff.org).
- The gate PC browser warning can be permanently accepted by importing the `cert.pem` into the operating system's trusted root certificate store.

---

## 5. Running the Application

### Development

To start the application for development, use the development compose file:

```bash
docker compose -f docker-compose.dev.yml up --build
```

**What this starts:**
- PostgreSQL on `localhost:5432` (accessible directly for DB tools)
- Express backend on `localhost:3000` with hot reload (nodemon)
- React frontend on `localhost:5173` with HMR (Hot Module Replacement)
- No nginx in dev (Vite dev server proxies `/api` requests to the backend)

**First-time database setup:**
With the containers running, open a new terminal window and execute:

```bash
# Run migrations (creates all tables)
docker compose exec backend npx prisma migrate dev

# Seed initial data (admin, warden, security, student accounts)
docker compose exec backend npx prisma db seed
```

The seeded test accounts are:

| Role     | Email                    | Password     |
|----------|--------------------------|--------------|
| Admin    | admin@hpms.college       | Admin@123    |
| Warden   | warden@hpms.college      | Warden@123   |
| Security | security@hpms.college    | Security@123 |
| Student  | student@hpms.college     | Student@123  |

> **WARNING:** Change all these default passwords immediately when deploying to production!

### Production

To run the application securely in production mode:

```bash
docker compose up --build -d
```

**What this does:**
- `-d` runs the containers in detached mode (background).
- Nginx serves the compiled frontend on port `443` (HTTPS) and automatically redirects port `80` traffic to `443`.
- Database migrations run automatically on backend container startup.
- View logs using: `docker compose logs -f backend`

### Stopping

To safely shut down the application:

```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop containers AND delete all data
```

> **CRITICAL WARNING:** Running `docker compose down -v` deletes the PostgreSQL data volume. **All student records, users, and outing requests will be permanently lost.** Only use the `-v` flag if you intend to completely reset the system.

---

## 6. Accessing the Application

| Interface         | URL                              | Who uses it         |
|-------------------|----------------------------------|---------------------|
| Main web app      | https://localhost (prod)         | All roles           |
| API health check  | https://localhost/api/health     | Verification        |
| Gate scanner      | https://localhost/gate/scan      | Security staff      |
| Dev frontend      | http://localhost:5173            | Dev only            |
| Dev API           | http://localhost:3000/api/health | Dev only            |
| Direct DB access  | localhost:5432                   | Dev only (DBeaver)  |

**For the Gate PC Specifically:**
Replace `localhost` with the college server's local IP address (e.g., `https://192.168.1.100/gate/scan`). The browser warning originating from the self-signed certificate can be bypassed once and will not reappear for that specific browser profile.

---

## 7. Chrome Kiosk Mode (Gate PC Auto-Launch)

To automatically launch the QR scanner in full-screen on the gate PC, you can configure Google Chrome in Kiosk mode.

For Windows (gate PC startup):
Create a desktop shortcut for Google Chrome and set the `Target` to:

```text
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --ignore-certificate-errors https://your-college-server-ip/gate/scan
```
*(Replace `your-college-server-ip` with the actual IP or domain of your HPMS server)*
