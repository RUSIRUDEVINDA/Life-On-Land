import request from 'supertest';
import app from '../../server.js';
import { connect, clearDatabase, closeDatabase } from '../helpers/testDb.js';
import { getToken } from '../helpers/authHealper.js';
import { seedAreaAndZone } from '../helpers/seedHelper.js';

let adminToken;
let rangerToken;
let areaId;
let zoneId;
let tagId = 'T-MOV-001';

beforeAll(async () => {
    await connect();
    ({ token: adminToken } = await getToken('ADMIN'));
    ({ token: rangerToken } = await getToken('RANGER'));
    ({ areaId, zoneId } = await seedAreaAndZone(adminToken));

    // Register an animal to test historical retrieval
    await request(app)
        .post('/api/animals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            tagId,
            species: 'Asian Elephant',
            sex: 'MALE',
            ageClass: 'ADULT',
            status: 'ACTIVE',
            protectedAreaId: areaId,
            zoneId
        });
});

afterAll(async () => await closeDatabase());

describe('POST /api/movements', () => {
    it('✅ should ingest a valid movement inside a zone', async () => {
        const res = await request(app)
            .post('/api/movements')
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({
                tagId,
                lat: 6.32,
                lng: 80.42,
                sourceType: 'GPS'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.movement).toHaveProperty('tagId', tagId);
        expect(res.body.movement).toHaveProperty('zoneId');
    });

    it('❌ should reject movement outside all zones', async () => {
        const res = await request(app)
            .post('/api/movements')
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({
                tagId,
                lat: 0,
                lng: 0
            });

        expect(res.statusCode).toBe(500); // Because ingestMovement throws Error
        // Wait, ingestMovement throws a raw Error, which goes to errorHandler -> 500
    });
});

describe('GET /api/movements/live', () => {
    it('✅ should return latest animal positions', async () => {
        const res = await request(app)
            .get('/api/movements/live')
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('GET /api/movements/:tagId', () => {
    it('✅ should return movement history for an animal', async () => {
        const res = await request(app)
            .get(`/api/movements/${tagId}`)
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.movements)).toBe(true);
    });

    it('❌ should return 404 for non-existent animal history', async () => {
        const res = await request(app)
            .get('/api/movements/T-NON-EXISTENT')
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(404);
    });
});

describe('GET /api/movements/summary', () => {
    it('✅ should return activity summary per zone', async () => {
        const res = await request(app)
            .get('/api/movements/summary')
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
    });
});
