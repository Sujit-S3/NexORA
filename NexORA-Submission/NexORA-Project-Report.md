# NexORA — Full Stack E-Commerce Platform
## Internship-Style Project Report

---

### 1. Executive Summary

NexORA is a next-generation, ultra-premium luxury e-commerce platform designed to provide a highly personalized shopping experience. Built with a decoupled architecture, it leverages a React/Vite SPA on the frontend and a robust Node.js/Express backend. The application integrates modern technologies, including a Gemini-powered AI Concierge for intelligent product recommendations and the Razorpay API for secure checkout flows. The system prioritizes security, scalability, and UX, making it a substantial, production-ready full-stack application.

### 2. Project Architecture

NexORA utilizes a modern client-server architecture:
- **Frontend (Client):** A Single Page Application (SPA) built using React 19 and Vite. It ensures lightning-fast client-side rendering, seamless routing via React Router v6, and state management using React Context API. The UI is designed with Tailwind CSS, customized for a "dark luxury" theme.
- **Backend (Server):** A RESTful Node.js and Express.js API, scaling horizontally with a MongoDB Atlas database.
- **Third-Party Integrations:**
  - **Google Gemini API:** Drives the AI Concierge subsystem, processing user intent and budget to stream intelligent recommendations.
  - **Cloudinary:** Used as a Content Delivery Network (CDN) to optimize and serve high-resolution media and product imagery.
  - **Razorpay:** Facilitates secure payment processing, including order creation, signature verification, and webhook reconciliation.
  - **Sentry:** For robust client and server error tracking.

### 3. Key Features and Technical Implementations

- **AI Concierge (Gemini-Powered):** A conversational interface that streams recommendations tailored to the user's explicit preferences, active cart context, and budget.
- **Robust Authentication System:** Implements JWT-based authentication with `httpOnly` cookies. The system features a secure refresh token rotation mechanism with reuse detection—replayed tokens immediately revoke the entire token family to mitigate session hijacking.
- **Dynamic Product Catalog & Sizing:** A scalable catalog implementation featuring categorized, dynamic dimension matrices explicitly built for luxury garments, footwear, and accessories.
- **Secure Checkout & Payments:** End-to-end integration with Razorpay. Payment verification is strictly handled on the server via signature verification and webhooks. No payment status is ever trusted solely from the client. Supports Guest Checkout for frictionless conversion.
- **Enterprise-Grade Admin Dashboard:** A comprehensive administrative interface featuring Recharts-powered analytics to track inventory, manage orders, and monitor revenue KPIs.
- **State Persistence:** Synchronized cross-session cart and wishlist states guarded by robust API validation.
- **Security Hardening:** The backend is protected using Helmet, express-rate-limit, express-mongo-sanitize, and CORS, ensuring protection against XSS, injection, and brute-force attacks.
- **Automated Testing & CI:** Code reliability is ensured via comprehensive testing:
  - Backend: Jest + Supertest with `mongodb-memory-server`.
  - Frontend: Vitest + React Testing Library.
  - CI Pipeline: GitHub Actions automatically runs linting and test suites on every push and PR.

### 4. Technology Stack Summary

**Frontend:** React 19, Vite, Tailwind CSS, React Context API, React Router v6, Framer Motion, Lucide React, Vitest, `@sentry/react`.  
**Backend:** Node.js, Express.js, MongoDB (Mongoose), `@google/genai` (Gemini), Razorpay, Cloudinary, Resend, JWT, Helmet, Jest.  
**Deployment:** Vercel (Frontend), Render.com (Backend).

### 5. Conclusion

NexORA stands as a comprehensive demonstration of full-stack engineering principles. It successfully synthesizes complex state management, third-party API integration, robust security practices, and AI-driven features into a cohesive, production-deployed platform.
