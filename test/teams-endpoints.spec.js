const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Teams Endpoints', function () {
  let db;

  const {
    testUsers,
    testTeams,
    testTeamMembers,
  } = helpers.makeBoardsFixtures();
  const testUser = testUsers[0];
  const testTeam = testTeams[0];

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

  describe(`GET /api/teams`, () => {
    context(`Given testUser has no teams`, () => {
      beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

      it(`responds with 200 and no teams for userId`, () => {
        return supertest(app)
          .get('/api/teams')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, []);
      });
    });

    context(`Given testUser has teams`, () => {
      beforeEach('insert required teams data', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
      });

      it("responds with 200 and only the userId's teams", () => {
        const expectedTeams = testTeamMembers
          .filter((teamMember) => teamMember.user_id === testUser.id)
          .map((teamMember) => {
            let team = testTeams.find((team) => team.id === teamMember.team_id);
            return helpers.makeExpectedTeam({
              ...team,
              owner: teamMember.owner,
            });
          })
          .sort(function (a, b) {
            return (
              (b.owner === false) - (a.owner === false) ||
              a.first_name
                .toLowerCase()
                .localeCompare(b.first_name.toLowerCase())
            );
          });

        return supertest(app)
          .get('/api/teams')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, expectedTeams);
      });
    });

    context(`Given an XSS attack team`, () => {
      const {
        teamMember,
        maliciousTeam,
        expectedTeam,
      } = helpers.makeMaliciousTeam(testUser);

      beforeEach('insert malicious team', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, [maliciousTeam], [teamMember]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/teams')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect((res) => {
            expect(res.body[0].name).to.eql(expectedTeam.name);
          });
      });
    });
  });

  describe(`GET /api/teams/:teamId`, () => {
    context(`Given no teams`, () => {
      beforeEach(() => helpers.seedUsers(db, testUsers));

      it(`responds with 404`, () => {
        const teamId = 123456;
        return supertest(app)
          .get(`/api/teams/${teamId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(404, { error: `Team doesn't exist` });
      });
    });

    context(`Given testUser has teams`, () => {
      beforeEach('insert required teams data', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
      });

      it("responds with 200 and only the userId's team", () => {
        const expectedTeamMembers = testTeamMembers
          .filter((member) => member.team_id === testTeam.id)
          .map((member) => {
            const expectedUser = testUsers.find(
              (user) => user.id === member.user_id
            );
            return helpers.makeExpectedTeamMember(expectedUser, member.owner);
          });
        const expectedTeam = {
          id: testTeam.id,
          name: testTeam.name,
          members: expectedTeamMembers,
        };

        return supertest(app)
          .get(`/api/teams/${testTeam.id}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200, expectedTeam);
      });
    });

    context(`Given an XSS attack team`, () => {
      const {
        teamMember,
        maliciousTeam,
        expectedTeam,
      } = helpers.makeMaliciousTeam(testUser, testUser);

      beforeEach('insert malicious team', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, [maliciousTeam], [teamMember]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/teams/${maliciousTeam.id}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect((res) => {
            expect(res.body.name).to.eql(expectedTeam.name);
            expect(res.body.members[0].first_name).to.eql(testUser.first_name);
            expect(res.body.members[0].last_name).to.eql(testUser.last_name);
          });
      });
    });
  });

  describe(`POST /api/teams`, () => {
    beforeEach('insert users', async () => {
      await helpers.seedUsers(db, testUsers);
    });

    const requiredFields = ['name'];

    requiredFields.forEach((field) => {
      const newTeam = {
        name: 'The Beets',
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newTeam[field];

        return supertest(app)
          .post('/api/teams')
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(newTeam)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          });
      });
    });

    it(`responds with 201 and the new team`, function () {
      this.retries(3);
      const newTeam = {
        name: 'The Beets',
      };

      return supertest(app)
        .post('/api/teams')
        .set('Authorization', helpers.makeAuthHeader(testUser))
        .send(newTeam)
        .expect(201)
        .expect((res) => {
          expect(res.body).to.have.property('id');
          expect(res.body.name).to.eql(newTeam.name);
          expect(res.body.members[0].owner).to.eql(true);
          expect(res.headers.location).to.eql(`/api/teams/${res.body.id}`);
        })
        .expect((res) =>
          db
            .from('team_members')
            .select(
              'team_members.owner',
              'team_members.user_id',
              'teams.id',
              'teams.name',
              'teams.created_at',
              'teams.updated_at'
            )
            .leftJoin('teams', 'team_members.board_id', 'teams.id')
            .where('team_members.team_id', res.body.id)
            .first()
            .then((row) => {
              expect(row.name).to.eql(newTeam.name);
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

  describe('PATCH /api/teams/:teamId', () => {
    context('Given no teams', () => {
      beforeEach(() => helpers.seedUsers(db, testUsers));

      it('responds with a 404', () => {
        const teamId = 123456;
        const updateToTeam = {
          name: 'The Beets',
        };

        return supertest(app)
          .patch(`/api/teams/${teamId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(updateToTeam)
          .expect(404, { error: "Team doesn't exist" });
      });
    });

    context('Given there are teams', () => {
      beforeEach('insert teams', async () => {
        await helpers.seedUsers(db, testUsers);
        await helpers.seedTeams(db, testTeams, testTeamMembers);
      });

      it('responds with 204 and team is updated', () => {
        const teamId = testTeam.id;
        const expectedTeamMembers = testTeamMembers
          .filter((member) => member.team_id === testTeam.id)
          .map((member) => {
            const expectedUser = testUsers.find(
              (user) => user.id === member.user_id
            );
            return helpers.makeExpectedTeamMember(expectedUser, member.owner);
          });
        let expectedTeam = {
          id: testTeam.id,
          name: testTeam.name,
          members: expectedTeamMembers,
        };
        const updatedTeam = {
          name: 'The Beets',
        };

        expectedTeam = {
          ...expectedTeam,
          name: updatedTeam.name,
        };

        return supertest(app)
          .patch(`/api/teams/${teamId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(updatedTeam)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/teams/${teamId}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect(expectedTeam)
          );
      });

      it('responds with 204 and ignores bad key value pair', () => {
        const teamId = testTeam.id;
        const expectedTeamMembers = testTeamMembers
          .filter((member) => member.team_id === testTeam.id)
          .map((member) => {
            const expectedUser = testUsers.find(
              (user) => user.id === member.user_id
            );
            return helpers.makeExpectedTeamMember(expectedUser, member.owner);
          });
        let expectedTeam = {
          id: testTeam.id,
          name: testTeam.name,
          members: expectedTeamMembers,
        };
        const updatedTeam = {
          name: 'The Beets',
        };

        expectedTeam = {
          ...expectedTeam,
          name: updatedTeam.name,
        };

        return supertest(app)
          .patch(`/api/teams/${teamId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send({
            ...updatedTeam,
            fieldToIgnore: 'this should not be in the GET response',
          })
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/teams/${teamId}`)
              .set('Authorization', helpers.makeAuthHeader(testUser))
              .expect(expectedTeam)
          );
      });

      const requiredFields = ['name'];

      requiredFields.forEach((field) => {
        const teamId = testTeam.id;
        const updatedTeam = {
          name: 'The Beets',
        };

        it(`responds with 400 and an error message when the '${field}' is missing`, () => {
          delete updatedTeam[field];

          return supertest(app)
            .patch(`/api/teams/${teamId}`)
            .set('Authorization', helpers.makeAuthHeader(testUser))
            .send(updatedTeam)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            });
        });
      });

      it(`responds with 401 when team owner's user_id !== auth user_id`, () => {
        const teamId = 3;
        const updatedTeam = {
          name: 'BEET IT',
        };

        return supertest(app)
          .patch(`/api/teams/${teamId}`)
          .set('Authorization', helpers.makeAuthHeader(testUser))
          .send(updatedTeam)
          .expect(401, {
            error: `Unauthorized request`,
          });
      });
    });
  });

  // describe('DELETE /api/boards/:boardId', () => {
  //   context('Given no boards', () => {
  //     beforeEach(() => helpers.seedUsers(db, testUsers));

  //     it('responds with 404', () => {
  //       const boardId = 123456;

  //       return supertest(app)
  //         .delete(`/api/boards/${boardId}`)
  //         .set('Authorization', helpers.makeAuthHeader(testUser))
  //         .expect(404, { error: "Board doesn't exist" });
  //     });
  //   });

  //   context('Given there are boards', () => {
  //     beforeEach('insert boards', async () => {
  //       await helpers.seedUsers(db, testUsers);
  //       await helpers.seedTeams(db, testTeams, testTeamMembers);
  //       await helpers.seedBoards(db, testBoards, testUserBoards, testCards);
  //     });

  //     it('responds with 204 and the board is deleted in the db', () => {
  //       const boardId = 1;
  //       const expectedBoards = testUserBoards
  //         .filter(
  //           (userBoard) =>
  //             userBoard.user_id === testUser.id &&
  //             userBoard.board_id !== boardId
  //         )
  //         .map((userBoard) => {
  //           let board = testBoards.find(
  //             (board) => board.id === userBoard.board_id
  //           );
  //           return helpers.makeExpectedBoard({
  //             ...board,
  //             owner: userBoard.owner,
  //           });
  //         })
  //         .sort(function (a, b) {
  //           return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  //         });

  //       return supertest(app)
  //         .delete(`/api/boards/${boardId}`)
  //         .set('Authorization', helpers.makeAuthHeader(testUser))
  //         .expect(204)
  //         .then((res) =>
  //           supertest(app)
  //             .get('/api/boards')
  //             .set('Authorization', helpers.makeAuthHeader(testUser))
  //             .expect(expectedBoards)
  //         );
  //     });
  //   });
  // });
});
