const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Cards Endpoints', function () {
  let db;

  const {
    testUsers,
    testTeams,
    testTeamMembers,
    testBoards,
    testUserBoards,
    testCards,
  } = helpers.makeBoardsFixtures();
  const testUser = testUsers[0];
  const testTeam = testTeams[0];
  const testUserBoard = testUserBoards[0];
  const testBoard = testBoards[0];
  const testCard = testCards[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });

    app.set('db', db);
  });

  before('Clean tables', () => helpers.cleanTable(db));

  afterEach('Clean tables', () => helpers.cleanTable(db));

  after('Destroy db connection', () => db.destroy());

  describe(`GET /api/cards/:cardId`, () => {
    context(`Given no cards`, () => {
      beforeEach(() => helpers.seedUsers(db, testUsers));

      it(`responds with 404`, () => {
        const cardId = 123456;

        return supertest(app)
          .get(`/api/cards/${cardId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, { error: `Card doesn't exist` });
      });
    });

    context(`Given testUser has boards`, () => {
      beforeEach('insert required boards data', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
        await helpers.seedBoards(db, testBoards, testUserBoards, testCards);
      });

      it("responds with 200 and only the userId's card", () => {
        const expectedCard = helpers.makeExpectedCard(testCard);

        return supertest(app)
          .get(`/api/cards/${testCard.id}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, expectedCard);
      });
    });

    context(`Given an XSS attack card`, () => {
      const { maliciousCard, expectedCard } = helpers.makeMaliciousCard(
        testUser
      );
      const { userBoard, maliciousBoard } = helpers.makeMaliciousBoard(
        testUser,
        expectedCard
      );

      beforeEach('insert malicious board and card', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
        await helpers.seedBoards(
          db,
          [maliciousBoard],
          [userBoard],
          [maliciousCard]
        );
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/cards/${maliciousCard.id}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect((res) => {
            expect(res.body.headline).to.eql(expectedCard.headline);
            expect(res.body.text).to.eql(expectedCard.text);
          });
      });
    });
  });

  describe(`POST /api/cards`, () => {
    beforeEach('insert boards', async () => {
      await helpers.seedUsers(db, testUsers);
      await helpers.seedTeams(db, testTeams, testTeamMembers);
      await helpers.seedBoards(db, testBoards, testUserBoards, testCards);
    });

    it(`responds with 401 when user doesn't belong to board`, () => {
      const newCard = {
        board_id: testBoard.id,
        category: 1,
        headline: 'BEET IT',
        text: `All you got to do is BEET IT`,
      };

      return supertest(app)
        .post(`/api/cards`)
        .set('Authorization', helpers.makeAuthHeader(testUsers[2]))
        .send(newCard)
        .expect(401, {
          error: `Unauthorized request`,
        });
    });

    const requiredFields = ['board_id', 'category', 'text'];

    requiredFields.forEach((field) => {
      const newCard = {
        board_id: testBoard.id,
        category: 1,
        headline: 'BEET IT',
        text: `All you got to do is BEET IT`,
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newCard[field];

        return supertest(app)
          .post('/api/cards')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newCard)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          });
      });
    });

    it(`responds with 201 and the new board`, function () {
      this.retries(3);
      const newCard = {
        board_id: testBoard.id,
        category: 1,
        headline: 'BEET IT',
        text: `All you got to do is BEET IT`,
      };

      return supertest(app)
        .post('/api/cards')
        .set('Authorization', helpers.makeAuthHeader(testUser))
        .send(newCard)
        .expect(201)
        .expect((res) => {
          expect(res.body).to.have.property('id');
          expect(res.body.board_id).to.eql(newCard.board_id);
          expect(res.body.category).to.eql(newCard.category);
          expect(res.body.headline).to.eql(newCard.headline);
          expect(res.body.text).to.eql(newCard.text);
          expect(res.body.created_by).to.eql(testUser.id);
          expect(res.headers.location).to.eql(`/api/cards/${res.body.id}`);
          const expectedDate = new Date().toLocaleString();
          const createdDate = new Date(res.body.created_at).toLocaleString();
          const updatedDate = new Date(res.body.updated_at).toLocaleString();
          expect(createdDate).to.eql(expectedDate);
          expect(updatedDate).to.eql(expectedDate);
        })
        .expect((res) =>
          db
            .from('cards')
            .select('*')
            .where('id', res.body.id)
            .first()
            .then((row) => {
              expect(row.board_id).to.eql(newCard.board_id);
              expect(row.category).to.eql(newCard.category);
              expect(row.headline).to.eql(newCard.headline);
              expect(row.text).to.eql(newCard.text);
              expect(row.created_by).to.eql(testUser.id);
              const expectedDate = new Date().toLocaleString();
              const createdDate = new Date(row.created_at).toLocaleString();
              const updatedDate = new Date(row.updated_at).toLocaleString();
              expect(createdDate).to.eql(expectedDate);
              expect(updatedDate).to.eql(expectedDate);
            })
        );
    });
  });

  describe('PATCH /api/cards/:cardId', () => {
    context('Given no boards', () => {
      beforeEach(() => helpers.seedUsers(db, testUsers));

      it('responds with a 404', () => {
        const cardId = 123456;
        const updatedCard = {
          board_id: testBoard.id,
          category: 2,
          headline: 'BEET IT',
          text: `All you got to do is BEET IT`,
        };

        return supertest(app)
          .patch(`/api/cards/${cardId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(updatedCard)
          .expect(404, { error: "Card doesn't exist" });
      });
    });

    context('Given there are boards', () => {
      beforeEach('insert boards', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
        await helpers.seedBoards(db, testBoards, testUserBoards, testCards);
      });

      const requiredFields = ['category', 'text'];

      requiredFields.forEach((field) => {
        const cardId = testCard.id;
        const updatedCard = {
          category: 2,
          headline: 'BEET IT',
          text: `All you got to do is BEET IT`,
        };

        it(`responds with 400 and an error message when the '${field}' is missing`, () => {
          delete updatedCard[field];

          return supertest(app)
            .patch(`/api/cards/${cardId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(updatedCard)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            });
        });
      });

      it(`responds with 401 when board owner's user_id !== auth user_id`, () => {
        const boardId = 3;
        const updatedBoard = {
          name: 'BEET IT',
          team_id: testTeams[1].id,
        };

        return supertest(app)
          .patch(`/api/boards/${boardId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(updatedBoard)
          .expect(401, {
            error: `Unauthorized request`,
          });
      });

      it('responds with 204 and board is updated', () => {
        this.retries(3);
        const cardId = testCard.id;
        const updatedCard = {
          board_id: testBoard.id,
          category: 2,
          headline: 'BEET IT PLEASE',
          text: `All you got to do is BEET IT, like for real!`,
        };

        return supertest(app)
          .patch(`/api/cards/${cardId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(updatedCard)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/cards/${cardId}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect((res) => {
                expect(res.body.board_id).to.eql(updatedCard.board_id);
                expect(res.body.category).to.eql(updatedCard.category);
                expect(res.body.headline).to.eql(updatedCard.headline);
                expect(res.body.text).to.eql(updatedCard.text);
                const expectedDate = new Date().toLocaleString();
                const updatedDate = new Date(
                  res.body.updated_at
                ).toLocaleString();
                expect(updatedDate).to.eql(expectedDate);
              })
          );
      });

      it('responds with 204 and ignores bad key value pair', () => {
        this.retries(3);
        const cardId = testCard.id;
        const updatedCard = {
          board_id: testBoard.id,
          category: 2,
          headline: 'BEET IT PLEASE',
          text: `All you got to do is BEET IT, like for real!`,
        };

        return supertest(app)
          .patch(`/api/cards/${cardId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send({
            ...updatedCard,
            fieldToIgnore: 'this should not be in the GET response',
          })
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/cards/${cardId}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect((res) => {
                expect(res.body).to.not.have.property('fieldToIgnore');
                expect(res.body.board_id).to.eql(updatedCard.board_id);
                expect(res.body.category).to.eql(updatedCard.category);
                expect(res.body.headline).to.eql(updatedCard.headline);
                expect(res.body.text).to.eql(updatedCard.text);
                const expectedDate = new Date().toLocaleString();
                const updatedDate = new Date(
                  res.body.updated_at
                ).toLocaleString();
                expect(updatedDate).to.eql(expectedDate);
              })
          );
      });
    });
  });

  describe('DELETE /api/cards/:cardId', () => {
    context('Given no boards', () => {
      beforeEach(() => helpers.seedUsers(db, testUsers));

      it('responds with 404', () => {
        const cardId = 123456;

        return supertest(app)
          .delete(`/api/cards/${cardId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, { error: "Card doesn't exist" });
      });
    });

    context('Given there are boards', () => {
      beforeEach('insert boards', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
        await helpers.seedBoards(db, testBoards, testUserBoards, testCards);
      });

      it(`responds with 401 when user isn't the card creator`, () => {
        const cardId = testCard.id;

        return supertest(app)
          .delete(`/api/cards/${cardId}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[2]))
          .expect(401, {
            error: `Unauthorized request`,
          });
      });

      it('responds with 204 and the card is deleted in the db', () => {
        const cardId = testCard.id;

        return supertest(app)
          .delete(`/api/cards/${cardId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(204)
          .then((res) => {
            return supertest(app)
              .get(`/api/cards/${cardId}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect(404, {
                error: `Card doesn't exist`,
              });
          });
      });

      it('responds with 204 and the card is deleted when user is board owner', () => {
        const cardId = testCards[1].id;

        return supertest(app)
          .delete(`/api/cards/${cardId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(204)
          .then((res) => {
            return supertest(app)
              .get(`/api/cards/${cardId}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect(404, {
                error: `Card doesn't exist`,
              });
          });
      });
    });
  });
});
