# Kalon — Roadside Assistance Platform

Full-stack roadside assistance platform with OTP login, vehicle management, four service types, real-time tracking, volunteer & admin dashboards, and payment integration.

## Features

- **Customer OTP Login** — Passwordless authentication via SMS OTP (dev mode shows OTP in UI)
- **Vehicle Management** — Add, edit, delete vehicles with default selection
- **Services** — Fuel Delivery, Tyre Puncture, Battery Jump Start, Towing
- **Real-time Tracking** — Socket.io powered live status updates & volunteer location
- **Volunteer Dashboard** — Accept jobs, update status, toggle availability
- **Admin Dashboard** — Platform stats, service breakdown, volunteer leaderboard
- **Payments** — Test payment flow with transaction IDs (Stripe/Razorpay ready)
- **Mobile-first UI** — Premium blue design with Tailwind CSS

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS v4     |
| Backend  | Node.js, Express, Socket.io         |
| Database | MySQL                               |
| Auth     | JWT + OTP                           |

## Quick Start

### 1. Database Setup

Install MySQL and run the schema:

```bash
mysql -u root -p < database/schema.sql
```

Or import `database/schema.sql` via MySQL Workbench / phpMyAdmin.

### 2. Backend Configuration

```bash
cd backend
cp .env.example .env   # Edit DB credentials if needed
npm install
npm run dev
```

API runs at **http://localhost:5000**

**No MySQL installed?** Set `USE_MEMORY_DB=true` in `backend/.env` (enabled by default) to run with an in-memory database for local development. For production, use MySQL and set `USE_MEMORY_DB=false`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**

### 4. Run Both (from root)

```bash
npm install
npm run install:all
npm run dev
```

## Demo Accounts

| Role      | Phone       |
|-----------|-------------|
| Customer  | 7777777777  |
| Volunteer | 8888888888  |
| Admin     | 9999999999  |

Login flow: enter phone → Send OTP → OTP appears in dev mode on screen → Verify.

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/auth/send-otp`        | Send OTP to phone        |
| POST   | `/api/auth/verify-otp`      | Verify OTP & get JWT     |
| GET    | `/api/vehicles`             | List user vehicles       |
| POST   | `/api/vehicles`             | Add vehicle              |
| GET    | `/api/services`             | List service types       |
| POST   | `/api/requests`             | Create assistance request|
| GET    | `/api/requests/:id`         | Get request + tracking   |
| PATCH  | `/api/requests/:id/status`  | Update request status    |
| POST   | `/api/payments/create`      | Initiate payment         |
| POST   | `/api/payments/confirm`     | Confirm payment          |
| GET    | `/api/volunteer/dashboard`  | Volunteer dashboard data |
| GET    | `/api/admin/dashboard`      | Admin analytics          |

## Real-time Events (Socket.io)

- `tracking:update` — Status changes on a request
- `tracking:location` — Volunteer GPS updates
- `request:new` — New pending request (volunteers)

## Project Structure

```
kalon/
├── backend/          # Express API + Socket.io
├── frontend/         # React SPA
├── database/         # MySQL schema & seed data
└── README.md
```

## Production Notes

- Set `JWT_SECRET` and database credentials in production `.env`
- Integrate Twilio/MSG91 for real OTP delivery
- Connect Stripe or Razorpay in `backend/src/routes/payments.js`
- Use Google Maps API for live map in tracking page
- Deploy frontend behind nginx with `/api` proxy to backend

## Mobile App

See **[MOBILE_APP.md](./MOBILE_APP.md)** for building the Android APK and installing as PWA.

Quick start:
```bash
cd frontend
npm install
npm run app:build      # Build + sync Android
npm run cap:android    # Open Android Studio
```
