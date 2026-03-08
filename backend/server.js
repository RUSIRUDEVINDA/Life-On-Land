import express from "express"
import { connectDB } from "./config/db.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import authRoutes from "./routes/auth.route.js"
import patrolRoutes from "./routes/patrol.route.js"
import incidentRoutes from "./routes/incident.route.js"
import alertRoutes from "./routes/alert.route.js"
import riskRoutes from "./routes/risk.route.js"
import animalRoutes from "./routes/animal.route.js"
import protectedAreaRoutes from "./routes/protectedAreas.route.js"
import zoneRoutes from "./routes/zones.route.js"
import movementRoutes from "./routes/movement.route.js"
import userRoutes from "./routes/user.route.js"
import { notFound, errorHandler } from "./middleware/error.middleware.js"
import dotenv from "dotenv"

dotenv.config()

const app = express()
connectDB()

// Enable CORS for all routes
app.use(cors())
// Middleware to parse JSON bodies
app.use(express.json())
// Middleware to parse cookies
app.use(cookieParser());

// Auth routes
app.use("/api/auth", authRoutes)
// Protected area routes

// Patrol routes
app.use("/api/patrols", patrolRoutes)
// Alert routes
app.use("/api/alerts", alertRoutes)
// Incident routes
app.use("/api/incidents", incidentRoutes)
// Risk map routes
app.use("/api/risk-map", riskRoutes)
// Animal routes
app.use("/api/animals", animalRoutes)
// Movement routes
app.use("/api/movements", movementRoutes)
// User management routes
app.use("/api/users", userRoutes)
// Protected Area routes
app.use("/api/protected-areas", protectedAreaRoutes)
// Zone routes
app.use("/api/zones", zoneRoutes)

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})