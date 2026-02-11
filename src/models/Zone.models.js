const mongoose = require("mongoose");

const ZoneSchema = new mongoose.Schema(
  {
    protectedAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProtectedArea",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    zoneType: {
      type: String,
      required: true,
      enum: ["CORE", "BUFFER", "EDGE", "CORRIDOR"],
    },
    areaSize: { type: Number, required: true, min: 0 },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DELETED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

ZoneSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Zone", ZoneSchema);
