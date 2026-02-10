const express = require("express");
const protectedAreasRoutes = require("./routes/protectedAreas.routes");
const zonesRoutes = require("./routes/zones.routes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use("/api/protected-areas", protectedAreasRoutes);
app.use("/api/zones", zonesRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
