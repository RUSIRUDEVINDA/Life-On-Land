import request from 'supertest';
import app from '../../server.js';

export const seedAreaAndZone = async (adminToken) => {
    let areaId, zoneId;

    // Create Protected Area
    const areaRes = await request(app)
        .post('/api/protected-areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            name: `Test Area ${Date.now()}`,
            type: "NATIONAL_PARK",
            district: "Test District",
            areaSize: 1000,
            geometry: {
                type: "Polygon",
                coordinates: [[[80, 6], [81, 6], [81, 7], [80, 7], [80, 6]]]
            }
        });

    areaId = areaRes.body.data?._id || areaRes.body._id;

    if (!areaId) {
        throw new Error(`Failed to create Protected Area: ${JSON.stringify(areaRes.body)}`);
    }

    // Create Zone
    const zoneRes = await request(app)
        .post(`/api/protected-areas/${areaId}/zones`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            name: `Test Zone ${Date.now()}`,
            zoneType: "CORE",
            areaSize: 500,
            geometry: {
                type: "Polygon",
                coordinates: [[[80.1, 6.1], [80.9, 6.1], [80.9, 6.9], [80.1, 6.9], [80.1, 6.1]]]
            }
        });

    zoneId = zoneRes.body.data?._id || zoneRes.body._id;

    if (!zoneId) {
        throw new Error(`Failed to create Zone: ${JSON.stringify(zoneRes.body)}`);
    }

    return { areaId, zoneId };
};
