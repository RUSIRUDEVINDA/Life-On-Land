import request from 'supertest';
import app from '../../server.js';
import { connect, clearDatabase, closeDatabase } from '../helpers/testDb.js';
import { getToken } from '../helpers/authHealper.js';
import { seedAreaAndZone } from '../helpers/seedHelper.js';
import mongoose from 'mongoose';

let adminToken;
let rangerToken;
let rangerId;
let areaId;
let zoneId;
let alertId;

beforeAll(async () => {
    await connect();
    ({ token: adminToken } = await getToken('ADMIN'));
    const rangerData = await getToken('RANGER');
    rangerToken = rangerData.token;
    rangerId = rangerData.user._id;

    ({ areaId, zoneId } = await seedAreaAndZone(adminToken));


    // Seed an incident so we can link it as an alert
    const incidentRes = await request(app).post('/api/incidents').send({
        type: 'POACHING',
        description: 'Test incident for patrol seed.',
        zoneId,
        protectedAreaId: areaId,
        incidentDate: new Date().toISOString(),
        severity: 'CRITICAL',
    });
    alertId = incidentRes.body.data?._id || incidentRes.body._id;
});

afterEach(async () => {
    // Only clear patrols/check-ins between tests, keep the area/zone/alert
    const collections = ['patrols'];
    for (const name of collections) {
        if (mongoose.connection.collections[name]) {
            await mongoose.connection.collections[name].deleteMany({});
        }
    }
});

afterAll(async () => await closeDatabase());

// Helper to create a valid patrol
const createPatrol = (adminTok, rangerIds = []) =>
    request(app)
        .post('/api/patrols')
        .set('Authorization', `Bearer ${adminTok}`)
        .send({
            alertId,
            assignedRangerIds: rangerIds,
            plannedStart: new Date(Date.now() + 3600000).toISOString(),
            plannedEnd: new Date(Date.now() + 86400000).toISOString(),
            notes: 'Integration test patrol.',
        });


// ─── CREATE PATROL ────────────────────────────────────────────────────────────
describe('POST /api/patrols', () => {
    it('✅ ADMIN can schedule a new patrol (201)', async () => {
        const res = await createPatrol(adminToken, [rangerId]);

        expect(res.statusCode).toBe(201);
        const patrol = res.body.patrol || res.body.data || res.body;
        expect(patrol.status).toBe('PLANNED');
        expect(patrol.notes).toBe('Integration test patrol.');
    });

    it('❌ RANGER cannot create a patrol (403)', async () => {
        const res = await request(app)
            .post('/api/patrols')
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({
                alertId,
                assignedRangerIds: [],
                plannedStart: new Date().toISOString(),
                plannedEnd: new Date().toISOString(),
                notes: 'Ranger trying to create.',
            });

        expect(res.statusCode).toBe(403);
    });

    it('❌ Unauthenticated request returns 401', async () => {
        const res = await request(app).post('/api/patrols').send({
            alertId,
            plannedStart: new Date().toISOString(),
            plannedEnd: new Date().toISOString(),
        });

        expect(res.statusCode).toBe(401);
    });

    it('❌ Missing plannedStart returns 400', async () => {
        const res = await request(app)
            .post('/api/patrols')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ alertId, plannedEnd: new Date().toISOString() });

        expect(res.statusCode).toBe(400);
    });
});

// ─── GET ALL PATROLS ──────────────────────────────────────────────────────────
describe('GET /api/patrols', () => {
    it('✅ ADMIN can list all patrols', async () => {
        await createPatrol(adminToken, [rangerId]);

        const res = await request(app)
            .get('/api/patrols')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        const data = res.body.data || res.body;
        expect(Array.isArray(data)).toBe(true);
    });

    it('✅ RANGER can list patrols', async () => {
        const res = await request(app)
            .get('/api/patrols')
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
    });

    it('❌ Unauthenticated returns 401', async () => {
        const res = await request(app).get('/api/patrols');
        expect(res.statusCode).toBe(401);
    });
});

