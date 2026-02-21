import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import Animal from '../models/Animal.js';
import Zone from '../models/Zone.model.js';
import Movement from '../models/Movement.js';
import ProtectedArea from '../models/ProtectedArea.model.js';
import Incident from '../models/Incident.model.js';
import User from '../models/User.js';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5001/api';
const INTERVAL_MS = 600000; // 10 minutes

async function connect() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for simulation.");
    }
}

async function getAnimals() {
    return await Animal.find({ status: 'ACTIVE' });
}

// Function to simulate slow, realistic movement
function getNextPosition(currentLat, currentLng, prevDelta) {
    const moveProb = 0.5;

    let dLat = (prevDelta?.dLat || 0) * 0.4;
    let dLng = (prevDelta?.dLng || 0) * 0.4;

    if (Math.random() < moveProb) {
        dLat += (Math.random() - 0.5) * 0.0006;
        dLng += (Math.random() - 0.5) * 0.0006;
    } else {
        dLat += (Math.random() - 0.5) * 0.0001;
        dLng += (Math.random() - 0.5) * 0.0001;
    }

    const limit = 0.0012;
    dLat = Math.max(-limit, Math.min(limit, dLat));
    dLng = Math.max(-limit, Math.min(limit, dLng));

    return {
        lat: currentLat + dLat,
        lng: currentLng + dLng,
        delta: { dLat, dLng }
    };
}

async function isPointInProtectedArea(lat, lng, paId) {
    const pa = await ProtectedArea.findOne({
        _id: paId,
        status: 'ACTIVE',
        geometry: {
            $geoIntersects: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            }
        }
    });
    return !!pa;
}

async function findCurrentZone(lat, lng, paId) {
    return await Zone.findOne({
        protectedAreaId: paId,
        status: 'ACTIVE',
        geometry: {
            $geoIntersects: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            }
        }
    });
}

async function getAreaCenter(id, model) {
    try {
        const area = await model.findById(id);
        if (!area || !area.geometry || !area.geometry.coordinates || !area.geometry.coordinates[0]) return null;

        const coords = area.geometry.coordinates[0];
        let latSum = 0, lngSum = 0;
        coords.forEach(p => {
            lngSum += p[0];
            latSum += p[1];
        });

        return {
            lat: latSum / coords.length,
            lng: lngSum / coords.length
        };
    } catch (error) {
        return null;
    }
}

// Dynamic Risk Detection: Checks incidents collection for recent high-severity events in the zone
async function getDynamicRiskSeverity(zone) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // First, check if the zone name itself implies a risk (manual override)
    const name = zone.name.toLowerCase();
    if (name.includes('critical')) return 'CRITICAL';
    if (name.includes('high risk')) return 'HIGH';

    // Query incidents collection for recent high-severity incidents in this zone
    const incidents = await Incident.find({
        zoneId: zone._id,
        isDeleted: false,
        incidentDate: { $gte: thirtyDaysAgo }
    }).select('severity');

    if (incidents.length === 0) {
        // Fallback to zone type if no incidents
        if (zone.zoneType === 'CORE') return 'HIGH';
        if (zone.zoneType === 'BUFFER') return 'MEDIUM';
        return 'LOW';
    }

    const hierarchy = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    let maxVal = 0;
    let maxSeverity = 'LOW';

    incidents.forEach(inc => {
        const val = hierarchy[inc.severity] || 0;
        if (val > maxVal) {
            maxVal = val;
            maxSeverity = inc.severity;
        }
    });

    return maxSeverity;
}

