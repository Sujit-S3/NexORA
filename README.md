# NexORA

NexORA is a modern, high-performance E-Commerce platform built on the MERN stack (MongoDB, Express.js, React, Node.js). It features a beautifully designed storefront, a robust administrative dashboard, and secure, optimized backend architecture.

## 🚀 Features

- **Storefront:** Browse categories, search products, read/write reviews, and manage a cart.
- **Checkout Flow:** Capture shipping details and process simulated payments.
- **User Dashboard:** Order history tracking and profile management.
- **Admin Dashboard:** Real-time KPIs, Recharts-powered analytics, user management, order processing, and product/inventory tracking.
- **Security:** Helmet HTTP headers, express-rate-limit, express-mongo-sanitize, secure JWT cookies, and Bcrypt password hashing.
- **Performance:** Dynamic MongoDB aggregations, Mongoose compound indexing, and Vite code-splitting.

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router DOM, Recharts, Axios.
- **Backend:** Node.js, Express.js, MongoDB, Mongoose.
- **Authentication:** JSON Web Tokens (JWT).
- **Media Management:** Cloudinary.

## 📦 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or local)
- Cloudinary account (free tier)

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Cloudinary keys
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
# Configure Vite proxy or env variable if backend is not on port 5000
npm run dev
```

## ☁️ Deployment

The application is fully configured for cloud deployment.
- **Frontend (Vercel):** The `client/vercel.json` ensures Vite's SPA routing works correctly.
- **Backend (Render):** The `server/render.yaml` defines Infrastructure-as-Code for zero-downtime Node.js hosting.

## 🔐 Security Configuration
The API relies heavily on middleware layers for security. Ensure `NODE_ENV=production` is set so Morgan logging switches to `combined` mode and detailed stack traces are hidden from error responses.
