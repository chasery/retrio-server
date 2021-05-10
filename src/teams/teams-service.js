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
  // insertBoard(db, newBoard, user) {
  //   return db.transaction((trx) => {
  //     return trx
  //       .insert(newBoard)
  //       .into('boards')
  //       .returning('*')
  //       .then(([board]) => {
  //         const { id } = board;
  //         const newUserBoard = {
  //           board_id: id,
  //           user_id: user,
  //           owner: true,
  //         };
  //         return this.insertUserBoard(trx, newUserBoard);
  //       })
  //       .then(([userBoard]) => {
  //         const { board_id, user_id } = userBoard;
  //         return this.getBoardById(trx, user_id, board_id);
  //       });
  //   });
  // },
  // insertUserBoard(db, newUserBoard) {
  //   return db.insert(newUserBoard).into('user_boards').returning('*');
  // },
  // updateBoard(db, boardId, updatedBoard) {
  //   return db
  //     .from('boards')
  //     .where('boards.id', boardId)
  //     .select('*')
  //     .first()
  //     .update(updatedBoard);
  // },
  // deleteBoard(db, boardId) {
  //   return db
  //     .from('boards')
  //     .select('*')
  //     .where('boards.id', boardId)
  //     .first()
  //     .delete();
  // },
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
