import mongoose from "mongoose";

const movementSchema = new mongoose.Schema(
    {
        tagId: {
            type: String,
            required: true,
            index: true,
            trim: true
        },
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
        },
        speed: {
            type: Number
        },
        sourceType: {
            type: String,
            enum: ["GPS", "SIMULATED", "MANUAL"],
            default: "GPS"
        },
        zoneId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Zone",
            index: true
        },
        protectedAreaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProtectedArea",
            index: true
        }
    },
    { timestamps: true }
);

movementSchema.index({ lat: 1, lng: 1 });
movementSchema.index({ timestamp: -1 });

// TTL Index: Automatically delete documents 24 hours (86400 seconds) after their 'timestamp'
movementSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

const Movement = mongoose.model("Movement", movementSchema);

export default Movement;
