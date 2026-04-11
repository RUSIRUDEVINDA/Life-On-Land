import '../helpers/testEnv.js';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { connect, closeDatabase } from '../helpers/testDb.js';
import { getToken } from '../helpers/authHealper.js';

let adminToken;
let rangerToken;

beforeAll(async () => {
    await connect();
    ({ token: adminToken } = await getToken('ADMIN'));
    ({ token: rangerToken } = await getToken('RANGER'));
});

afterAll(async () => await closeDatabase());

const createProtectedArea = async (token, suffix = Date.now()) => {
    const res = await request(app)
        .post('/api/protected-areas')
        .set('Authorization', `Bearer ${token}`)
        .send({
            name: `Test Area ${suffix}`,
            type: 'NATIONAL_PARK',
            district: 'Test District',
            areaSize: 1000,
            geometry: {
                type: 'Polygon',
                coordinates: [[[80, 6], [81, 6], [81, 7], [80, 7], [80, 6]]],
            },
        });

    return res;
};

const createZone = async (token, areaId, suffix = Date.now()) => {
    const res = await request(app)
        .post(`/api/protected-areas/${areaId}/zones`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            name: `Test Zone ${suffix}`,
            zoneType: 'CORE',
            areaSize: 500,
            geometry: {
                type: 'Polygon',
                coordinates: [[[80.1, 6.1], [80.9, 6.1], [80.9, 6.9], [80.1, 6.9], [80.1, 6.1]]],
            },
        });

    return res;
};

describe('Protected areas API', () => {
    it('returns the protected area collection', async () => {
        const res = await request(app).get('/api/protected-areas');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('lets ADMIN create a protected area', async () => {
        const res = await createProtectedArea(adminToken, 'admin-create');

        expect(res.statusCode).toBe(201);
        expect(res.body.data.name).toBe('Test Area admin-create');
        expect(res.body.data.status).toBe('ACTIVE');
    });

    it('blocks non-admin protected area creation', async () => {
        const res = await createProtectedArea(rangerToken, 'ranger-create');

        expect(res.statusCode).toBe(403);
    });

    it('rejects invalid protected area payloads', async () => {
        const res = await request(app)
            .post('/api/protected-areas')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Bad Area',
                type: 'CITY_PARK',
                district: 'Test District',
                areaSize: -1,
                geometry: {
                    type: 'Point',
                    coordinates: [80, 6],
                },
            });

        expect(res.statusCode).toBe(400);
    });

    it('returns a protected area by ID and supports update/delete', async () => {
        const createRes = await createProtectedArea(adminToken, 'lifecycle');
        const areaId = createRes.body.data._id;

        const getRes = await request(app).get(`/api/protected-areas/${areaId}`);
        expect(getRes.statusCode).toBe(200);

        const updateRes = await request(app)
            .put(`/api/protected-areas/${areaId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                type: 'FOREST_RESERVE',
                areaSize: 1200,
            });

        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.data.type).toBe('FOREST_RESERVE');

        const deleteRes = await request(app)
            .delete(`/api/protected-areas/${areaId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.statusCode).toBe(200);

        const afterDeleteRes = await request(app).get(`/api/protected-areas/${areaId}`);
        expect(afterDeleteRes.statusCode).toBe(404);
    });

    it('rejects invalid protected area ids', async () => {
        const res = await request(app).get('/api/protected-areas/not-a-valid-id');

        expect(res.statusCode).toBe(400);
    });
});

describe('Zones API', () => {
    it('lists zones for an active protected area', async () => {
        const areaRes = await createProtectedArea(adminToken, 'zones-list');
        const areaId = areaRes.body.data._id;

        await createZone(adminToken, areaId, 'zones-list-1');

        const res = await request(app).get(`/api/protected-areas/${areaId}/zones`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('lets ADMIN create, update, and delete a zone', async () => {
        const areaRes = await createProtectedArea(adminToken, 'zone-lifecycle');
        const areaId = areaRes.body.data._id;

        const createRes = await createZone(adminToken, areaId, 'zone-lifecycle');
        const zoneId = createRes.body.data._id;

        expect(createRes.statusCode).toBe(201);
        expect(createRes.body.data.protectedAreaId).toBe(areaId);
        expect(createRes.body.data.status).toBe('ACTIVE');

        const updateRes = await request(app)
            .put(`/api/zones/${zoneId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                zoneType: 'BUFFER',
                areaSize: 525,
            });

        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.data.zoneType).toBe('BUFFER');

        const deleteRes = await request(app)
            .delete(`/api/zones/${zoneId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.statusCode).toBe(200);
    });

    it('blocks non-admin zone creation', async () => {
        const areaRes = await createProtectedArea(adminToken, 'zone-ranger');
        const areaId = areaRes.body.data._id;

        const res = await createZone(rangerToken, areaId, 'zone-ranger');

        expect(res.statusCode).toBe(403);
    });

    it('rejects invalid zone payloads', async () => {
        const areaRes = await createProtectedArea(adminToken, 'zone-invalid');
        const areaId = areaRes.body.data._id;

        const res = await request(app)
            .post(`/api/protected-areas/${areaId}/zones`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Bad Zone',
                zoneType: 'HABITAT',
                areaSize: 0,
                geometry: {
                    type: 'Point',
                    coordinates: [80, 6],
                },
            });

        expect(res.statusCode).toBe(400);
    });

    it('returns 404 when the protected area does not exist', async () => {
        const missingAreaId = new mongoose.Types.ObjectId().toString();

        const listRes = await request(app).get(`/api/protected-areas/${missingAreaId}/zones`);
        expect(listRes.statusCode).toBe(404);

        const createRes = await createZone(adminToken, missingAreaId, 'missing-area');
        expect(createRes.statusCode).toBe(404);
    });

    it('removes zones when a protected area is deleted', async () => {
        const areaRes = await createProtectedArea(adminToken, 'cascade');
        const areaId = areaRes.body.data._id;

        await createZone(adminToken, areaId, 'cascade-zone');

        const deleteRes = await request(app)
            .delete(`/api/protected-areas/${areaId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.statusCode).toBe(200);

        const zoneListRes = await request(app).get(`/api/protected-areas/${areaId}/zones`);
        expect(zoneListRes.statusCode).toBe(404);
    });
});