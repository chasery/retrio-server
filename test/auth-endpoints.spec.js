const knex = require('knex');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Auth Endpoints', () => {
  let db;

  const { testUsers } = helpers.makeBoardsFixtures();
  const testUser = testUsers[0];

  before('Make knex DB instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });

    app.set('db', db);
  });

  before('Clean users table', () => helpers.cleanTable(db));

  afterEach('Clean users table', () => helpers.cleanTable(db));

  after('Destroy db connection', () => db.destroy());

  describe('POST /api/auth/login', () => {
    beforeEach('Insert users', () => helpers.seedUsers(db, testUsers));

    const requiredFields = ['email', 'password'];

    requiredFields.forEach((field) => {
      const loginAttemptBody = {
        email: testUser.email,
        password: testUser.password,
      };

      it(`responds with 400 required error when '${field}' is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttemptBody)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          });
      });
    });

    it("responds with 400 'Invalid email or password' when bad email", () => {
      const invalidCredentials = {
        email: 'bad@email.com',
        password: testUser.password,
      };

      return supertest(app)
        .post('/api/auth/login')
        .send(invalidCredentials)
        .expect(400, { error: 'Invalid email or password' });
    });

    it("responds with 400 'Invalid email or password' when bad password", () => {
      const invalidCredentials = {
        email: testUser.email,
        password: 'bad-password',
      };

      return supertest(app)
        .post('/api/auth/login')
        .send(invalidCredentials)
        .expect(400, { error: 'Invalid email or password' });
    });

    it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
      const validCredentials = {
        email: testUser.email,
        password: testUser.password,
      };
      const expectedToken = jwt.sign(
        {
          id: testUser.id,
        },
        process.env.JWT_SECRET,
        {
          subject: testUser.email,
          expiresIn: process.env.JWT_EXPIRY,
          algorithm: 'HS256',
        }
      );

      return supertest(app)
        .post('/api/auth/login')
        .send(validCredentials)
        .expect(200, { authToken: expectedToken });
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

    it(`responds 200 and JWT auth token using secret`, () => {
      const expectedToken = jwt.sign(
        { id: testUser.id },
        process.env.JWT_SECRET,
        {
          subject: testUser.email,
          expiresIn: process.env.JWT_EXPIRY,
          algorithm: 'HS256',
        }
      );
      return supertest(app)
        .post('/api/auth/refresh')
        .set('Authorization', helpers.makeAuthHeader(testUser))
        .expect(200, {
          authToken: expectedToken,
        });
    });
  });
});
