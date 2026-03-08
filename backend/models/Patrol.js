import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema({
    location: { // Geospatial coordinates of the check-in
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    timestamp: { type: Date, default: Date.now }, // When the check-in occurred
    note: { type: String }, // Optional ranger notes for this point
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone" } // Specific zone where check-in happened
});

const patrolSchema = new mongoose.Schema(
    {
        title: { // Descriptive title for the patrol
            type: String,
            trim: true
        },
        protectedAreaId: { // Protected area assigned for patrol
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProtectedArea",
            required: true
        },
        exactLocation: { // Primary target location or starting point
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        },
        zoneIds: [{ // List of zones to be covered during patrol
            type: mongoose.Schema.Types.ObjectId,
            ref: "Zone"
        }],
        plannedStart: { // Scheduled start time
            type: Date,
            required: true
        },
        plannedEnd: { // Scheduled completion time
            type: Date,
            required: true
        },
        assignedRangerIds: [{ // Rangers assigned to this mission
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }],
        status: { // Current lifecycle state of the patrol
            type: String,
            enum: ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "PLANNED"
        },
        checkIns: [checkInSchema], // Real-time progress updates from rangers
        notes: { // Overall patrol summary or concluding remarks
            type: String
        }
    },
    { timestamps: true }
);

const Patrol = mongoose.model("Patrol", patrolSchema);

export default Patrol;