// Create an entry in the 'alerts' collection
async function sendAlert(animal, zone, lat, lng, severity) {
    try {
        const alert = new Alert({
            tagId: animal.tagId,
            zoneId: zone._id,
            protectedAreaId: animal.protectedAreaId,
            location: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            severity: severity,
            message: `IMMEDIATE ALERT: Animal ${animal.tagId} (${animal.species}) entered ${severity} RISK zone: ${zone.name}`,
            status: 'ACTIVE',
            timestamp: new Date()
        });

        await alert.save();
        console.log(`\n[ALERT SENT] Recorded ${severity} alert for Animal ${animal.tagId} in ${zone.name} (alerts collection)`);

        // Also create an incident for visibility in the incident logs
        let reporter = await User.findOne({ username: 'simulation_agent' });
        if (!reporter) {
            reporter = await User.create({
                username: 'simulation_agent',
                email: 'sim@lifeonland.io',
                password: 'simulated_pass',
                role: 'OFFICER',
                fullName: 'AI Simulation Agent',
                isActive: true
            });
        }

        const incident = new Incident({
            type: 'OTHER',
            description: `AUTO-ALERT: Animal ${animal.tagId} into ${severity} zone ${zone.name}`,
            location: { type: 'Point', coordinates: [lng, lat] },
            zoneId: zone._id,
            protectedAreaId: animal.protectedAreaId,
            severity: severity,
            reportedBy: reporter._id,
            incidentDate: new Date(),
            status: 'REPORTED'
        });
        await incident.save();

    } catch (err) {
        console.error(`Error sending alert:`, err.message);
    }
}

async function logMovement(data) {
    try {
        await axios.post(`${API_URL}/movements`, data);
    } catch (error) {
        // Silent
    }
}

async function startSimulation() {
    await connect();
    const animals = await getAnimals();

    if (animals.length === 0) {
        console.log("No active animals found. Simulation stopped.");
        process.exit(0);
    }

    console.log(`Simulating movement for ${animals.length} animals. Detecting risk from incidents...`);

    const states = new Map();

    for (const animal of animals) {
        const lastMove = await Movement.findOne({ tagId: animal.tagId }).sort({ timestamp: -1 });
        let initialLat, initialLng;

        if (lastMove) {
            initialLat = lastMove.lat;
            initialLng = lastMove.lng;
        } else {
            const center = await getAreaCenter(animal.zoneId || animal.protectedAreaId, animal.zoneId ? Zone : ProtectedArea);
            if (center) {
                initialLat = center.lat;
                initialLng = center.lng;
            }
        }

        states.set(animal.tagId, {
            lat: initialLat || 6.9271,
            lng: initialLng || 79.8612,
            delta: { dLat: 0, dLng: 0 },
            protectedAreaId: animal.protectedAreaId,
            lastZoneId: null,
            animalDoc: animal
        });
    }

    const runStep = async () => {
        const timestamp = new Date();
        process.stdout.write(`\n--- Tick: ${timestamp.toISOString()} --- `);

        for (const [tagId, state] of states.entries()) {
            let nextState = getNextPosition(state.lat, state.lng, state.delta);

            const inPA = await isPointInProtectedArea(nextState.lat, nextState.lng, state.protectedAreaId);
            if (!inPA) {
                const center = await getAreaCenter(state.protectedAreaId, ProtectedArea);
                if (center) {
                    nextState.lat = state.lat + (center.lat - state.lat) * 0.2;
                    nextState.lng = state.lng + (center.lng - state.lng) * 0.2;
                    nextState.delta = { dLat: (center.lat - state.lat) * 0.1, dLng: (center.lng - state.lng) * 0.1 };
                } else {
                    nextState = { ...state, delta: { dLat: 0, dLng: 0 } };
                }
            }

            const currentZone = await findCurrentZone(nextState.lat, nextState.lng, state.protectedAreaId);
            if (currentZone) {
                // Get risk severity dynamically by referring to incident collection and zone properties
                const severity = await getDynamicRiskSeverity(currentZone);

                if ((severity === 'HIGH' || severity === 'CRITICAL') && currentZone._id.toString() !== state.lastZoneId?.toString()) {
                    await sendAlert(state.animalDoc, currentZone, nextState.lat, nextState.lng, severity);
                }
                state.lastZoneId = currentZone._id;
            } else {
                state.lastZoneId = null;
            }

            states.set(tagId, { ...state, ...nextState });

            await logMovement({
                tagId,
                lat: nextState.lat,
                lng: nextState.lng,
                timestamp: timestamp.toISOString(),
                sourceType: 'SIMULATED'
            });

            process.stdout.write(`.`);
        }
    };

    await runStep();
    setInterval(runStep, INTERVAL_MS);
}

startSimulation().catch(err => {
    console.error("Simulation crashed:", err);
    process.exit(1);
});
