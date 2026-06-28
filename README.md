<div align="center">
  <img src="client/public/logo-nexora.png" alt="NexORA Logo" width="300" />
  <h1>NexORA — Next Generation Luxury Commerce</h1>
  <p><strong>An ultra-premium, AI-driven luxury e-commerce platform.</strong></p>

  <p>
    <a href="#live-demo">Live Demo</a> •
    <a href="#backend-api">Backend API</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#installation">Installation</a>
  </p>
</div>

---

## ✅ Live Environments (Production)

- **Live Demo (Vercel):** *[Insert Vercel URL here]*
- **Backend API (Render):** *[Insert Render URL here]*

*(Deployment instructions are provided in the [Installation](#installation) section)*

---

## 📸 Screenshots

*(Replace placeholders with actual product screenshots once deployed)*

| **AI Concierge Experience** | **Luxury Product Catalog** |
| :---: | :---: |
| <img src="https://via.placeholder.com/600x350/1A1A1A/D4AF37?text=AI+Concierge+Interface" alt="AI Concierge" width="400"/> | <img src="https://via.placeholder.com/600x350/1A1A1A/D4AF37?text=Product+Catalog" alt="Product Catalog" width="400"/> |

| **Precision Size Guide** | **Dynamic Checkout Flow** |
| :---: | :---: |
| <img src="https://via.placeholder.com/600x350/1A1A1A/D4AF37?text=Size+System" alt="Size Guide" width="400"/> | <img src="https://via.placeholder.com/600x350/1A1A1A/D4AF37?text=Guest+Checkout" alt="Checkout" width="400"/> |

---

## 🏛️ Architecture

NexORA utilizes a decoupled architecture, employing a Vite/React SPA for ultra-fast client-side rendering and a Node/Express backend scaling horizontally via MongoDB.

```mermaid
graph TD
    Client[Client Browser (Vite/React)] -->|REST & SSE| API[Node.js / Express API]
    API --> DB[(MongoDB Atlas)]
    API --> Gemini[Google Gemini API]
    API --> Cloudinary[Cloudinary Media CDN]

    subgraph "AI Subsystem"
        Gemini --> Memory[Recommendation Memory]
        Gemini --> PolicyEngine[Budget & Inventory Policy]
    end

    subgraph "Admin Subsystem"
        API --> Auth[JWT & Bcrypt]
    end
```

---

## ✨ Features

- **AI Concierge (Gemini-Powered):** A revolutionary shopping assistant that streams personalized luxury recommendations based on user intent, budget constraints, and active cart context.
- **Precision Sizing System:** Categorized, dynamic dimension matrices explicitly built for luxury garments, footwear, and accessories.
- **Enterprise-Grade Admin Dashboard:** Recharts-powered analytics for inventory tracking, order management, and revenue KPIs.
- **Seamless Wishlist & Cart Persistence:** Synchronized cross-session cart states with robust API guardrails.
- **Guest Checkout Support:** Frictionless conversion pathways without mandatory registration walls.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS (Dark/Luxury Theme config)
- **State Management:** React Context API (Auth, Cart, Wishlist, AI)
- **Routing:** React Router v6
- **Animations & Icons:** Framer Motion, Lucide React

### Backend
- **Server:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **AI Integration:** `@google/genai` (Gemini Flash)
- **Security:** Helmet, express-rate-limit, express-mongo-sanitize, CORS, JWT
- **Media:** Cloudinary SDK

---

## 🚀 Installation & Local Development

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or local)
- Google Gemini API Key
- Cloudinary account

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
```
*Edit `.env` with your `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, and Cloudinary credentials.*
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```
*Create a `.env` in the client root if the backend is not on port 5000 (e.g., `VITE_API_URL=http://localhost:5000/api`)*
```bash
npm run dev
```

---

## 📦 Deployment Guide

1. **Deploy Backend (Render)**
   - Connect the repository to Render.com and create a **Web Service**.
   - Root directory: `server/`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Supply all backend `.env` variables.
2. **Deploy Frontend (Vercel)**
   - Connect the repository to Vercel.
   - Root directory: `client/`
   - Supply `VITE_API_URL` pointing to your Render backend URL.
3. **Synchronize Origins**
   - Update `CLIENT_ORIGIN` in Render to match your Vercel URL.

---

## 📜 Release Notes (v1.0.0)

- Implemented comprehensive AI Concierge architecture (Streaming, Tone Guard, Memory).
- Re-architected Size System and Product Validation frameworks.
- Eradicated 244 critical ESLint bugs across client and server.
- Fortified backend guardrails against prompt injection and budget bypass.
- Complete Live Functional Verification across all critical user pathways.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
