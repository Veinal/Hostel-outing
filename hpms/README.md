# HPMS — Hostel Permission Management System

![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Yes-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## Overview

The Hostel Permission Management System (HPMS) is a comprehensive digital platform designed to streamline and secure the process of student outings and home-going permissions. It serves college students, hostel wardens, administrative staff, and security personnel by replacing manual paper-based pass systems with an efficient, verifiable digital workflow. By leveraging QR code-based certificates and real-time tracking, HPMS solves the problems of forged gate passes, unauthorized outings, and poor visibility into student whereabouts, ensuring a safer and more accountable campus environment.

## Architecture

### System Architecture Diagram

```text
                               +-----------------------------+
                               |     Clients (Browser)       |
                               | Student/Warden/Admin/Sec.   |
                               +--------------+--------------+
                                              | HTTPS
                               +--------------v--------------+
                               |    Nginx (Reverse Proxy)    |
                               | SSL Termination / Routing   |
                               +--------------+--------------+
                                              |
                     +------------------------+------------------------+
                     | Static Asset Delivery                           | API Requests (Port 3000)
             +-------v-------+                                 +-------v-------+
             | React + Vite  |                                 | Express App   |
             |  (Frontend)   |                                 |  (Backend)    |
             +---------------+                                 +-------+-------+
                                                                       |
                                         +-----------------------------+-----------------------------+
                                         |                             |                             |
                                 +-------v-------+             +-------v-------+             +-------v-------+
                                 |  Prisma ORM   |             |   node-cron   |             | Notifications |
                                 +-------+-------+             | (Overdue Job) |             |  (SMTP/SMS)   |
                                         |                     +---------------+             +---------------+
                                 +-------v-------+
                                 | PostgreSQL 16 |
                                 +---------------+
```

### Modular Monolith Structure

```text
backend/src/modules/
  ├── auth/         → login, logout, refresh, me, password reset
  ├── users/        → profile, wardens list
  ├── master/       → blocks, branches data retrieval
  ├── requests/     → submit, approve, reject, cancel, delay
  ├── certificates/ → generate, fetch, verify
  ├── gate/         → QR scan processing
  └── admin/        → warden CRUD, student import, reports
```

### Database Schema Summary

- **User**: Represents all system users including students, wardens, admins, and security staff.
- **Block**: Represents a physical hostel building containing floors.
- **Floor**: Represents a level within a block containing rooms.
- **Room**: Represents a specific room where students are accommodated.
- **Branch**: Represents academic departments.
- **OutingRequest**: Tracks the lifecycle of student outing and home-going requests.
- **ApprovalCertificate**: Represents a valid digital pass generated from an approved request.
- **ScanLog**: Records entry and exit scans performed by security at the gate.
- **Notification**: Stores system-generated alerts and messages sent to users.
- **AuditLog**: Tracks critical actions performed by admins and users for compliance.
- **PasswordReset**: Manages OTP-based password recovery flows for users.

## User Roles & Capabilities

| Role          | What they can do                                                                 |
|---------------|----------------------------------------------------------------------------------|
| STUDENT       | Submit requests, cancel pending requests, view certificates, flag return delays. |
| WARDEN        | Review, approve, or reject outing/home-going requests for their assigned blocks. |
| CHIEF_WARDEN  | Has all warden privileges across all blocks and administrative oversight.        |
| ADMIN         | Manage master data, import students, manage warden assignments, view reports.    |
| SECURITY      | Scan digital QR certificates at the gate, process entry and exit logs.           |

## Tech Stack

| Layer            | Technology             | Purpose                                                |
|------------------|------------------------|--------------------------------------------------------|
| Frontend         | React 18 + Vite        | Single Page Application for user interfaces            |
| Backend          | Node.js + Express      | REST API handling business logic                       |
| ORM              | Prisma                 | Database schema management and type-safe queries       |
| Database         | PostgreSQL 16          | Relational data storage                                |
| Auth             | JWT + HttpOnly cookies | Secure authentication and session management           |
| Containerization | Docker + Compose       | Consistent deployment and service orchestration        |
| Reverse Proxy    | Nginx                  | SSL termination, routing, and static asset delivery    |
| QR Scanning      | html5-qrcode           | Web-based gate scanner for security personnel          |
| Email            | Nodemailer + SMTP      | Transactional emails for OTPs and critical alerts      |
| SMS              | Configurable           | Parent & warden alerts (extensible interface)          |
| Scheduling       | node-cron              | Internal job for overdue return detection              |

## API Overview

#### Auth
```text
POST    /api/auth/login                  → Authenticate user                                [Public]
POST    /api/auth/logout                 → Clear session cookies                            [Public]
POST    /api/auth/refresh                → Refresh access token                             [Public]
GET     /api/auth/me                     → Get current authenticated session                [All]
POST    /api/auth/forgot-password        → Initiate OTP-based password reset                [Public]
POST    /api/auth/reset-password         → Reset password using OTP                         [Public]
POST    /api/auth/change-password        → Change current password                          [All]
```

#### Users & Master Data
```text
GET     /api/users/me/profile            → Get current user's detailed profile              [All]
PUT     /api/users/me/profile            → Update current user's profile                    [All]
GET     /api/users/wardens               → List all available wardens                       [All]
GET     /api/master/blocks               → Get all blocks, floors, and rooms                [All]
GET     /api/master/branches             → Get all academic branches                        [All]
```

#### Requests
```text
POST    /api/requests                    → Submit a new outing/home-going request           [STUDENT]
GET     /api/requests                    → Get list of requests based on user role          [All]
GET     /api/requests/:id                → Get details of a specific request                [All]
PUT     /api/requests/:id/approve        → Approve a pending request                        [WARDEN, CHIEF_WARDEN]
PUT     /api/requests/:id/reject         → Reject a pending request                         [WARDEN, CHIEF_WARDEN]
PUT     /api/requests/:id/cancel         → Cancel an approved/pending request               [WARDEN, CHIEF_WARDEN]
PUT     /api/requests/:id/delay          → Flag a delayed return                            [STUDENT]
```

#### Certificates
```text
GET     /api/certificates/approval/:approvalNumber → Get certificate by approval number     [SECURITY]
GET     /api/certificates/:id            → Get certificate details                          [All]
GET     /api/certificates/verify/:qrToken→ Verify the authenticity of a QR token            [SECURITY]
```

#### Gate
```text
POST    /api/gate/scan                   → Process a QR scan at the gate                    [SECURITY]
```

#### Admin
```text
GET     /api/admin/wardens               → Get list of all wardens                          [ADMIN, CHIEF_WARDEN]
POST    /api/admin/wardens               → Create a new warden account                      [ADMIN, CHIEF_WARDEN]
PUT     /api/admin/wardens/:id           → Update warden details                            [ADMIN, CHIEF_WARDEN]
DELETE  /api/admin/wardens/:id           → Delete a warden account                          [ADMIN, CHIEF_WARDEN]
PUT     /api/admin/wardens/:id/assign    → Assign a warden to a block                       [ADMIN, CHIEF_WARDEN]
GET     /api/admin/students              → Get list of all students                         [ADMIN, CHIEF_WARDEN]
POST    /api/admin/students/import/template → Generate student import CSV template          [ADMIN, CHIEF_WARDEN]
POST    /api/admin/students/import       → Bulk import students from CSV                    [ADMIN, CHIEF_WARDEN]
GET     /api/admin/students/:id          → Get specific student details                     [ADMIN, CHIEF_WARDEN]
PUT     /api/admin/students/:id          → Update student details                           [ADMIN, CHIEF_WARDEN]
POST    /api/admin/students/:id/reset-password → Admin triggered password reset             [ADMIN, CHIEF_WARDEN]
GET     /api/admin/reports/requests      → Generate requests activity report                [ADMIN, CHIEF_WARDEN]
GET     /api/admin/reports/overdue       → Generate overdue students report                 [ADMIN, CHIEF_WARDEN]
GET     /api/admin/reports/summary       → Get high-level system summary statistics         [ADMIN, CHIEF_WARDEN]
GET     /api/admin/jobs/overdue-check    → Manually trigger overdue check job               [All]
```

#### Health
```text
GET     /api/health                      → System health check and DB connection status     [All]
```

## QR Code Flow

1. Warden approves the student's outing or home-going request.
2. Backend generates a signed JWT as `qrToken` containing the request parameters.
3. An `ApprovalCertificate` is stored in the database and linked to the `qrToken`.
4. Student opens the certificate page, and the QR code is rendered natively from the `qrToken`.
5. Security personnel opens the `/gate/scan` interface on the designated gate PC.
6. The camera decodes the QR code and sends the `qrToken` to the `POST /api/gate/scan` endpoint.
7. Server verifies the JWT signature and determines whether it is an EXIT or ENTRY scan based on current database state.
8. A `ScanLog` entry is written, and the certificate status is updated accordingly.
9. A success or error overlay is shown immediately to the security staff.
10. The `node-cron` scheduled job flags the request as overdue if the student does not return by the expected time.

## Project Structure

```text
hpms/
├── docker-compose.yml          # Production service orchestration
├── docker-compose.dev.yml      # Development overrides
├── nginx/
│   ├── nginx.conf              # Reverse proxy + SSL config
│   └── certs/                  # SSL certificates (not committed)
├── frontend/
│   ├── src/
│   │   ├── modules/            # Feature modules (auth, student, warden, gate, admin, profile)
│   │   ├── shared/             # Shared components and hooks
│   │   ├── api/                # Axios client instance
│   │   └── router/             # Route definitions and guards
└── backend/
    ├── prisma/
    │   ├── schema.prisma       # Single source of truth for DB schema
    │   └── seed.js             # Development seed data
    └── src/
        ├── modules/            # Feature modules (one per domain)
        ├── middleware/         # Auth, RBAC, error handling
        ├── shared/             # ApiResponse, AppError, constants
        ├── jobs/               # node-cron scheduled tasks
        └── config/             # Env validation, Prisma singleton
```

## Gate Scanner — Deployment Note

The web-based gate scanner located at `/gate/scan` requires HTTPS to function, as the `getUserMedia` API for camera access is restricted by modern browsers in non-secure contexts. In production, the Nginx container handles SSL termination to fulfill this requirement. For a college LAN deployment without a public domain, a self-signed certificate is sufficient to enable camera access. For installation and environment setup, see [SETUP.md](./SETUP.md), which includes the commands required to generate the self-signed certificates. To optimize the experience at the gate PC, launch Chrome in kiosk mode to automatically full-screen the scanner application.

## Contributing & License

This project is licensed under the MIT License. Please note that this is a college infrastructure project. If you wish to contribute, ensure that all pull requests are discussed with the core maintainers prior to submission to ensure alignment with college security protocols and infrastructure guidelines.
