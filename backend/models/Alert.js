import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["INCIDENT", "MOVEMENT"],
            required: true,
            index: true
        },
        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM",
            index: true
        },
        status: {
            type: String,
            enum: ["NEW", "ACKNOWLEDGED", "RESOLVED"],
            default: "NEW",
            index: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        protectedAreaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProtectedArea",
            index: true
        },
        zoneId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Zone",
            index: true
        },
        zoneName: {
            type: String
        },
        protectedAreaName: {
            type: String
        },
        patrolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patrol",
            index: true
        }
    },
    { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
