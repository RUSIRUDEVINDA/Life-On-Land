import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { connect, closeDatabase } from '../helpers/testDb.js';
import { getToken } from '../helpers/authHealper.js';
import { seedAreaAndZone } from '../helpers/seedHelper.js';

let adminToken;
let rangerToken;
let areaId;
let zoneId;

const incidentDatePast = '2024-06-15T12:00:00.000Z';

const buildIncident = (overrides = {}) => ({
    type: 'OTHER',
    description: 'Integration test incident report body text.',
    zoneId,
    protectedAreaId: areaId,
    severity: 'LOW',
    incidentDate: incidentDatePast,
    ...overrides,
});

beforeAll(async () => {
    await connect();
    ({ token: adminToken } = await getToken('ADMIN'));
    ({ token: rangerToken } = await getToken('RANGER'));
    ({ areaId, zoneId } = await seedAreaAndZone(adminToken));
});

afterEach(async () => {
    const { incidents, alerts } = mongoose.connection.collections;
    if (incidents) await incidents.deleteMany({});
    if (alerts) await alerts.deleteMany({});
});

afterAll(async () => {
    await closeDatabase();
});

describe('POST /api/incidents', () => {
    it('✅ ADMIN can create an incident (201, REPORTED)', async () => {
        const res = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.type).toBe('OTHER');
        expect(res.body.data.status).toBe('REPORTED');
        expect(res.body.data.severity).toBe('LOW');
    });

    it('✅ RANGER can create an incident (201, REPORTED)', async () => {
        const res = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${rangerToken}`)
            .send(
                buildIncident({
                    description: 'Ranger filed report for integration testing.',
                })
            );

        expect(res.statusCode).toBe(201);
        expect(res.body.data.status).toBe('REPORTED');
    });

    it('✅ Unauthenticated user can create an incident (201, UNVERIFIED)', async () => {
        const res = await request(app)
            .post('/api/incidents')
            .send(
                buildIncident({
                    description: 'Public anonymous path for integration testing.',
                })
            );

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('UNVERIFIED');
    });

    it('✅ Optional location Point is accepted', async () => {
        const res = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(
                buildIncident({
                    description: 'Incident with geo point for integration.',
                    location: {
                        type: 'Point',
                        coordinates: [80.5, 6.8],
                    },
                })
            );

        expect(res.statusCode).toBe(201);
    });

    it('❌ Validation fails when description is too short (400)', async () => {
        const res = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(
                buildIncident({
                    description: 'Too short',
                })
            );

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('❌ Invalid zone / area combination returns error', async () => {
        const fakeZoneId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(
                buildIncident({
                    zoneId: fakeZoneId,
                    description: 'Should fail zone lookup integration test.',
                })
            );

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
});

describe('GET /api/incidents', () => {
    it('❌ Unauthenticated request returns 401', async () => {
        const res = await request(app).get('/api/incidents');
        expect(res.statusCode).toBe(401);
    });

    it('✅ Authenticated user can list incidents with pagination', async () => {
        await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const res = await request(app)
            .get('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination).toMatchObject({
            page: expect.any(Number),
            totalDocs: expect.any(Number),
        });
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('✅ Filters by protectedAreaId', async () => {
        await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const res = await request(app)
            .get(`/api/incidents?protectedAreaId=${areaId}`)
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
        res.body.data.forEach((row) => {
            expect(row.protectedAreaId._id || row.protectedAreaId).toBeDefined();
        });
    });

    it('❌ Invalid sortBy returns 400', async () => {
        const res = await request(app)
            .get('/api/incidents?sortBy=invalidField')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(400);
    });
});

describe('GET /api/incidents/:id', () => {
    it('✅ Returns incident by id', async () => {
        const createRes = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const id = createRes.body.data._id;
        const res = await request(app)
            .get(`/api/incidents/${id}`)
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data._id).toBe(id);
    });

    it('❌ Non-existent id returns 404', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .get(`/api/incidents/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
    });
});

describe('PUT /api/incidents/:id', () => {
    it('✅ RANGER can update incident fields', async () => {
        const createRes = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const id = createRes.body.data._id;
        const res = await request(app)
            .put(`/api/incidents/${id}`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({
                description: 'Updated description from ranger integration test.',
                severity: 'HIGH',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.severity).toBe('HIGH');
        expect(res.body.data.description).toContain('Updated description');
    });

    it('❌ Empty body returns 400', async () => {
        const createRes = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const id = createRes.body.data._id;
        const res = await request(app)
            .put(`/api/incidents/${id}`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({});

        expect(res.statusCode).toBe(400);
    });
});

describe('DELETE /api/incidents/:id', () => {
    it('✅ ADMIN can delete an incident', async () => {
        const createRes = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const id = createRes.body.data._id;
        const res = await request(app)
            .delete(`/api/incidents/${id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('✅ Deleted incident is excluded from list', async () => {
        const createRes = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const id = createRes.body.data._id;
        await request(app)
            .delete(`/api/incidents/${id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        const listRes = await request(app)
            .get('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(listRes.statusCode).toBe(200);
        const ids = listRes.body.data.map((d) => d._id);
        expect(ids).not.toContain(id);
    });

    it('❌ RANGER cannot delete an incident (403)', async () => {
        const createRes = await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const id = createRes.body.data._id;
        const res = await request(app)
            .delete(`/api/incidents/${id}`)
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(403);
    });
});
