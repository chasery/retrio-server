const xss = require('xss');
const { serializeUser } = require('../users/users-service');

const TeamsService = {
  getUserTeams(db, userId) {
    return db
      .from('team_members')
      .select('team_members.owner', 'teams.id', 'teams.name')
      .where('user_id', userId)
      .leftJoin('teams', 'team_members.team_id', 'teams.id')
      .orderBy('teams.name', 'asc');
  },
  getTeamById(db, teamId) {
    return db
      .from('team_members')
      .where('team_members.team_id', teamId)
      .select(
        'team_members.owner',
        'teams.id',
        'teams.name',
        'users.id AS user_id',
        'users.email',
        'users.first_name',
        'users.last_name'
      )
      .leftJoin('teams', 'team_members.team_id', 'teams.id')
      .leftJoin('users', 'team_members.user_id', 'users.id')
      .orderBy([
        { column: 'team_members.owner', order: 'desc' },
        'users.first_name',
      ])
      .then((members) => {
        // Returns all of the members in an array to be passed into our reducer to form a nice team object
        const reducedTeam = TeamsService.teamReducer(members);
        return reducedTeam;
      });
  },
  getMembersByTeamId(db, teamId) {
    return db
      .from('team_members')
      .where('team_id', teamId)
      .select('team_id', 'user_id');
  },
  insertTeam(db, newTeam, user) {
    return db.transaction((trx) => {
      return trx
        .insert(newTeam)
        .into('teams')
        .returning('*')
        .then(([team]) => {
          const { id } = team;
          const newTeamMember = {
            team_id: id,
            user_id: user,
            owner: true,
          };
          return this.insertTeamMember(trx, newTeamMember);
        })
        .then(([teamMember]) => {
          const { team_id } = teamMember;
          return this.getTeamById(trx, team_id);
        });
    });
  },
  insertTeamMember(db, newTeamMember) {
    return db.insert(newTeamMember).into('team_members').returning('*');
  },
  insertTeamMemberBoards(db, newTeamMember) {
    return db.transaction((trx) => {
      return this.insertTeamMember(trx, newTeamMember).then(([teamMember]) => {
        const { team_id, user_id } = teamMember;

        return trx
          .from('boards')
          .where('boards.team_id', team_id)
          .select('boards.id')
          .then((teamBoards) => {
            if (teamBoards.length) {
              const newUserBoards = teamBoards.map((board) => {
                return {
                  user_id,
                  board_id: board.id,
                  owner: false,
                };
              });
              return trx
                .insert(newUserBoards)
                .into('user_boards')
                .returning('*');
            }
            return;
          })
          .then(() => teamMember);
      });
    });
  },
  updateTeam(db, teamId, updatedTeam) {
    return db
      .from('teams')
      .where('teams.id', teamId)
      .select('*')
      .first()
      .update(updatedTeam);
  },
  deleteTeam(db, teamId) {
    return db
      .from('teams')
      .select('*')
      .where('teams.id', teamId)
      .first()
      .delete();
  },
  deleteTeamMember(db, teamId, memberId) {
    return db.transaction((trx) => {
      return trx
        .from('team_members')
        .select('*')
        .where({
          'team_members.team_id': teamId,
          'team_members.user_id': memberId,
        })
        .first()
        .delete()
        .then(() => {
          return trx
            .from('boards')
            .where('boards.team_id', teamId)
            .select('boards.id')
            .then((teamBoards) => {
              if (teamBoards.length) {
                const boardIds = teamBoards.map((board) => board.id);

                return trx
                  .from('user_boards')
                  .select('*')
                  .whereIn('board_id', boardIds)
                  .where('user_id', memberId)
                  .delete();
              }
              return;
            });
        });
    });
  },
  teamReducer(members) {
    return members.reduce((team, member) => {
      const { id, name, ...theMember } = member;
      team.id = id;
      team.name = name;

      if (!team.members) {
        team.members = [];
      }

      if (member.user_id) {
        team.members.push({
          ...theMember,
        });
      }

      return team;
    }, {});
  },
  serializeTeam(team) {
    let serializedTeam = {
      id: team.id,
      name: xss(team.name),
      owner: team.owner,
    };

    if (team.members)
      team.members = team.members.map((member) => serializeUser(member));

    serializedTeam = {
      ...serializedTeam,
      members: team.members,
    };

    return serializedTeam;
  },
};

module.exports = TeamsService;
