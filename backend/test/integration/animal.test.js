import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { connect, clearDatabase, closeDatabase } from '../helpers/testDb.js';
import { getToken } from '../helpers/authHealper.js';
import { seedAreaAndZone } from '../helpers/seedHelper.js';

let adminToken;
let rangerToken;
let areaId;
let zoneId;


const buildAnimal = (tagId, overrides = {}) => ({
    tagId,
    protectedAreaId: areaId,
    zoneId,
    species: 'Asian Elephant',
    sex: 'MALE',
    ageClass: 'ADULT',
    status: 'ACTIVE',
    description: 'Large bull with distinctive tusk.',
    endemicToSriLanka: true,
    ...overrides,
});


beforeAll(async () => {
    await connect();
    ({ token: adminToken } = await getToken('ADMIN'));
    ({ token: rangerToken } = await getToken('RANGER'));
    ({ areaId, zoneId } = await seedAreaAndZone(adminToken));
});


afterEach(async () => {
    if (mongoose.connection.collections.animals) {
        await mongoose.connection.collections.animals.deleteMany({});
    }
});
afterAll(async () => await closeDatabase());

// ─── CREATE ANIMAL ────────────────────────────────────────────────────────────
describe('POST /api/animals', () => {
    it('✅ ADMIN can register a new animal (201)', async () => {
        const res = await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-INT-001'));

        expect(res.statusCode).toBe(201);
        const animal = res.body.animal || res.body.data || res.body;
        expect(animal.tagId).toBe('T-INT-001');
        expect(animal.species).toBe('Asian Elephant');
        expect(animal.status).toBe('ACTIVE');
    });

    it('✅ ADMIN can register a Leopard', async () => {
        const res = await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-INT-002', { species: 'Sri Lanka Leopard', sex: 'FEMALE' }));

        expect(res.statusCode).toBe(201);
    });

    it('❌ RANGER cannot register an animal (403)', async () => {
        const res = await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${rangerToken}`)
            .send(buildAnimal('T-INT-003'));

        expect(res.statusCode).toBe(403);
    });

    it('❌ Unauthenticated request returns 401', async () => {
        const res = await request(app)
            .post('/api/animals')
            .send(buildAnimal('T-INT-004'));

        expect(res.statusCode).toBe(401);
    });

    it('❌ Duplicate tagId should be rejected (409)', async () => {
        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-DUP-001'));

        const res = await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-DUP-001'));

        expect([400, 409]).toContain(res.statusCode);
    });

    it('❌ Missing required field "species" returns 400', async () => {
        const { species, ...withoutSpecies } = buildAnimal('T-NOSPEC-001');
        const res = await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(withoutSpecies);

        expect(res.statusCode).toBe(400);
    });

    it('❌ Missing tagId returns 400', async () => {
        const { tagId, ...withoutTag } = buildAnimal('');
        const res = await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(withoutTag);

        expect(res.statusCode).toBe(400);
    });
});

// ─── GET ALL ANIMALS ──────────────────────────────────────────────────────────
describe('GET /api/animals', () => {
    it('❌ Unauthenticated request returns 401', async () => {
        const res = await request(app).get('/api/animals');
        expect(res.statusCode).toBe(401);
    });

    it('✅ ADMIN can list all animals', async () => {
        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-LIST-001'));

        const res = await request(app)
            .get('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        const data = res.body.data || res.body;
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThanOrEqual(1);
    });

    it('✅ RANGER can list all animals', async () => {
        const res = await request(app)
            .get('/api/animals')
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
    });

    it('✅ should filter animals by species', async () => {
        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-ELE-001', { species: 'Asian Elephant' }));

        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-LEO-001', { species: 'Leopard' }));

        const res = await request(app)
            .get('/api/animals?species=Leopard')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        const data = res.body.data || res.body;
        data.forEach((animal) => expect(animal.species).toBe('Leopard'));
    });
});

// ─── GET BY TAG ID ────────────────────────────────────────────────────────────
describe('GET /api/animals/:tagId', () => {
    it('✅ RANGER can retrieve an animal profile by tagId', async () => {
        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-FETCH-001'));

        const res = await request(app)
            .get('/api/animals/T-FETCH-001')
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
        const animal = res.body.animal || res.body.data || res.body;
        expect(animal.tagId).toBe('T-FETCH-001');
    });

    it('❌ Non-existent tagId returns 404', async () => {
        const res = await request(app)
            .get('/api/animals/DOES-NOT-EXIST')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
    });
});

// ─── PATCH (Partial Update) ───────────────────────────────────────────────────
describe('PATCH /api/animals/:tagId', () => {
    it('✅ ADMIN can partially update an animal', async () => {
        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-PATCH-001'));

        const res = await request(app)
            .patch('/api/animals/T-PATCH-001')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'INACTIVE', description: 'Updated description.' });

        expect(res.statusCode).toBe(200);
        const updated = res.body.animal || res.body.data || res.body;
        expect(updated.status).toBe('INACTIVE');
    });

    it('❌ RANGER cannot update an animal (403)', async () => {
        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-RANGERPATCH-001'));

        const res = await request(app)
            .patch('/api/animals/T-RANGERPATCH-001')
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({ status: 'INACTIVE' });

        expect(res.statusCode).toBe(403);
    });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
describe('DELETE /api/animals/:tagId', () => {
    it('✅ ADMIN can delete an animal record', async () => {
        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-DEL-001'));

        const res = await request(app)
            .delete('/api/animals/T-DEL-001')
            .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 204]).toContain(res.statusCode);
    });

    it('✅ Deleted animal should no longer be findable (404)', async () => {
        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-DEL-002'));

        await request(app)
            .delete('/api/animals/T-DEL-002')
            .set('Authorization', `Bearer ${adminToken}`);

        const res = await request(app)
            .get('/api/animals/T-DEL-002')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
    });

    it('❌ RANGER cannot delete an animal (403)', async () => {
        await request(app)
            .post('/api/animals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(buildAnimal('T-DEL-003'));

        const res = await request(app)
            .delete('/api/animals/T-DEL-003')
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(403);
    });
});
