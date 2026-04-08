import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Animal from '../models/Animal.js';
import Zone from '../models/Zone.model.js';
import ProtectedArea from '../models/ProtectedArea.model.js';

dotenv.config({ path: './.env' });

/**
 * Returns { lat, lng } centroid for a GeoJSON Polygon.
 */
function getCentroid(polygonCoords) {
    const ring = polygonCoords[0].slice(0, -1); // drop closing duplicate
    let lngSum = 0, latSum = 0;
    ring.forEach(p => { lngSum += p[0]; latSum += p[1]; });
    return { lat: latSum / ring.length, lng: lngSum / ring.length };
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.\n');

    // Fetch all real Protected Areas
    const pas = await ProtectedArea.find({}).lean();
    if (pas.length === 0) {
        console.error('No Protected Areas found in database. Abort.');
        process.exit(1);
    }

    // Fetch all active zones grouped by PA
    const allZones = await Zone.find({ status: 'ACTIVE' }).lean();
    const zonesByPA = {};
    for (const z of allZones) {
        const paKey = z.protectedAreaId.toString();
        if (!zonesByPA[paKey]) zonesByPA[paKey] = [];
        zonesByPA[paKey].push(z);
    }

    // Build ordered list of (pa, zone) pairs — one entry per zone, cycling all zones in each PA
    const assignments = [];
    for (const pa of pas) {
        const zones = (zonesByPA[pa._id.toString()] || []).filter(z => z.geometry?.coordinates?.length);
        for (const zone of zones) {
            assignments.push({ pa, zone });
        }
    }

    if (assignments.length === 0) {
        console.error('No zones with geometry found. Abort.');
        process.exit(1);
    }

    const animals = await Animal.find({ status: 'ACTIVE' });
    console.log(`Found ${animals.length} active animals, ${assignments.length} PA-zone slots.\n`);

    let cycleIdx = 0;
    for (const animal of animals) {
        let targetPA, targetZone;

        // If animal already has a registered PA, try to find a zone within it
        if (animal.protectedAreaId) {
            const paIdStr = animal.protectedAreaId.toString();
            const localZones = (zonesByPA[paIdStr] || []).filter(z => z.geometry?.coordinates?.length);
            
            if (localZones.length > 0) {
                targetPA = pas.find(p => p._id.toString() === paIdStr);
                // Assign a random or next available zone in this PA (cycle within local list)
                targetZone = localZones[cycleIdx % localZones.length];
            }
        }

        // Fallback: Use the global cycle if no PA or no zones in that PA
        if (!targetZone) {
            const assignment = assignments[cycleIdx % assignments.length];
            targetPA = assignment.pa;
            targetZone = assignment.zone;
        }

        cycleIdx++;
        const { pa, zone } = { pa: targetPA, zone: targetZone };

        const centroid = getCentroid(zone.geometry.coordinates);

        // Update the animal's PA and zone references
        animal.protectedAreaId = pa._id;
        animal.protectedAreaName = pa.name; // Also update name for consistency
        animal.zoneId = zone._id;
        animal.zoneName = zone.name;

        // Seed lat/lng on the animal doc if those fields exist
        if ((animal.schema?.paths && 'lat' in animal.schema.paths) || animal.lat !== undefined) animal.lat = centroid.lat;
        if ((animal.schema?.paths && 'lng' in animal.schema.paths) || animal.lng !== undefined) animal.lng = centroid.lng;

        await animal.save();

        console.log(
            `  FIXED [${animal.tagId}] (${animal.species})\n` +
            `    → PA:   "${pa.name}" (${pa._id})\n` +
            `    → Zone: "${zone.name}" [${zone.zoneType}] (${zone._id})\n` +
            `    → Seed: (${centroid.lat.toFixed(6)}, ${centroid.lng.toFixed(6)})\n`
        );
    }

    console.log(`Done. ${animals.length} animals updated.`);
    process.exit(0);
}

main().catch(err => {
    console.error('Script failed:', err.message);
    process.exit(1);
});
