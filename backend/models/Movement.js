import mongoose from "mongoose";

/**
 * @desc    Animal Movement Schema - High frequency telemetry data
 */
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
            enum: ["GPS", "SIMULATED"],
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

// Performance indices
movementSchema.index({ lat: 1, lng: 1 }); // Geospatial proximity
movementSchema.index({ timestamp: -1 }); // Fast chronological sorting

// TTL Index: Automatically delete documents 24 hours (86400 seconds) after their 'timestamp'
movementSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

// Alert trigger middleware
movementSchema.post('save', async function (doc) {
    try {
        const Zone = mongoose.model('Zone');
        const zone = await Zone.findById(doc.zoneId);

        // Trigger alert for high-risk zones (CORE or containing "risk" in name)
        if (zone && (zone.zoneType === "CORE" || zone.name.toLowerCase().includes("risk"))) {
            const { triggerMovementAlert } = await import("../services/alert.service.js");
            await triggerMovementAlert(doc, zone);
        }
    } catch (error) {
        console.error("Failed to trigger movement alert from middleware:", error);
    }
});

const Movement = mongoose.model("Movement", movementSchema);

export default Movement;