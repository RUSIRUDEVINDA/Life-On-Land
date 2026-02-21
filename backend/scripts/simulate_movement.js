import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import Animal from '../models/Animal.js';
import Zone from '../models/Zone.models.js';
import Movement from '../models/Movement.js';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5001/api';
const INTERVAL_MS = 600000; // 10 minutes (60,000ms * 10) 

async function connect() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for simulation.");
    }
}

async function getAnimals() {
    return await Animal.find({ status: 'ACTIVE' });
}

// Function to simulate realistic movement
function getNextPosition(currentLat, currentLng, prevDelta) {
    // Mostly stay put or move slowly
    const moveProb = 0.3; // 30% chance of significant movement

    let dLat = (prevDelta?.dLat || 0) * 0.7; // Momentum
    let dLng = (prevDelta?.dLng || 0) * 0.7;

    if (Math.random() < moveProb) {
        // Add some random variation
        dLat += (Math.random() - 0.5) * 0.0005;
        dLng += (Math.random() - 0.5) * 0.0005;
    } else {
        // Small drift
        dLat += (Math.random() - 0.5) * 0.0001;
        dLng += (Math.random() - 0.5) * 0.0001;
    }

    // Cap the movement speed (realistic for animals)
    const limit = 0.002;
    dLat = Math.max(-limit, Math.min(limit, dLat));
    dLng = Math.max(-limit, Math.min(limit, dLng));

    return {
        lat: currentLat + dLat,
        lng: currentLng + dLng,
        delta: { dLat, dLng }
    };
}

async function checkRiskZone(lat, lng) {
    // Geo-spatial query to find the zone
    // This fetches from DB as requested
    return await Zone.findOne({
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

async function logMovement(data) {
    try {
        const response = await axios.post(`${API_URL}/movements`, data);
        return response.data;
    } catch (error) {
        // If API is not running, we'll just log to console
        if (error.code === 'ECONNREFUSED') {
            console.warn(`[WARN] API is not reachable at ${API_URL}. Is the server running?`);
        } else {
            console.error(`[ERROR] Failed to log movement for ${data.tagId}:`, error.response?.data || error.message);
        }
    }
}

async function startSimulation() {
    await connect();
    const animals = await getAnimals();

    if (animals.length === 0) {
        console.log("No active animals found to simulate. Please add some animals to the database first.");
        process.exit(0);
    }

    console.log(`Simulating movement for ${animals.length} animals...`);

    const states = new Map();

    // Initialize states
    for (const animal of animals) {
        // Try to get last known position from DB
        const lastMove = await Movement.findOne({ tagId: animal.tagId }).sort({ timestamp: -1 });

        let initialLat = 6.9271; // Default Sri Lanka starting point if no history
        let initialLng = 79.8612;

        if (lastMove) {
            initialLat = lastMove.lat;
            initialLng = lastMove.lng;
        }

        states.set(animal.tagId, {
            lat: initialLat,
            lng: initialLng,
            delta: { dLat: 0, dLng: 0 }
        });
    }

    const runStep = async () => {
        const timestamp = new Date();
        console.log(`\n--- Tick: ${timestamp.toISOString()} ---`);

        // We use a simple loop, but in production with many animals we'd use Promise.all or worker threads
        for (const [tagId, state] of states.entries()) {
            const nextState = getNextPosition(state.lat, state.lng, state.delta);
            states.set(tagId, nextState);

            // Check risk zone
            const zone = await checkRiskZone(nextState.lat, nextState.lng);

            if (zone) {
                console.log(`[ALERT] Animal ${tagId} entered/remaining in zone: ${zone.name} (${zone.zoneType})`);
            }

            // Log to API
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

    // Run first step immediately
    await runStep();

    // Schedule subsequent steps
    setInterval(runStep, INTERVAL_MS);
}

startSimulation().catch(err => {
    console.error("Simulation crashed:", err);
    process.exit(1);
});
