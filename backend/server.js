import { connectDB } from "./config/db.js"
import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"
import authRoutes from "./routes/auth.route.js"
import animalRoutes from "./routes/animal.route.js"
import protectedAreaRoutes from "./routes/protectedAreas.routes.js"
import zoneRoutes from "./routes/zones.routes.js"
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
// Animal routes
app.use("/api/animals", animalRoutes)
// Protected Area routes
app.use("/api/protected-areas", protectedAreaRoutes)
// Zone routes
app.use("/api/zones", zoneRoutes)


const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

