# NexORA

AI-driven luxury e-commerce platform built with React, Express, MongoDB, and Gemini.

[Live Demo](https://nex-ora-jade.vercel.app)

## Overview

NexORA is a decoupled full-stack MERN application that provides a modern e-commerce experience. It integrates an AI shopping concierge for personalized recommendations, a robust cart and order system, guest checkout capabilities, and secure payment processing. 

## Key Features

- **AI Concierge (Gemini-Powered):** A shopping assistant that streams personalized luxury recommendations based on user intent, budget constraints, and active cart context.
- **Precision Sizing System:** Categorized dimension matrices explicitly built for luxury garments, footwear, and accessories.
- **Admin Dashboard:** Recharts-powered analytics for inventory tracking, order management, and revenue tracking.
- **Wishlist & Cart Persistence:** Synchronized cross-session cart states with robust API validation.
- **Guest Checkout:** Frictionless conversion pathways without mandatory registration walls.
- **Payments:** Razorpay integration with signature-verified order creation and webhook reconciliation.
- **Authentication:** Refresh Token Rotation with silent session renewal and reuse detection.

## Architecture

The application uses a decoupled architecture, employing a Vite/React SPA for fast client-side rendering and a Node/Express backend that scales horizontally via MongoDB.

```mermaid
graph TD
    Client[Client Browser (Vite/React)] -->|REST & SSE| API[Node.js / Express API]
    API --> DB[(MongoDB Atlas)]
    API --> Gemini[Google Gemini API]
    API --> Cloudinary[Cloudinary Media CDN]

    subgraph "AI Subsystem"
        Gemini --> Memory[Recommendation Memory]
    end

    subgraph "Admin Subsystem"
        API --> Auth[JWT & Bcrypt]
    end
```

## Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context API 
- **Routing:** React Router v6
- **Animations:** Framer Motion
- **Testing:** Vitest + React Testing Library

### Backend
- **Server:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **AI Integration:** `@google/genai` (Gemini Flash)
- **Payments:** Razorpay
- **Security:** Helmet, express-rate-limit, express-mongo-sanitize, CORS, JWT (httpOnly cookies, refresh rotation)
- **Media:** Cloudinary SDK
- **Testing:** Jest + Supertest + mongodb-memory-server

## Project Structure

```
NexORA/
├── client/          # Vite/React Frontend SPA
├── server/          # Node/Express Backend API
├── docs/            # Additional project documentation
└── tools/           # Build and infrastructure tooling
```

## Screenshots / Demo

*Live Demo URL: https://nex-ora-jade.vercel.app*

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or local)
- Google Gemini API Key
- Cloudinary account

### Clone the Repository
```bash
git clone https://github.com/Sujit-S3/NexORA.git
cd NexORA
```

## Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/nexora
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

## Running Locally

1. **Start the Backend:**
```bash
cd server
npm install
npm run dev
```

2. **Start the Frontend:**
```bash
cd client
npm install
npm run dev
```

## API / Backend

The backend is a RESTful API built with Express. It relies on standard JSON requests and uses HTTP-Only cookies for secure JWT transmission. Core modules include:
- `/api/auth` - Authentication and token rotation.
- `/api/products` - Product catalog and inventory.
- `/api/orders` - Order management and Razorpay webhooks.
- `/api/ai` - Gemini AI concierge streaming endpoint.

## Testing

The project contains comprehensive unit and integration tests.

```bash
# Server tests (Jest + Supertest)
cd server && npm test

# Client tests (Vitest + RTL)
cd client && npm test
```

## Deployment

1. **Backend (Render, Railway, or AWS):**
   - Root directory: `server/`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Supply all backend `.env` variables.
2. **Frontend (Vercel):**
   - Root directory: `client/`
   - Supply `VITE_API_URL` pointing to your backend URL.

## Security

- Passwords hashed using `bcryptjs`.
- JWTs transmitted exclusively via `httpOnly`, `secure` cookies.
- Refresh token rotation with immediate revocation on reuse detection.
- `helmet` for secure HTTP headers.
- `express-rate-limit` to prevent brute force attacks.
- No secrets committed to source control.

## Future Improvements

- Add Redis caching for the product catalog.
- Introduce integration testing for the checkout webhook flows.
- Containerize the application via Docker for easier local development.

## License

This project is licensed under the MIT License.
