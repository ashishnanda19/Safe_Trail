# SafeTraiL 

SafeTraiL is a premium, real-time emergency response platform designed to bridge the gap between victims, their personal guardians, and professional emergency services. With high-fidelity maps, real-time location tracking, and automated alerting, SafeTraiL ensures that help is never more than a heartbeat away.

---
 
##  Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **State Management**: Zustand (Auth, SOS, Socket, UI states)
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **Mapping**: Leaflet + React-Leaflet (OpenStreetMap)
- **Real-time**: Socket.io-client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time Engine**: Socket.io
- **Database**: PostgreSQL with PostGIS extension via **Supabase** (Spatial queries)
- **Task Queue**: BullMQ + Redis via **Upstash** (Async SMS/Push alerts)
- **Validation**: Zod

### Infrastructure & Hosting
- **Frontend**: Vercel
- **Backend API**: Render (Node.js Web Service)
- **Database**: [Supabase](https://supabase.com) — Free-tier managed PostgreSQL + PostGIS
- **Cache & Queues**: [Upstash](https://upstash.com) — Free-tier serverless Redis (TLS)

### External APIs
- **Nominatim**: Reverse geocoding (Coordinates to Addresses)
- **OpenStreetMap Overpass**: Sourcing nearby emergency infrastructure (Hospitals, Police, Pharmacies)
- **OSRM Engine**: Real-time routing and ETA calculations
- **SMS Gateway**: Twilio / Generic SMS API support

---

##  Project Structure

```bash
SafeTraiL/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── api/            # API Service Layer
│   │   ├── components/     # UI, SOS, Layout components
│   │   ├── hooks/          # Geolocation, Socket hooks
│   │   ├── pages/          # Auth, Dashboard, Map, SOS Active
│   │   └── store/          # Zustand state management
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── db/             # PostgreSQL queries & migrations
│   │   ├── jobs/           # BullMQ workers (Alerting, Processing)
│   │   ├── routes/         # API Endpoint definitions
│   │   ├── services/       # Domain logic (SOS, Maps, Auth)
│   │   └── sockets/        # Real-time event handlers
├── assets/                 # Project documentation images
├── supabase_schema.sql      # Unified DB schema for Supabase SQL Editor
├── render.yaml             # Render deployment configuration
└── docker-compose.yml      # Local development environment
```

---

##  Features & Functionality

1. **SOS Emergency Trigger**: A dedicated high-stakes trigger with configurable hold duration (1s, 2s) to prevent accidental activation.
2. **Real-time Guardian Alerts**: Instant SMS and Socket.io notifications sent to your personal "Guardian Circle".
3. **Live Victim Tracking**: Guardians can track the victim's movement on a live map with sub-second updates.
4. **Nearby Emergency Help**: Automatic detection of the nearest Hospital and Police Station (searches up to 50km).
5. **Interactive Incident Map**: Community-driven safety reports on a visual heatmap.
6. **Smart Routing**: One-tap navigation from the victim's location to the nearest help point with live ETAs.
7. **Personalized Dashboard**: A responsive, desktop-friendly console showing active SOS status and safety stats.

---

##  Architecture

SafeTraiL follows a **Distributed Event-Driven Architecture**. Real-time location streams are handled via Socket.io for immediate UI updates, while mission-critical alerts are processed through persistent Redis queues to ensure reliability even under heavy load.

### System Architecture
![System Architecture](assets/7.png)

### Sequence Diagram
![Sequence Diagram](assets/8.png)

---

##  API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create a new user/volunteer account.
- `POST /login` - Authenticate and receive JWT tokens.
- `POST /refresh` - Rotate expired access tokens.
- `POST /logout` - Invalidate current session.

### User Profile (`/api/users`)
- `GET /me` - Fetch current user profile.
- `PATCH /me` - Update user profile.
- `PATCH /me/location` - Update background location.

### Emergency (SOS) (`/api/sos`)
- `POST /trigger` - Initiate an SOS event (pings guardians + queues alerts).
- `POST /:eventId/location` - Victim-side location pings.
- `GET /:eventId/location` - Fetch latest victim position.
- `GET /:eventId` - Fetch specific SOS event details (victim info, etc.).
- `PATCH /:eventId/resolve` - Mark emergency as handled.
- `GET /history` - View personal SOS alert history.

### Guardians (`/api/guardians`)
- `GET /` - List current guardian circle.
- `GET /invites` - List pending invitations.
- `POST /` - Invite a new guardian by phone/email.
- `DELETE /:guardianId` - Remove a guardian from circle.
- `PATCH /:circleId/accept` - Accept a guardian invitation.

### Map & Geo-Intelligence (`/api/map`)
- `GET /nearby` - Search for infrastructure within radius (OSM Overpass API).
- `GET /nearest` - Find the single absolute closest emergency point.
- `GET /route` - Calculate paths and ETAs via OSRM.
- `GET /geocode/reverse` - Resolve coordinates to street address.
- `GET /live/:sosEventId` - Fetch full live GeoJSON tracking trail.
- `GET /heatmap` - Fetch geographic heatmaps for analytics.

### Incidents (`/api/incidents`)
- `POST /` - Submit a new safety report.
- `GET /nearby` - Fetch reports within visual range.
- `GET /:id` - Fetch single incident details.

### Audio Evidence (`/api/evidence`)
- `POST /:sosEventId/chunk` - Upload encrypted live audio chunk during active SOS.
- `GET /:sosEventId/chunk/:chunkId` - Stream a specific audio chunk securely.
- `GET /:sosEventId` - List all audio chunks collected for an SOS event.
- `DELETE /:sosEventId` - Purge evidence securely (Owner/Admin).

### Voice SOS (`/api/voice`)
- `GET /settings` - Fetch voice activation settings.
- `PUT /settings` - Update voice activation preferences.
- `GET /keywords` - List registered voice trigger keywords.
- `POST /keywords` - Add a custom voice keyword trigger.
- `DELETE /keywords/:id` - Remove a custom keyword.
- `POST /trigger` - Direct SOS trigger via background keyword match.

### Admin (`/api/admin`)
- `GET /stats` - Fetch overall system statistics.
- `GET /heatmap` - Get localized cluster density data.
- `GET /sos/active` - List currently active network-wide SOS events.
- `PATCH /users/:id/role` - Elevate or revoke administrative rights.

---

##  Setup & Installation

### Prerequisites
- Node.js (v20+)
- A [Supabase](https://supabase.com) project (free tier) with PostGIS enabled
- An [Upstash](https://upstash.com) Redis instance (free tier)
- Twilio Account (for SMS alerts)

### 1. Database Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** → **New Query**.
3. Copy the contents of [`supabase_schema.sql`](./supabase_schema.sql) and run it.
4. Go to **Table Editor** to confirm all tables were created.
5. Copy your **Session mode connection string** from **Project Settings → Database**.

### 2. Redis Setup (Upstash)

1. Create a free Redis database at [upstash.com](https://upstash.com).
2. Copy the **Redis URL** (starts with `rediss://`).

### 3. Environment Variables

Create a `server/.env` file. Use [`server/.env.example`](./server/.env.example) as a template:

```env
NODE_ENV=development
PORT=3001

# Supabase PostgreSQL
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-X.pooler.supabase.com:5432/postgres

# Upstash Redis (TLS)
REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379

# JWT Secrets (generate strong random strings, min 32 chars)
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Twilio (optional — SMS alerts skipped if not set)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Firebase Admin SDK (optional — push notifications skipped if not set)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

### 4. Local Development (Docker)

Both the database and Redis are cloud-hosted. The local Docker setup only runs the backend API and client:

```bash
docker compose up --build
```

The application will be accessible at `http://localhost:5173`.

### 5. Running Without Docker

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

---

##  Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | **Vercel** | Auto-deploys on push to `main` |
| Backend API | **Render** | Configured via `render.yaml` |
| Database | **Supabase** | Free-tier PostgreSQL + PostGIS |
| Cache & Queues | **Upstash** | Free-tier serverless Redis (TLS) |

### Deploying to Render

The [`render.yaml`](./render.yaml) file defines the backend web service. Set the following environment variables in the Render dashboard under your web service → **Environment**:

- `DATABASE_URL` — Your Supabase session-mode connection string
- `REDIS_URL` — Your Upstash Redis URL (`rediss://...`)
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`
- `TWILIO_*` and `FIREBASE_*` credentials

---

##  Project Showcases

1.  
   ![Branding](assets/1.png)
2. 
   ![Dashboard](assets/2.png)
3.  
   ![SOS](assets/3.png)
4.  
   ![Incidents](assets/4.png)
5.  
   ![Map](assets/5.png)
6. 
   ![Sequence](assets/6.png)

