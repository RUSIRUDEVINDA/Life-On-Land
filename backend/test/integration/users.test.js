import request from 'supertest';
import app from '../../server.js';
import { connect, clearDatabase, closeDatabase } from '../helpers/testDb.js';
import { getToken } from '../helpers/authHealper.js';

let adminToken;
let rangerToken;
let adminId;
let rangerId;

beforeAll(async () => {
    await connect();
    const adminData = await getToken('ADMIN');
    adminToken = adminData.token;
    adminId = adminData.user._id || adminData.user.data?._id;

    const rangerData = await getToken('RANGER');
    rangerToken = rangerData.token;
    rangerId = rangerData.user._id || rangerData.user.data?._id;
});

afterAll(async () => await closeDatabase());

describe('GET /api/users', () => {
    it('✅ ADMIN can list all users', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('✅ RANGER can list users', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
    });

    it('❌ Unauthenticated request returns 401', async () => {
        const res = await request(app).get('/api/users');
        expect(res.statusCode).toBe(401);
    });
});

describe('GET /api/users/:id', () => {
    it('✅ ADMIN can get any user profile', async () => {
        const res = await request(app)
            .get(`/api/users/${rangerId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBe(rangerId);
    });

    it('✅ RANGER can get their own profile', async () => {
        const res = await request(app)
            .get(`/api/users/${rangerId}`)
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(200);
    });

    it('❌ RANGER cannot get another user profile (403)', async () => {
        const res = await request(app)
            .get(`/api/users/${adminId}`)
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(403);
    });
});

describe('PUT /api/users/:id', () => {
    it('✅ RANGER can update their own name', async () => {
        const res = await request(app)
            .put(`/api/users/${rangerId}`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({
                name: 'Updated Ranger Name',
                email: 'ranger_updated@test.com',
                phone: '0711234567'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.user.name).toBe('Updated Ranger Name');
    });

    it('❌ RANGER cannot update their own role (403)', async () => {
        const res = await request(app)
            .put(`/api/users/${rangerId}`)
            .set('Authorization', `Bearer ${rangerToken}`)
            .send({
                role: 'ADMIN'
            });

        // The controller should block role updates for non-admins
        expect(res.statusCode).toBe(403);
    });
});

describe('DELETE /api/users/:id', () => {
    it('✅ ADMIN can delete a user', async () => {
        // Create a temporary user to delete
        const tempUserData = await getToken('RANGER');
        const tempId = tempUserData.user._id || tempUserData.user.data?._id;

        const res = await request(app)
            .delete(`/api/users/${tempId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
    });

    it('❌ RANGER cannot delete a user (403)', async () => {
        const res = await request(app)
            .delete(`/api/users/${adminId}`)
            .set('Authorization', `Bearer ${rangerToken}`);

        expect(res.statusCode).toBe(403);
    });
});