import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
    {
        type: { // Type of alert: INCIDENT or MOVEMENT
            type: String,
            enum: ["INCIDENT", "MOVEMENT"],
            required: true,
            index: true
        },
        severity: { // Alert severity level
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM",
            index: true
        },
        status: { // Current processing state of the alert
            type: String,
            enum: ["NEW", "ACKNOWLEDGED", "RESOLVED"],
            default: "NEW",
            index: true
        },
        description: { // Detailed alert message
            type: String,
            required: true,
            trim: true
        },
        relatedId: { // Reference to the source incident or movement record
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        protectedAreaId: { // Reference to the protected area where the alert occurred
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProtectedArea",
            index: true
        },
        zoneId: { // Reference to the specific zone involved
            type: mongoose.Schema.Types.ObjectId,
            ref: "Zone",
            index: true
        },
        zoneName: { // Human-readable name of the zone
            type: String
        },
        protectedAreaName: { // Human-readable name of the protected area
            type: String
        },
        patrolId: { // Reference to a patrol assigned to handle this alert
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patrol",
            index: true
        }
    },
    { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
