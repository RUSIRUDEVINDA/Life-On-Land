import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema({
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone" }
});

const patrolSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true
        },
        protectedAreaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProtectedArea",
            required: true
        },
        exactLocation: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        },
        zoneIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Zone"
        }],
        plannedStart: {
            type: Date,
            required: true
        },
        plannedEnd: {
            type: Date,
            required: true
        },
        assignedRangerIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }],
        status: {
            type: String,
            enum: ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "PLANNED"
        },
        checkIns: [checkInSchema],
        notes: {
            type: String
        }
    },
    { timestamps: true }
);

const Patrol = mongoose.model("Patrol", patrolSchema);

export default Patrol;
