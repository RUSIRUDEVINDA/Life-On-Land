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

    // Create lookups for faster access
    const zoneMap = new Map(allZones.map(z => [z._id.toString(), z]));
    const paMap = new Map(pas.map(p => [p._id.toString(), p]));

    const animals = await Animal.find({ status: 'ACTIVE' });
    console.log(`Found ${animals.length} active animals.\n`);

    for (const animal of animals) {
        const zone = zoneMap.get(animal.zoneId?.toString());
        const pa = paMap.get(animal.protectedAreaId?.toString());

        if (!zone || !zone.geometry?.coordinates?.length) {
            console.log(`  SKIPPING [${animal.tagId}] - Current zone not found or lacks geometry`);
            continue;
        }

        const centroid = getCentroid(zone.geometry.coordinates);

        // Seed lat/lng on the animal doc if those fields exist
        // Note: Coordinates are updated based on the animal's EXISTING zone assignment
        if ('lat' in animal.schema?.paths || animal.lat !== undefined) animal.lat = centroid.lat;
        if ('lng' in animal.schema?.paths || animal.lng !== undefined) animal.lng = centroid.lng;

        await animal.save();

        console.log(
            `  FIXED [${animal.tagId}] (${animal.species})\n` +
            `    → PA:   "${pa?.name || 'Unknown'}" (${animal.protectedAreaId})\n` +
            `    → Zone: "${zone.name}" [${zone.zoneType}] (${animal.zoneId})\n` +
            `    → Seed: (${centroid.lat.toFixed(6)}, ${centroid.lng.toFixed(6)})\n`
        );
    }

    console.log(`Done. Processed ${animals.length} animals.`);
    process.exit(0);
}

main().catch(err => {
    console.error('Script failed:', err.message);
    process.exit(1);
});