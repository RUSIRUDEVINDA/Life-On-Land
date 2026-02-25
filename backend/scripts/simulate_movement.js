import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import Animal from '../models/Animal.js';
import Zone from '../models/Zone.model.js';
import Movement from '../models/Movement.js';
import Incident from '../models/Incident.model.js';
import User from '../models/User.js';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5001/api';
const INTERVAL_MS = 600000; // 10 minutes

// ─── Maximum step size per tick ───────────────────────────────────────────────
// 0.00009 degrees ≈ ~10 metres. Keep animals slow and realistic.
const MAX_STEP = 0.00009;

async function connect() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for simulation.');
    }
}

async function getAnimals() {
    return await Animal.find({ status: 'ACTIVE' });
}

/**
 * Calculate the geometric centroid of a GeoJSON Polygon's outer ring.
 */
function getCentroid(polygonCoords) {
    const ring = polygonCoords[0];
    const pts = ring.slice(0, ring.length - 1); // drop closing duplicate
    let lngSum = 0, latSum = 0;
    pts.forEach(p => { lngSum += p[0]; latSum += p[1]; });
    return { lat: latSum / pts.length, lng: lngSum / pts.length };
}

/**
 * Find the zone the given coordinates fall inside (within the animal's PA only).
 */
async function findZoneAt(lat, lng, protectedAreaId) {
    return await Zone.findOne({
        protectedAreaId,
        status: 'ACTIVE',
        geometry: {
            $geoIntersects: {
                $geometry: { type: 'Point', coordinates: [lng, lat] }
            }
        }
    });
}

/**
 * Find any active zone in the PA and return its centroid.
 */
async function getZoneCentroidInPA(protectedAreaId, preferredZoneId) {
    // Prefer the animal's assigned zone, otherwise take any active zone in the PA
    let zone = preferredZoneId
        ? await Zone.findOne({ _id: preferredZoneId, status: 'ACTIVE' })
        : null;

    if (!zone) {
        zone = await Zone.findOne({ protectedAreaId, status: 'ACTIVE' });
    }
    if (!zone) return null;

    return { centroid: getCentroid(zone.geometry.coordinates), zone };
}

/**
 * Small random jitter within [-MAX_STEP, +MAX_STEP].
 */
function jitter() {
    return (Math.random() - 0.5) * 2 * MAX_STEP;
}

/**
 * Compute next position strictly inside a zone.
 * Tries random steps first; on repeated failure, walks toward zone centroid.
 */
async function computeStrictNextPos(state) {
    const { lat, lng, protectedAreaId, animalDoc } = state;

    // Try up to 8 random micro-steps first
    for (let attempt = 0; attempt < 8; attempt++) {
        const candidateLat = lat + jitter();
        const candidateLng = lng + jitter();
        const zone = await findZoneAt(candidateLat, candidateLng, protectedAreaId);
        if (zone) {
            return { lat: candidateLat, lng: candidateLng, zone };
        }
    }

    // All random steps were outside zones → slide towards a zone centroid
    const fallback = await getZoneCentroidInPA(protectedAreaId, animalDoc.zoneId);
    if (!fallback) {
        // No zones at all in this PA — stay put
        const zone = await findZoneAt(lat, lng, protectedAreaId);
        return { lat, lng, zone };
    }

    const { centroid, zone: targetZone } = fallback;
    // Take 20% of the distance toward centroid (slow drift)
    const candidateLat = lat + (centroid.lat - lat) * 0.2;
    const candidateLng = lng + (centroid.lng - lng) * 0.2;

    // Verify corrected position is inside a zone
    const verifiedZone = await findZoneAt(candidateLat, candidateLng, protectedAreaId)
        || targetZone; // if centroid itself is inside, use it

    return { lat: candidateLat, lng: candidateLng, zone: verifiedZone };
}

