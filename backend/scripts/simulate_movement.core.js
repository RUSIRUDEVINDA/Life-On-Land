import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Animal from '../models/Animal.js';
import Zone from '../models/Zone.model.js';
import Movement from '../models/Movement.js';

dotenv.config();

const INTERVAL_MS = 600000; // 10 minutes

// Maximum step size per tick.
// 0.00009 degrees ~= ~10 metres. Keep animals slow and realistic.
const MAX_STEP = 0.00009;

async function connect() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for simulation.');
    }
}

async function disconnect() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
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
    let lngSum = 0;
    let latSum = 0;
    pts.forEach((p) => {
        lngSum += p[0];
        latSum += p[1];
    });
    return { lat: latSum / pts.length, lng: lngSum / pts.length };
}

/**
 * Find the assigned active zone and ensure it belongs to the animal's PA.
 */
async function getAssignedZone(protectedAreaId, zoneId) {
    if (!zoneId) {
        return null;
    }

    return await Zone.findOne({
        _id: zoneId,
        protectedAreaId,
        status: 'ACTIVE'
    });
}

/**
 * Find whether the given coordinates are inside the animal's assigned zone.
 */
async function findAssignedZoneAt(lat, lng, protectedAreaId, zoneId) {
    return await Zone.findOne({
        _id: zoneId,
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
 * Return the centroid of the animal's assigned active zone.
 */
async function getAssignedZoneCentroid(protectedAreaId, zoneId) {
    const zone = await getAssignedZone(protectedAreaId, zoneId);
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
        const zone = await findAssignedZoneAt(candidateLat, candidateLng, protectedAreaId, animalDoc.zoneId);
        if (zone) {
            return { lat: candidateLat, lng: candidateLng, zone };
        }
    }

    // All random steps were outside the assigned zone -> slide toward that zone centroid
    const fallback = await getAssignedZoneCentroid(protectedAreaId, animalDoc.zoneId);
    if (!fallback) {
        // Assigned zone is missing or inactive -> stay put
        const zone = await findAssignedZoneAt(lat, lng, protectedAreaId, animalDoc.zoneId);
        return { lat, lng, zone };
    }

    const { centroid, zone: targetZone } = fallback;
    // Take 20% of the distance toward centroid (slow drift)
    const candidateLat = lat + (centroid.lat - lat) * 0.2;
    const candidateLng = lng + (centroid.lng - lng) * 0.2;

    // Verify corrected position is inside a zone
    const verifiedZone = await findAssignedZoneAt(candidateLat, candidateLng, protectedAreaId, animalDoc.zoneId)
        || targetZone; // if centroid itself is inside, use it

    return { lat: candidateLat, lng: candidateLng, zone: verifiedZone };
}

async function logMovement(data) {
    try {
        await Movement.create(data);
    } catch (err) {
        console.error(`Movement save error for ${data.tagId}:`, err.message);
    }
}

async function buildStates() {
    const animals = await getAnimals();

    if (animals.length === 0) {
        console.log('No active animals found. Simulation stopped.');
        return new Map();
    }

    console.log(`Starting strict-zone simulation for ${animals.length} animals.\n`);

    const states = new Map();

    for (const animal of animals) {
        // Try to resume from the last recorded movement
        const lastMove = await Movement.findOne({ tagId: animal.tagId }).sort({ timestamp: -1 });
        let initialLat;
        let initialLng;
        let initialZone;

        if (lastMove && lastMove.lat && lastMove.lng) {
            // Validate that the last position is still inside a zone
            const zoneCheck = await findAssignedZoneAt(lastMove.lat, lastMove.lng, animal.protectedAreaId, animal.zoneId);
            if (zoneCheck) {
                initialLat = lastMove.lat;
                initialLng = lastMove.lng;
                initialZone = zoneCheck;
            }
        }

        if (!initialLat) {
            // Fall back to assigned zone centroid
            const fallback = await getAssignedZoneCentroid(animal.protectedAreaId, animal.zoneId);
            if (fallback) {
                initialLat = fallback.centroid.lat;
                initialLng = fallback.centroid.lng;
                initialZone = fallback.zone;
            } else {
                console.warn(`[SKIP] ${animal.tagId}: assigned zone is missing or inactive for this protected area.`);
                continue;
            }
        }

        states.set(animal.tagId, {
            lat: initialLat,
            lng: initialLng,
            currentZone: initialZone,
            // Pre-seed lastAlertZoneId with starting zone so startup in a CORE zone
            // does NOT fire a false alert - only ENTERING a new zone triggers one.
            lastAlertZoneId: initialZone?._id ?? null,
            protectedAreaId: animal.protectedAreaId,
            animalDoc: animal,
        });

        console.log(`  ${animal.tagId} -> starts in zone "${initialZone.name}" (${initialLat.toFixed(5)}, ${initialLng.toFixed(5)})`);
    }

    return states;
}

export async function runSimulationStep(states) {
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
            timestamp,
            sourceType: 'SIMULATED',
            zoneId: zone?._id,
            protectedAreaId: state.protectedAreaId,
        });

        process.stdout.write(` ${tagId} ✓`);
    }

    process.stdout.write('\n');
}

export async function startContinuousSimulation() {
    await connect();
    const states = await buildStates();

    if (states.size === 0) {
        process.exit(0);
    }

    await runSimulationStep(states);
    setInterval(() => {
        runSimulationStep(states).catch((err) => {
            console.error('Simulation tick failed:', err);
        });
    }, INTERVAL_MS);
}

export async function runSingleSimulationTick() {
    await connect();

    try {
        const states = await buildStates();
        if (states.size === 0) {
            return;
        }

        await runSimulationStep(states);
    } finally {
        await disconnect();
    }
}