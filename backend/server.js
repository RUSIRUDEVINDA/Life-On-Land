import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import database connection
import { connectDB } from "./src/config/db.js";

// Import routes
import authRoutes from "./src/routes/auth.route.js";
import areaRoutes from "./src/routes/protectedAreas.routes.js";
import zoneRoutes from "./src/routes/zones.routes.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to the database
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/zones", zoneRoutes);

// Root route (optional, for testing)
app.get("/", (req, res) => {
  res.send("API is running");
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
