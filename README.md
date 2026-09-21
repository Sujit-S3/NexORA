# NexORA

**Computer Science & Systems Engineering Student | Full-Stack & AI Developer**

## 1. What the project is
NexORA is a modern luxury e-commerce platform that integrates a generative AI shopping concierge. It serves as a fully decoupled MERN application with a Vite/React frontend and a Node.js/Express backend. 

## 2. What problem it solves
Traditional e-commerce platforms often lack personalized, consultative shopping experiences, forcing users to rely on static filters and disjointed search bars. NexORA solves this by embedding an AI concierge (powered by Google Gemini) that understands natural language intent, budget constraints, and active cart context to stream personalized recommendations directly to the user, simulating a high-end personal shopper.

## 3. What I personally built
I built the entire application from the ground up, including:
- A responsive frontend SPA using React 19, Tailwind CSS, and Framer Motion.
- A RESTful Node.js/Express backend with robust authentication, role-based access control, and a MongoDB schema.
- The AI Service layer that interfaces with the Google Gemini API to extract user intent and generate contextual recommendations.
- A secure checkout pipeline integrated with Razorpay for payment processing and Cloudinary for media management.

## 4. Main features
- **AI Concierge (Gemini-Powered):** A shopping assistant that streams personalized luxury recommendations based on user intent.
- **Precision Sizing System:** Categorized dimension matrices built for luxury garments, footwear, and accessories.
- **Admin Dashboard:** Recharts-powered analytics for inventory tracking, order management, and revenue tracking.
- **Wishlist & Cart Persistence:** Synchronized cross-session cart states with API validation.
- **Guest Checkout:** Frictionless conversion pathways without mandatory registration walls.
- **Payments:** Razorpay integration with signature-verified order creation and webhook reconciliation.
- **Secure Authentication:** Refresh Token Rotation with silent session renewal and reuse detection.

## 5. Architecture
The application uses a decoupled architecture. The frontend communicates with the backend via REST and Server-Sent Events (SSE) for streaming the AI responses.
```mermaid
graph TD
    Client[Client Browser (Vite/React)] -->|REST & SSE| API[Node.js / Express API]
    API --> DB[(MongoDB Atlas)]
    API --> Gemini[Google Gemini API]
    API --> Cloudinary[Cloudinary Media CDN]

    subgraph "AI Subsystem"
        Gemini --> Memory[Recommendation Memory]
    end

    subgraph "Auth Subsystem"
        API --> Auth[JWT & Bcrypt]
    end
```

## 6. Technology stack
- **Frontend:** React 19, Vite, Tailwind CSS, React Router v6, Framer Motion, Recharts
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **AI Integration:** Google Gemini (`@google/genai`)
- **Payments:** Razorpay
- **Security:** Helmet, express-rate-limit, express-mongo-sanitize, CORS, JWT (httpOnly cookies)
- **Media:** Cloudinary SDK
- **Testing:** Jest, Supertest, Vitest, React Testing Library

## 7. Demo
[Live Demo URL](https://nex-ora-jade.vercel.app)

## 8. Screenshots
*(Add screenshots of the AI Concierge, Admin Dashboard, and Product pages here)*

## 9. Installation
```bash
git clone https://github.com/Sujit-S3/NexORA.git
cd NexORA

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

## 10. Environment variables
**Backend (`server/.env`)**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/nexora
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend (`client/.env`)**
```env
VITE_API_URL=http://localhost:5000/api
```

## 11. Testing
```bash
# Server tests (Jest + Supertest)
cd server
npm test

# Client tests (Vitest + RTL)
cd client
npm test
```

## 12. Deployment
- **Backend:** Can be deployed to Render, Railway, or AWS. Set the build command to `npm install` and start command to `npm start` in the `server` directory. Ensure all backend `.env` variables are supplied.
- **Frontend:** Can be deployed to Vercel. Set the root directory to `client` and supply the `VITE_API_URL`.
