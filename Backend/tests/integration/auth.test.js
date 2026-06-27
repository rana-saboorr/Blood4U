/**
 * Integration tests for the Auth API.
 * Tests run against a real in-memory MongoDB instance via `@jest-community/jest-mongodb`.
 * We use supertest to make HTTP requests against the Express app.
 */

const request = require('supertest');
const app = require('../../server');
const mongoose = require('mongoose');
const User = require('../../models/User');
const OtpToken = require('../../models/OtpToken');
const { hashPassword } = require('../../utils/hash');

// Suppress winston logs during tests
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  http: jest.fn(),
}));

// Mock email sender so no real emails are sent
jest.mock('../../utils/mailer', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(true),
}));

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blood4u_test');
  }
});

afterAll(async () => {
  await User.deleteMany({ email: /test_integration_/ });
  await OtpToken.deleteMany({ email: /test_integration_/ });
  await mongoose.connection.close();
});

// ── Health Check ─────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('should return health check details', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('status');
  });
});

// ── Auth ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/signup/send-otp', () => {
  const email = 'test_integration_user@blood4u.test';

  afterEach(async () => {
    await OtpToken.deleteMany({ email });
    await User.deleteMany({ email });
  });

  it('should reject signup with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/signup/send-otp')
      .send({ email });
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should send OTP for valid new user', async () => {
    const res = await request(app).post('/api/auth/signup/send-otp').send({
      username: 'test_integration_user',
      email,
      password: 'SecurePass@123',
      phone: '03001234567',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/OTP sent/i);
  });

  it('should block admin signup via public route', async () => {
    const res = await request(app).post('/api/auth/signup/send-otp').send({
      username: 'evil_admin',
      email,
      password: 'pass123',
      phone: '03001234567',
      role: 'admin',
    });
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  const email = 'test_integration_login@blood4u.test';

  beforeAll(async () => {
    await User.create({
      username: 'test_integration_login',
      email,
      password: hashPassword('SecurePass@123'),
      phone: '03009876543',
      role: 'user',
      isVerified: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email });
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: email,
      password: 'SecurePass@123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: email,
      password: 'WrongPassword!',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject with missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(422);
  });
});
