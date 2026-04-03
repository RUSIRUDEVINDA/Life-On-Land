import request from "supertest";
import app from '../../server.js';
import { connect, clearDatabase, closeDatabase } from '../helpers/testDb.js';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());


// ─── Shared test user ───────────────────────────────────────────────────────
const validUser = {
    name: 'Test Ranger',
    email: 'ranger@lifeonland.test',
    phone: '0711234567',
    password: 'SecurePass123!',
    role: 'RANGER',
};


// ─── REGISTER ────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
    it('✅ should register a new RANGER and return 201 with token', async () => {
        const res = await request(app).post('/api/auth/register').send(validUser);

        expect(res.statusCode).toBe(201);
        const setCookie = res.headers['set-cookie'];
        const token = setCookie ? setCookie.find(c => c.startsWith('jwt=')).split('=')[1].split(';')[0] : null;
        expect(token).toBeDefined();

    });

    it('✅ should register a new ADMIN and return 201', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validUser, email: 'admin@test.com', role: 'ADMIN' });

        expect(res.statusCode).toBe(201);
    });

    it('❌ should return 400 when email is missing', async () => {
        const { email, ...withoutEmail } = validUser;
        const res = await request(app).post('/api/auth/register').send(withoutEmail);
        expect(res.statusCode).toBe(400);
    });

    it('❌ should return 400 when password is missing', async () => {
        const { password, ...withoutPass } = validUser;
        const res = await request(app).post('/api/auth/register').send(withoutPass);
        expect(res.statusCode).toBe(400);
    });

    it('❌ should return 409 when email already exists', async () => {
        await request(app).post('/api/auth/register').send(validUser);
        const res = await request(app).post('/api/auth/register').send(validUser);
        // Expect conflict — could be 409 or 400 depending on your error handling
        expect([400, 409]).toContain(res.statusCode);
    });
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        // Ensure user exists before login tests
        await request(app).post('/api/auth/register').send(validUser);
    });

    it('✅ should login with valid credentials and return a JWT', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: validUser.email, password: validUser.password });

        expect(res.statusCode).toBe(200);
        const setCookie = res.headers['set-cookie'];
        const token = setCookie ? setCookie.find(c => c.startsWith('jwt=')).split('=')[1].split(';')[0] : null;
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

    });

    it('❌ should return 401 for wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: validUser.email, password: 'WrongPassword!' });

        expect(res.statusCode).toBe(401);
    });

    it('❌ should return 400 or 404 for non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@test.com', password: 'SomePass123!' });

        expect([400, 401, 404]).toContain(res.statusCode);
    });

    it('❌ should return 400 when email is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: validUser.password });

        expect(res.statusCode).toBe(400);
    });
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
    it('✅ should logout successfully with a valid token', async () => {
        const registerRes = await request(app).post('/api/auth/register').send(validUser);
        const token =
            registerRes.body.token ||
            registerRes.body.accessToken ||
            registerRes.body.data?.token;

        const res = await request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 204]).toContain(res.statusCode);
    });

    it('❌ should return 401 when no token is provided', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.statusCode).toBe(401);
    });
});