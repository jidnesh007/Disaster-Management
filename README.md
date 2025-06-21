
# 🌪️ Disaster Management System (MERN Stack)

A comprehensive real-time disaster management system built using the MERN stack (MongoDB, Express, React, Node.js) with WebSocket-powered live updates. This application empowers authorities, coordinators, rescue teams, and citizens to respond swiftly and effectively during disasters.

## 🚀 Features

- 🔒 **User Authentication** (Admin, Volunteer, Coordinator)
- 🗺️ **Live Mumbai Disaster Map** with resource overlays
- 🆘 **SOS System** for emergency location sharing
- 🚨 **Real-time Alerts** powered by ReliefWeb
- 🧭 **Rescue Team Coordination** with live location sharing
- 💡 **Donation Management** and tracking system
- 📦 **Resource Inventory Management**
- 📢 **WebSocket Integration** for real-time communication
- 📈 **Admin Dashboard** with alert control and analytics
- 🧠 **Error Boundaries** and graceful failure handling

---

## 🖥️ Tech Stack

### Frontend
- React (with React Router)
- Tailwind CSS
- WebSocket client integration

### Backend
- Node.js with Express
- MongoDB (via Mongoose)
- WebSocket Server (ws)
- Scheduled alert system
- REST API architecture

---

## 📂 Project Structure

```

├── client/                  # React Frontend
│   ├── pages/               # Pages like LoginPage, SOSSystem, Admin, etc.
│   ├── components/          # Reusable UI components
│   └── App.jsx              # Routing and ErrorBoundary
├── server/                  # Express Backend
│   ├── routes/              # API routes (auth, map, sos, alerts, etc.)
│   ├── services/            # Alert Scheduler service
│   ├── models/              # Mongoose models
│   ├── websocket/           # WebSocket event handlers
│   ├── .env                 # Environment variables
│   └── index.js             # Main server and WebSocket setup

````

---

## 📡 API Endpoints

| Route | Description |
|-------|-------------|
| `/api/auth` | Login, registration |
| `/api/rescue` | Rescue team actions |
| `/api/sos` | SOS trigger and tracking |
| `/api/map` | Facility and map data |
| `/api/alerts` | Live alerts and alert status |
| `/api/donations` | Donation operations |
| `/api/resources` | Resource inventory |
| `/api/health` | Server and system health status |

---

## 🔁 WebSocket Events

Supports multiple real-time channels:
- `JOIN_RESCUE_TEAM`
- `JOIN_COORDINATOR`
- `JOIN_ALERT_UPDATES`
- `LOCATION_UPDATE`
- `SOS_LOCATION_UPDATE`
- `FACILITY_CAPACITY_UPDATE`
- `PING`/`PONG` health checks

---

## 🧪 Health Monitoring

- `/api/health` – returns server, database, WebSocket, and alert monitoring status in real-time.
- Alert system can be manually checked or reset via `/api/admin/alerts/*` routes.

---

## 🌐 Environment Variables

Create a `.env` file in the root with the following:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/disaster-db
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
````

---

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/disaster-management.git
cd disaster-management
```

### 2. Setup backend

```bash
cd server
npm install
npm run dev
```

### 3. Setup frontend

```bash
cd client
npm install
npm run dev
```

---

## 📈 Dashboard Previews

* **Admin Dashboard** – View all alerts, donations, resources
* **Volunteer Panel** – Track SOS and assist via map
* **Coordinator Dashboard** – Manage teams and facilities

---


