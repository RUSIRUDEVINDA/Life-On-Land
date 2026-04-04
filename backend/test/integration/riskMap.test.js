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
    description: 'Risk map integration test incident description.',
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

describe('GET /api/risk-map', () => {

    it('✅ ADMIN can fetch risk map for a seeded protected area (200)', async () => {
        const res = await request(app)
            .get(`/api/risk-map?protectedAreaId=${areaId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        const data = res.body.data;
        expect(data.protectedAreaId).toBe(areaId);
        expect(Array.isArray(data.zones)).toBe(true);
        expect(data.zones.length).toBeGreaterThanOrEqual(1);
        expect(data.summary).toMatchObject({
            totalZones: expect.any(Number),
            criticalZones: expect.any(Number),
            highRiskZones: expect.any(Number),
            mediumRiskZones: expect.any(Number),
            lowRiskZones: expect.any(Number),
            totalIncidents: expect.any(Number),
            severityBreakdown: {
                CRITICAL: expect.any(Number),
                HIGH: expect.any(Number),
                MEDIUM: expect.any(Number),
                LOW: expect.any(Number),
            },
        });
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(data.zones[0].riskLevel);
        expect(data.zonesByRiskLevel).toMatchObject({
            CRITICAL: expect.any(Array),
            HIGH: expect.any(Array),
            MEDIUM: expect.any(Array),
            LOW: expect.any(Array),
        });
    });

    it('✅ RANGER can fetch risk map', async () => {
        const res = await request(app)
            .get(`/api/risk-map?protectedAreaId=${areaId}`)
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.zones.length).toBeGreaterThanOrEqual(1);
    });

    it('✅ Valid ObjectId with no matching zones returns empty map (200)', async () => {
        const orphanId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .get(`/api/risk-map?protectedAreaId=${orphanId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.zones).toEqual([]);
        expect(res.body.data.summary.totalZones).toBe(0);
    });

    it('✅ Optional from/to filters are applied', async () => {
        await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const res = await request(app)
            .get(
                `/api/risk-map?protectedAreaId=${areaId}&from=2024-06-01&to=2024-06-30`
            )
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.summary.totalIncidents).toBeGreaterThanOrEqual(1);
        const zoneEntry = res.body.data.zones.find(
            (z) => String(z.zoneId) === zoneId
        );
        expect(zoneEntry).toBeDefined();
        expect(zoneEntry.incidentCount).toBeGreaterThanOrEqual(1);
    });

    it('✅ Date range excluding incidents yields zero counted incidents', async () => {
        await request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildIncident());

        const res = await request(app)
            .get(
                `/api/risk-map?protectedAreaId=${areaId}&from=2020-01-01&to=2020-01-31`
            )
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.summary.totalIncidents).toBe(0);
    });
    it('❌ Unauthenticated request returns 401', async () => {
        const res = await request(app).get(`/api/risk-map?protectedAreaId=${areaId}`);
        expect(res.statusCode).toBe(401);
    });

    it('❌ Missing protectedAreaId returns 400', async () => {
        const res = await request(app)
            .get('/api/risk-map')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(Array.isArray(res.body.details)).toBe(true);
    });

    it('❌ Invalid protectedAreaId returns 400', async () => {
        const res = await request(app)
            .get('/api/risk-map?protectedAreaId=not-a-valid-object-id')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(400);
    });

    it('❌ Invalid from date returns 400', async () => {
        const res = await request(app)
            .get(
                `/api/risk-map?protectedAreaId=${areaId}&from=not-a-date&to=2024-12-31`
            )
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(400);
    });

    it('❌ from date after to date returns 400', async () => {
        const res = await request(app)
            .get(
                `/api/risk-map?protectedAreaId=${areaId}&from=2024-12-31&to=2024-01-01`
            )
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(400);
    });
    
});