// ─── GET BY ID ────────────────────────────────────────────────────────────────
describe('GET /api/patrols/:id', () => {
    it('✅ ADMIN can get patrol details by ID', async () => {
        const createRes = await createPatrol(adminToken, [rangerId]);
        const id = createRes.body.patrol?._id || createRes.body.data?._id || createRes.body._id;

        const res = await request(app)
            .get(`/api/patrols/${id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
    });

    it('❌ Non-existent patrol ID returns 404', async () => {
        const res = await request(app)
            .get('/api/patrols/000000000000000000000000')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
    });
});

// ─── PATCH (Partial Update) ───────────────────────────────────────────────────
describe('PATCH /api/patrols/:id', () => {
    it('✅ ADMIN can update patrol notes', async () => {
        const createRes = await createPatrol(adminToken, [rangerId]);
        const id = createRes.body.patrol?._id || createRes.body.data?._id || createRes.body._id;

        const res = await request(app)
            .patch(`/api/patrols/${id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ notes: 'Updated patrol notes.', status: 'IN_PROGRESS' });

        expect(res.statusCode).toBe(200);
    });

    it('❌ RANGER cannot update patrol (403)', async () => {
        const createRes = await createPatrol(adminToken, [rangerId]);
        const id = createRes.body.patrol?._id || createRes.body.data?._id || createRes.body._id;

        const res = await request(app)
            .patch(`/api/patrols/${id}`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({ notes: 'Ranger update attempt.' });

        expect(res.statusCode).toBe(403);
    });
});

// ─── CHECK-INS ────────────────────────────────────────────────────────────────
describe('POST /api/patrols/:id/check-ins', () => {
    let patrolId;

    beforeEach(async () => {
        const res = await createPatrol(adminToken, [rangerId]);
        patrolId = res.body.patrol?._id || res.body.data?._id || res.body._id;
    });

    it('✅ RANGER can record a check-in (201)', async () => {
        const res = await request(app)
            .post(`/api/patrols/${patrolId}/check-ins`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({
                location: { lat: 6.315, lng: 81.022 },
                note: 'Suspicious tracks found near river.',
                zoneId,
            });

        expect(res.statusCode).toBe(201);
        const patrol = res.body.patrol || res.body.data || res.body;
        expect(patrol.checkIns.length).toBeGreaterThanOrEqual(1);
        expect(patrol.status).toBe('IN_PROGRESS');
    });

    it('✅ multiple check-ins accumulate correctly', async () => {
        await request(app)
            .post(`/api/patrols/${patrolId}/check-ins`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({ location: { lat: 6.31, lng: 81.01 }, zoneId });

        const res = await request(app)
            .post(`/api/patrols/${patrolId}/check-ins`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({ location: { lat: 6.32, lng: 81.02 }, zoneId });

        expect(res.statusCode).toBe(201);
        const patrol = res.body.patrol || res.body.data || res.body;
        expect(patrol.checkIns.length).toBeGreaterThanOrEqual(2);
    });

    it('❌ Missing location returns 400', async () => {
        const res = await request(app)
            .post(`/api/patrols/${patrolId}/check-ins`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({ note: 'No location given.', zoneId });

        expect(res.statusCode).toBe(400);
    });

    it('❌ Unauthenticated check-in returns 401', async () => {
        const res = await request(app)
            .post(`/api/patrols/${patrolId}/check-ins`)
            .send({ location: { lat: 6.315, lng: 81.022 }, zoneId });

        expect(res.statusCode).toBe(401);
    });
});

// ─── GET CHECK-INS ────────────────────────────────────────────────────────────
describe('GET /api/patrols/:id/check-ins', () => {
    it('✅ ADMIN can view check-in history for a patrol', async () => {
        const createRes = await createPatrol(adminToken, [rangerId]);
        const patrolId = createRes.body.patrol?._id || createRes.body.data?._id || createRes.body._id;

        await request(app)
            .post(`/api/patrols/${patrolId}/check-ins`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({ location: { lat: 6.31, lng: 81.01 }, zoneId });

        const res = await request(app)
            .get(`/api/patrols/${patrolId}/check-ins`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
    });
});

// ─── DELETE PATROL ────────────────────────────────────────────────────────────
describe('DELETE /api/patrols/:id', () => {
    it('✅ ADMIN can delete a patrol', async () => {
        const createRes = await createPatrol(adminToken, [rangerId]);
        const id = createRes.body.patrol?._id || createRes.body.data?._id || createRes.body._id;

        const res = await request(app)
            .delete(`/api/patrols/${id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 204]).toContain(res.statusCode);
    });

    it('❌ RANGER cannot delete a patrol (403)', async () => {
        const createRes = await createPatrol(adminToken, [rangerId]);
        const id = createRes.body.patrol?._id || createRes.body.data?._id || createRes.body._id;

        const res = await request(app)
            .delete(`/api/patrols/${id}`)
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(403);
    });
});

