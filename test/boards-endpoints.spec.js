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
  } = helpers.makeBoardsFixtures();
  const testUser = testUsers[0];

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

    context(`Given an XSS attack rack`, () => {
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

    // describe(`POST /api/racks`, () => {
    //   beforeEach('insert racks', () =>
    //     helpers.seedRacksTables(db, testUsers, testBoards)
    //   );

    //   it(`responds with 400 and an error message when the 'rack_name' is missing`, () => {
    //     const newRack = {};

    //     return supertest(app)
    //       .post('/api/racks')
    //       .set('Authorization', helpers.makeAuthHeader(testUser))
    //       .send(newRack)
    //       .expect(400, {
    //         error: `Missing 'rack_name' in request body`,
    //       });
    //   });

    //   it(`responds with 201 and the new rack`, function () {
    //     this.retries(3);
    //     const newRack = {
    //       rack_name: 'Test new rack',
    //     };

    //     return supertest(app)
    //       .post('/api/racks')
    //       .set('Authorization', helpers.makeAuthHeader(testUser))
    //       .send(newRack)
    //       .expect(201)
    //       .expect((res) => {
    //         expect(res.body).to.have.property('rack_id');
    //         expect(res.body.rack_name).to.eql(newRack.rack_name);
    //         expect(res.body.user_id).to.eql(testUser.id);
    //         expect(res.body.items).to.eql([]);
    //         expect(res.headers.location).to.eql(`/api/racks/${res.body.rack_id}`);
    //         const expectedDate = new Date().toLocaleString();
    //         const actualDate = new Date(res.body.created_at).toLocaleString();
    //         expect(actualDate).to.eql(expectedDate);
    //       })
    //       .expect((res) =>
    //         db
    //           .from('ru_racks')
    //           .select('*')
    //           .where({ rack_id: res.body.rack_id })
    //           .first()
    //           .then((row) => {
    //             expect(row.rack_name).to.eql(newRack.rack_name);
    //             expect(row.user_id).to.eql(testUser.id);
    //             expect(row.items).to.eql([]);
    //             const expectedDate = new Date().toLocaleString();
    //             const actualDate = new Date(row.created_at).toLocaleString();
    //             expect(actualDate).to.eql(expectedDate);
    //           })
    //       );
    //   });
    // });

    // describe('PATCH /api/racks/:rackId', () => {
    //   context('Given no racks', () => {
    //     beforeEach(() => helpers.seedUsers(db, testUsers));

    //     it('responds with a 404', () => {
    //       const rackId = 123456;
    //       const updateToRack = {
    //         rack_name: 'BEET IT',
    //       };

    //       return supertest(app)
    //         .patch(`/api/racks/${rackId}`)
    //         .set('Authorization', helpers.makeAuthHeader(testUser))
    //         .send(updateToRack)
    //         .expect(404, { error: "Rack doesn't exist" });
    //     });
    //   });

    //   context('Given there are racks', () => {
    //     beforeEach('insert racks', () =>
    //       helpers.seedRacksTables(db, testUsers, testBoards)
    //     );

    //     it('responds with 204 and rack is updated', () => {
    //       const rackId = 1;
    //       const updateToRack = {
    //         rack_name: 'BEET IT',
    //       };
    //       let expectedRack = helpers.makeExpectedRack(testBoards[rackId - 1]);
    //       expectedRack = {
    //         ...expectedRack,
    //         ...updateToRack,
    //       };

    //       return supertest(app)
    //         .patch(`/api/racks/${rackId}`)
    //         .set('Authorization', helpers.makeAuthHeader(testUser))
    //         .send(updateToRack)
    //         .expect(204)
    //         .then((res) =>
    //           supertest(app)
    //             .get(`/api/racks/${rackId}`)
    //             .set('Authorization', helpers.makeAuthHeader(testUser))
    //             .expect(expectedRack)
    //         );
    //     });

    //     it('responds with 204 and ignores bad key value pair', () => {
    //       const rackId = 1;
    //       const updateToRack = {
    //         rack_name: 'BEET IT',
    //       };
    //       let expectedRack = helpers.makeExpectedRack(testBoards[rackId - 1]);
    //       expectedRack = {
    //         ...expectedRack,
    //         ...updateToRack,
    //       };

    //       return supertest(app)
    //         .patch(`/api/racks/${rackId}`)
    //         .set('Authorization', helpers.makeAuthHeader(testUser))
    //         .send({
    //           ...updateToRack,
    //           fieldToIgnore: 'this should not be in the GET response',
    //         })
    //         .expect(204)
    //         .then((res) =>
    //           supertest(app)
    //             .get(`/api/racks/${rackId}`)
    //             .set('Authorization', helpers.makeAuthHeader(testUser))
    //             .expect(expectedRack)
    //         );
    //     });

    //     it('responds with 400 when no required fields supplied', () => {
    //       const rackId = 1;

    //       return supertest(app)
    //         .patch(`/api/racks/${rackId}`)
    //         .set('Authorization', helpers.makeAuthHeader(testUser))
    //         .send({ irrelevantField: 'foo' })
    //         .expect(400, {
    //           error: "Missing 'rack_name' in request body",
    //         });
    //     });

    //     it('responds with 401 when rack user_id !== auth user_id', () => {
    //       const rackId = 3;
    //       const updateToRack = {
    //         rack_name: 'BEET IT',
    //       };
    //       let expectedRack = helpers.makeExpectedRack(testBoards[rackId - 1]);
    //       expectedRack = {
    //         ...expectedRack,
    //         ...updateToRack,
    //       };

    //       return supertest(app)
    //         .patch(`/api/racks/${rackId}`)
    //         .set('Authorization', helpers.makeAuthHeader(testUser))
    //         .send(updateToRack)
    //         .expect(401, {
    //           error: `Unauthorized request`,
    //         });
    //     });
    //   });
    // });

    // describe('DELETE /api/racks/:rackId', () => {
    //   context('Given no racks', () => {
    //     beforeEach(() => helpers.seedUsers(db, testUsers));

    //     it('responds with 404', () => {
    //       const rackId = 123456;

    //       return supertest(app)
    //         .delete(`/api/racks/${rackId}`)
    //         .set('Authorization', helpers.makeAuthHeader(testUser))
    //         .expect(404, { error: "Rack doesn't exist" });
    //     });
    //   });

    //   context('Given there are racks', () => {
    //     beforeEach('insert racks', () =>
    //       helpers.seedRacksTables(db, testUsers, testBoards, testRackItems)
    //     );

    //     it('responds with 204 and the rack is deleted in the db', () => {
    //       const rackId = 1;
    //       const expectedRackItems = testRackItems
    //         .filter(
    //           (item) => item.rack_id !== rackId && item.user_id === testUser.id
    //         )
    //         .map((item) => helpers.makeExpectedRackItem(item));
    //       const expectedRacks = testBoards
    //         .filter(
    //           (rack) => rack.rack_id !== rackId && rack.user_id === testUser.id
    //         )
    //         .map((rack) => helpers.makeExpectedRack(rack, expectedRackItems));

    //       return supertest(app)
    //         .delete(`/api/racks/${rackId}`)
    //         .set('Authorization', helpers.makeAuthHeader(testUser))
    //         .expect(204)
    //         .then((res) =>
    //           supertest(app)
    //             .get('/api/racks')
    //             .set('Authorization', helpers.makeAuthHeader(testUser))
    //             .expect(expectedRacks)
    //         );
    //     });
    // });
  });
});
