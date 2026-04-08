import request from 'supertest';
import app from '../../server.js';

let counter = 0;

const buildUniquePhone = () => {
    const suffix = String(10000000 + counter).slice(-8);
    return `07${suffix}`;
};

const extractToken = (res) => {
    if (res.body?.token) return res.body.token;
    if (res.body?.accessToken) return res.body.accessToken;
    if (res.body?.data?.token) return res.body.data.token;

    const setCookie = res.headers?.['set-cookie'];
    const jwtCookie = setCookie?.find((cookie) => cookie.startsWith('jwt='));
    if (!jwtCookie) return null;

    const match = jwtCookie.match(/^jwt=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Creates a unique user with the given role and returns their JWT token.
 */
export const getToken = async (role = 'RANGER') => {
    counter++;
    const email = `test_${role.toLowerCase()}_${counter}_${Date.now()}@test.com`;
    const phone = buildUniquePhone();
    const password = 'TestPass123!';
    const name = role === 'ADMIN' ? 'Test Admin' : 'Test Ranger';

    // Register
    const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ name, email, phone, password, role });

    let token = extractToken(registerRes);
    if (token) return { token, user: registerRes.body.data || registerRes.body };

    // Otherwise login separately
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    token = extractToken(loginRes);

    if (!token) {
        const registerDetails = {
            status: registerRes.statusCode,
            body: registerRes.body
        };
        const loginDetails = {
            status: loginRes.statusCode,
            body: loginRes.body
        };
        throw new Error(`Failed to obtain auth token. Register: ${JSON.stringify(registerDetails)} Login: ${JSON.stringify(loginDetails)}`);
    }

    return { token, user: loginRes.body.data || loginRes.body };
};


