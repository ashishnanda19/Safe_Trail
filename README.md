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
- **Database**: PostgreSQL with PostGIS extension (Spatial queries)
- **Task Queue**: Bull + Redis (Async SMS/Push alerts)
- **Validation**: Zod

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
│   │   ├── jobs/           # Bull workers (Alerting, Processing)
│   │   ├── routes/         # API Endpoint definitions
│   │   ├── services/       # Domain logic (SOS, Maps, Auth)
│   │   └── sockets/        # Real-time event handlers
├── assets/                 # Project documentation images
└── docker-compose.yml       # Containerized environment setup
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
- Node.js (v18+)
- PostgreSQL with PostGIS extension
- Redis server
- Twilio Account (for SMS alerts)

### 1. Environment Variables (`.env`)

Create a `.env` file in the `server` directory:

```env
# Server Config
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/safetrail

# Caching & Queues
REDIS_URL=redis://localhost:6379

# Security
ACCESS_TOKEN_SECRET=your_32_char_access_secret
REFRESH_TOKEN_SECRET=your_32_char_refresh_secret

# External APIs (Defaults provided)
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
OSRM_API_URL=https://router.project-osrm.org
NOMINATIM_API_URL=https://nominatim.openstreetmap.org

# Optional: Notifications
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number
```

### 2. Backend Setup
```bash
cd server
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

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

