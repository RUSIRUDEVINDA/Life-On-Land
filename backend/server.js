import { connectDB } from "./config/db.js"
import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"
import authRoutes from "./routes/auth.route.js"
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

const PORT = process.env.PORT || 5001 
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