// ─── Dynamic Risk Detection ────────────────────────────────────────────────────
async function getDynamicRiskSeverity(zone) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const name = zone.name.toLowerCase();
    if (name.includes('critical')) return 'CRITICAL';
    if (name.includes('high risk')) return 'HIGH';

    const incidents = await Incident.find({
        zoneId: zone._id,
        isDeleted: false,
        incidentDate: { $gte: thirtyDaysAgo }
    }).select('severity');

    if (incidents.length === 0) {
        if (zone.zoneType === 'CORE') return 'HIGH';
        if (zone.zoneType === 'BUFFER') return 'MEDIUM';
        return 'LOW';
    }

    const hierarchy = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    let maxSeverity = 'LOW', maxVal = 0;
    incidents.forEach(inc => {
        const val = hierarchy[inc.severity] || 0;
        if (val > maxVal) { maxVal = val; maxSeverity = inc.severity; }
    });
    return maxSeverity;
}


// ─── Save movement directly to MongoDB ────────────────────────────────────────
async function logMovement(data) {
    try {
        await Movement.create(data);
    } catch (err) {
        console.error(`Movement save error for ${data.tagId}:`, err.message);
    }
}

// ─── Main simulation ───────────────────────────────────────────────────────────
async function startSimulation() {
    await connect();
    const animals = await getAnimals();

    if (animals.length === 0) {
        console.log('No active animals found. Simulation stopped.');
        process.exit(0);
    }

    console.log(`Starting strict-zone simulation for ${animals.length} animals.\n`);

    // Build initial state for each animal
    const states = new Map();

    for (const animal of animals) {
        // Try to resume from the last recorded movement
        const lastMove = await Movement.findOne({ tagId: animal.tagId }).sort({ timestamp: -1 });
        let initialLat, initialLng, initialZone;

        if (lastMove && lastMove.lat && lastMove.lng) {
            // Validate that the last position is still inside a zone
            const zoneCheck = await findZoneAt(lastMove.lat, lastMove.lng, animal.protectedAreaId);
            if (zoneCheck) {
                initialLat = lastMove.lat;
                initialLng = lastMove.lng;
                initialZone = zoneCheck;
            }
        }

        if (!initialLat) {
            // Fall back to assigned zone centroid
            const fallback = await getZoneCentroidInPA(animal.protectedAreaId, animal.zoneId);
            if (fallback) {
                initialLat = fallback.centroid.lat;
                initialLng = fallback.centroid.lng;
                initialZone = fallback.zone;
            } else {
                console.warn(`[SKIP] ${animal.tagId}: no active zones found in PA.`);
                continue;
            }
        }

        states.set(animal.tagId, {
            lat: initialLat,
            lng: initialLng,
            currentZone: initialZone,
            // Pre-seed lastAlertZoneId with starting zone so startup in a CORE zone
            // does NOT fire a false alert — only ENTERING a new zone triggers one.
            lastAlertZoneId: initialZone?._id ?? null,
            protectedAreaId: animal.protectedAreaId,
            animalDoc: animal,
        });

        console.log(`  ${animal.tagId} → starts in zone "${initialZone.name}" (${initialLat.toFixed(5)}, ${initialLng.toFixed(5)})`);
    }

    const runStep = async () => {
        const timestamp = new Date();
        process.stdout.write(`\n--- Tick: ${timestamp.toISOString()} ---`);

        for (const [tagId, state] of states.entries()) {
            // Compute the next position guaranteed to be inside a zone
            const { lat, lng, zone } = await computeStrictNextPos(state);

            // Update state
            state.lat = lat;
            state.lng = lng;
            state.currentZone = zone;
            states.set(tagId, state);

            // Track zone entry to log transitions (alerting is handled by model middleware)
            if (zone) {
                const isNewZone = zone._id.toString() !== state.lastAlertZoneId?.toString();
                if (isNewZone) {
                    state.lastAlertZoneId = zone._id;
                }
            }

            // Save movement directly to MongoDB
            await logMovement({
                tagId,
                lat,
                lng,
                timestamp: timestamp,
                sourceType: 'SIMULATED',
                zoneId: zone?._id,
                protectedAreaId: state.protectedAreaId,
            });

            process.stdout.write(` ${tagId}✓`);
        }
    };

    await runStep();
    setInterval(runStep, INTERVAL_MS);
}

startSimulation().catch(err => {
    console.error('Simulation crashed:', err);
    process.exit(1);
});