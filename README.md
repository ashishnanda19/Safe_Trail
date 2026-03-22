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
- **Overpass API**: Sourcing nearby emergency infrastructure (Hospitals, Police, Pharmacies)
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
![Sequence Diagram](assets/8.jpeg)

---

##  API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user/volunteer account.
- `POST /api/auth/login` - Authenticate and receive JWT tokens.
- `POST /api/auth/refresh` - Rotate expired access tokens.
- `POST /api/auth/logout` - Invalidate current session.

### Emergency (SOS)
- `POST /api/sos/trigger` - Initiate an SOS event (pings guardians + queues alerts).
- `POST /api/sos/:eventId/location` - victim-side location pings.
- `GET /api/sos/:eventId/location` - Fetch latest victim position.
- `PATCH /api/sos/:eventId/resolve` - Mark emergency as handled.
- `GET /api/sos/history` - View personal SOS alert history.

### Guardians
- `GET /api/guardians` - List current guardian circle.
- `POST /api/guardians` - Invite a new guardian by phone/email.
- `DELETE /api/guardians/:id` - Remove a guardian from circle.
- `PATCH /api/guardians/:circleId/accept` - Accept a guardian invitation.

### Map & Geo-Intelligence
- `GET /api/map/nearby` - Search for infrastructure within radius.
- `GET /api/map/nearest` - Find the single absolute closest emergency point.
- `GET /api/map/route` - Calculate paths and ETAs via OSRM.
- `GET /api/map/reverse-geocode` - Resolve coordinates to street address.

### Incidents
- `POST /api/incidents` - Submit a new safety report.
- `GET /api/incidents/nearby` - Fetch reports within visual range.

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
   ![Map](assets/5.webp)
6. 
   ![Sequence](assets/6.png)

