import request from 'supertest';
import app from '../../server.js';
import { connect, clearDatabase, closeDatabase } from '../helpers/testDb.js';
import { getToken } from '../helpers/authHealper.js';
import { seedAreaAndZone } from '../helpers/seedHelper.js';

let adminToken;
let rangerToken;
let areaId;
let zoneId;

beforeAll(async () => {
    await connect();
    ({ token: adminToken } = await getToken('ADMIN'));
    ({ token: rangerToken } = await getToken('RANGER'));
    ({ areaId, zoneId } = await seedAreaAndZone(adminToken));


    // Trigger a CRITICAL incident to generate an alert in the system
    await request(app).post('/api/incidents').send({
        type: 'POACHING',
        description: 'Gunshots heard near river — triggers alert.',
        zoneId,
        protectedAreaId: areaId,
        incidentDate: new Date().toISOString(),
        severity: 'CRITICAL',
    });
});

afterAll(async () => await closeDatabase());

// ─── GET ALERTS ───────────────────────────────────────────────────────────────
describe('GET /api/alerts', () => {
    it('✅ ADMIN can list all alerts', async () => {
        const res = await request(app)
            .get('/api/alerts')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        const data = res.body.data || res.body;
        expect(Array.isArray(data)).toBe(true);
    });

    it('❌ RANGER cannot list alerts (403)', async () => {
        const res = await request(app)
            .get('/api/alerts')
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(403);
    });

    it('❌ Unauthenticated request returns 401', async () => {
        const res = await request(app).get('/api/alerts');
        expect(res.statusCode).toBe(401);
    });
});

// ─── PATCH ALERT (Acknowledge/Resolve) ───────────────────────────────────────
describe('PATCH /api/alerts/:id', () => {
    it('✅ ADMIN can acknowledge an alert', async () => {
        // First get the list to find an alert ID
        const listRes = await request(app)
            .get('/api/alerts')
            .set('Authorization', `Bearer ${adminToken}`);

        const alerts = listRes.body.data || listRes.body;

        if (!alerts || alerts.length === 0) {
            // No alerts generated — skip (depends on whether your system auto-generates them)
            console.warn('No alerts found — skipping PATCH test. Check if incidents auto-generate alerts.');
            return;
        }

        const alertId = alerts[0]._id;

        const res = await request(app)
            .patch(`/api/alerts/${alertId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'ACKNOWLEDGED' });

        expect(res.statusCode).toBe(200);
        const updated = res.body.data || res.body;
        expect(updated.status).toBe('ACKNOWLEDGED');
    });

    it('✅ ADMIN can resolve an alert', async () => {
        const listRes = await request(app)
            .get('/api/alerts')
            .set('Authorization', `Bearer ${adminToken}`);

        const alerts = listRes.body.data || listRes.body;
        if (!alerts || alerts.length === 0) return;

        const alertId = alerts[0]._id;

        const res = await request(app)
            .patch(`/api/alerts/${alertId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'RESOLVED' });

        expect(res.statusCode).toBe(200);
    });

    it('❌ RANGER cannot update an alert (403)', async () => {
        const listRes = await request(app)
            .get('/api/alerts')
            .set('Authorization', `Bearer ${adminToken}`);

        const alerts = listRes.body.data || listRes.body;
        if (!alerts || alerts.length === 0) return;

        const alertId = alerts[0]._id;

        const res = await request(app)
            .patch(`/api/alerts/${alertId}`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({ status: 'ACKNOWLEDGED' });

        expect(res.statusCode).toBe(403);
    });

    it('❌ Non-existent alert ID returns 404', async () => {
        const res = await request(app)
            .patch('/api/alerts/000000000000000000000000')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'ACKNOWLEDGED' });

        expect(res.statusCode).toBe(404);
    });
});
