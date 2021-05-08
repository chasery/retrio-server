const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Boards Endpoints', function () {
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

  describe(`GET /api/boards`, () => {
    context(`Given testUser has no boards`, () => {
      beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

      it(`responds with 200 and no boards for userId`, () => {
        return supertest(app)
          .get('/api/boards')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, []);
      });
    });

    context(`Given testUser has boards`, () => {
      beforeEach('insert required boards data', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
        await helpers.seedBoards(db, testBoards, testUserBoards);
      });

      it("responds with 200 and only the userId's boards", () => {
        const expectedBoards = testUserBoards
          .filter((userBoard) => userBoard.user_id === testUser.id)
          .map((userBoard) => {
            let board = testBoards.find(
              (board) => board.id === userBoard.board_id
            );
            return helpers.makeExpectedBoard({
              ...board,
              owner: userBoard.owner,
            });
          })
          .sort(function (a, b) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          });

        return supertest(app)
          .get('/api/boards')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, expectedBoards);
      });
    });

    context(`Given an XSS attack board`, () => {
      const {
        userBoard,
        maliciousBoard,
        expectedBoard,
      } = helpers.makeMaliciousBoard(testUser);

      beforeEach('insert malicious board', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
        await helpers.seedBoards(db, [maliciousBoard], [userBoard]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/boards')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect((res) => {
            expect(res.body[0].name).to.eql(expectedBoard.name);
          });
      });
    });

    describe(`GET /api/boards/:boardId`, () => {
      context(`Given no boards`, () => {
        beforeEach(() => helpers.seedUsers(db, testUsers));

        it(`responds with 404`, () => {
          const boardId = 123456;
          return supertest(app)
            .get(`/api/boards/${boardId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(404, { error: `Board doesn't exist` });
        });
      });

      context(`Given testUser has boards`, () => {
        beforeEach('insert required boards data', async () => {
          await helpers.seedUsers(db, testUsers);
          await helpers.seedTeams(db, testTeams, testTeamMembers);
          await helpers.seedBoards(db, testBoards, testUserBoards, testCards);
        });

        it("responds with 200 and only the userId's board", () => {
          const expectedCards = testCards
            .filter((card) => card.board_id === testBoard.id)
            .map((card) => {
              const expectedUser = testUsers.find(
                (user) => user.id === card.created_by
              );
              return helpers.makeExpectedCard(expectedUser, card);
            });
          const expectedBoard = {
            id: testBoard.id,
            name: testBoard.name,
            team_id: testBoard.team_id,
            owner: testUserBoard.owner,
            cards: expectedCards,
          };

          return supertest(app)
            .get(`/api/boards/${testBoard.id}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(200, expectedBoard);
        });
      });

      context(`Given an XSS attack board`, () => {
        const { maliciousCard, expectedCard } = helpers.makeMaliciousCard(
          testUser
        );
        const {
          userBoard,
          maliciousBoard,
          expectedBoard,
        } = helpers.makeMaliciousBoard(testUser, expectedCard);

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
            .get(`/api/boards/${maliciousBoard.id}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(200)
            .expect((res) => {
              expect(res.body.name).to.eql(expectedBoard.name);
              expect(res.body.cards[0].headline).to.eql(expectedCard.headline);
              expect(res.body.cards[0].text).to.eql(expectedCard.text);
            });
        });
      });
    });

    describe(`POST /api/boards`, () => {
      beforeEach('insert boards', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
        await helpers.seedBoards(db, testBoards, testUserBoards, testCards);
      });

      const requiredFields = ['name', 'team_id'];

      requiredFields.forEach((field) => {
        const newBoard = {
          name: 'Beets Board',
          team_id: 1,
        };

        it(`responds with 400 and an error message when the '${field}' is missing`, () => {
          delete newBoard[field];

          return supertest(app)
            .post('/api/boards')
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(newBoard)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            });
        });
      });

      it(`responds with 201 and the new board`, function () {
        this.retries(3);
        const newBoard = {
          name: 'New Test Board',
          team_id: testTeam.id,
        };

        return supertest(app)
          .post('/api/boards')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newBoard)
          .expect(201)
          .expect((res) => {
            expect(res.body).to.have.property('id');
            expect(res.body.name).to.eql(newBoard.name);
            expect(res.body.owner).to.eql(true);
            expect(res.body.cards).to.eql([]);
            expect(res.headers.location).to.eql(`/api/boards/${res.body.id}`);
          })
          .expect((res) =>
            db
              .from('user_boards')
              .select(
                'user_boards.owner',
                'user_boards.user_id',
                'boards.id',
                'boards.name',
                'boards.team_id',
                'boards.created_at',
                'boards.updated_at'
              )
              .leftJoin('boards', 'user_boards.board_id', 'boards.id')
              .where('boards.id', res.body.id)
              .first()
              .then((row) => {
                expect(row.name).to.eql(newBoard.name);
                expect(row.team_id).to.eql(newBoard.team_id);
                expect(row.user_id).to.eql(testUser.id);
                expect(row.owner).to.eql(true);
                const expectedDate = new Date().toLocaleString();
                const createdDate = new Date(row.created_at).toLocaleString();
                const updatedDate = new Date(row.updated_at).toLocaleString();
                expect(createdDate).to.eql(expectedDate);
                expect(updatedDate).to.eql(expectedDate);
              })
          );
      });
    });

    describe('PATCH /api/boards/:boardId', () => {
      context('Given no boards', () => {
        beforeEach(() => helpers.seedUsers(db, testUsers));

        it('responds with a 404', () => {
          const boardId = 123456;
          const updateToBoard = {
            name: 'BEET IT',
            team_id: testTeam.id,
          };

          return supertest(app)
            .patch(`/api/boards/${boardId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(updateToBoard)
            .expect(404, { error: "Board doesn't exist" });
        });
      });

      context('Given there are boards', () => {
        beforeEach('insert boards', async () => {
          await helpers.seedUsers(db, testUsers);
          await helpers.seedTeams(db, testTeams, testTeamMembers);
          await helpers.seedBoards(db, testBoards, testUserBoards, testCards);
        });

        it('responds with 204 and board is updated', () => {
          const boardId = 1;
          const expectedCards = testCards
            .filter((card) => card.board_id === testBoard.id)
            .map((card) => {
              const expectedUser = testUsers.find(
                (user) => user.id === card.created_by
              );
              return helpers.makeExpectedCard(expectedUser, card);
            });
          let expectedBoard = {
            id: testBoard.id,
            name: testBoard.name,
            owner: testUserBoard.owner,
            cards: expectedCards,
          };
          const updatedBoard = {
            name: 'BEET IT',
            team_id: testTeams[1].id,
          };

          expectedBoard = {
            ...expectedBoard,
            name: updatedBoard.name,
            team_id: updatedBoard.team_id,
          };

          return supertest(app)
            .patch(`/api/boards/${boardId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(updatedBoard)
            .expect(204)
            .then((res) =>
              supertest(app)
                .get(`/api/boards/${boardId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(expectedBoard)
            );
        });

        it('responds with 204 and ignores bad key value pair', () => {
          const boardId = 1;
          const expectedCards = testCards
            .filter((card) => card.board_id === testBoard.id)
            .map((card) => {
              const expectedUser = testUsers.find(
                (user) => user.id === card.created_by
              );
              return helpers.makeExpectedCard(expectedUser, card);
            });
          let expectedBoard = {
            id: testBoard.id,
            name: testBoard.name,
            team_id: testBoard.team_id,
            owner: testUserBoard.owner,
            cards: expectedCards,
          };
          const updatedBoard = {
            name: 'BEET IT',
            team_id: testTeams[1].id,
          };

          expectedBoard = {
            ...expectedBoard,
            name: updatedBoard.name,
            team_id: updatedBoard.team_id,
          };

          return supertest(app)
            .patch(`/api/boards/${boardId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send({
              ...updatedBoard,
              fieldToIgnore: 'this should not be in the GET response',
            })
            .expect(204)
            .then((res) =>
              supertest(app)
                .get(`/api/boards/${boardId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(expectedBoard)
            );
        });

        const requiredFields = ['name', 'team_id'];

        requiredFields.forEach((field) => {
          const boardId = 1;
          const updatedBoard = {
            name: 'Beets Board',
            team_id: 1,
          };

          it(`responds with 400 and an error message when the '${field}' is missing`, () => {
            delete updatedBoard[field];

            return supertest(app)
              .patch(`/api/boards/${boardId}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .send(updatedBoard)
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
      });
    });

    describe('DELETE /api/boards/:boardId', () => {
      context('Given no boards', () => {
        beforeEach(() => helpers.seedUsers(db, testUsers));

        it('responds with 404', () => {
          const boardId = 123456;

          return supertest(app)
            .delete(`/api/boards/${boardId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(404, { error: "Board doesn't exist" });
        });
      });

      context('Given there are boards', () => {
        beforeEach('insert boards', async () => {
          await helpers.seedUsers(db, testUsers);
          await helpers.seedTeams(db, testTeams, testTeamMembers);
          await helpers.seedBoards(db, testBoards, testUserBoards, testCards);
        });

        it('responds with 204 and the board is deleted in the db', () => {
          const boardId = 1;
          const expectedBoards = testUserBoards
            .filter(
              (userBoard) =>
                userBoard.user_id === testUser.id &&
                userBoard.board_id !== boardId
            )
            .map((userBoard) => {
              let board = testBoards.find(
                (board) => board.id === userBoard.board_id
              );
              return helpers.makeExpectedBoard({
                ...board,
                owner: userBoard.owner,
              });
            })
            .sort(function (a, b) {
              return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });

          return supertest(app)
            .delete(`/api/boards/${boardId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .expect(204)
            .then((res) =>
              supertest(app)
                .get('/api/boards')
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(expectedBoards)
            );
        });
      });
    });
  });
});
