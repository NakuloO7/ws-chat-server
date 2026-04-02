# 💬 Real-Time WebSockets Chat Platform

A scalable real-time chat application built using **React, Node.js, WebSockets, and Redis Pub/Sub**, designed to support multi-user communication with low-latency message delivery and seamless user experience.

> 🐳 Fully Dockerized — run the entire system with a single command

---

## 🚀 Features

- ⚡ Real-time messaging using WebSockets
- 🧑‍🤝‍🧑 Multi-room chat support
- 🔄 Live message sync across clients using Redis Pub/Sub
- ✏️ Edit & delete messages with real-time updates
- 📜 Cursor-based pagination (infinite scroll)
- 🎯 Scroll position preservation (WhatsApp-like UX)
- 🔐 JWT authentication (cookie-based)
- 🧠 Optimized React rendering (custom hooks + state mgmt)
- ⚙️ Scalable architecture (multi-instance ready)

---
---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js
- WebSockets (`ws`)
- Redis (Pub/Sub)
- PostgreSQL
- Prisma ORM

---

## 🐳 Running with Docker (Recommended)

### 📦 Prerequisites

- Docker
- Docker Compose

---

### 🚀 Setup Steps

1. **Clone the repository**

```bash
git clone https://github.com/NakuloO7/ws-chat-server.git
cd ws-chat-server

.env File backend :- 
PORT=3000
WS_PORT=8080
JWT_SECRET=your_secret
DATABASE_URL=postgresql://postgres:password@db:5432/chatdb
REDIS_URL=redis://redis:6379

Run all the services :
docker-compose up --build

stop the container :
docker-compose down



Running without Docker (Manual Setup) :
cd backend
npm install

.env
PORT=3000
WS_PORT=8080
JWT_SECRET=your_secret
DATABASE_URL=your_postgres_url
REDIS_URL=your_redis_url


Run Backend :
npm run dev

--------------------------

Frontend :
cd frontend
npm install
npm run dev


Database Prisme :
npx prisma migrate dev
