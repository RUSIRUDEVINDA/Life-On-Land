import mongoose from "mongoose";

const ProtectedAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["NATIONAL_PARK", "FOREST_RESERVE", "SAFARI_AREA"],
    },
    district: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
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

ProtectedAreaSchema.index({ geometry: "2dsphere" });

export default mongoose.model("ProtectedArea", ProtectedAreaSchema);
