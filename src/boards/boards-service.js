const xss = require('xss');

const BoardsService = {
  getUserBoards(db, userId) {
    return db
      .from('user_boards')
      .select(
        'user_boards.owner',
        'boards.id',
        'boards.name',
        'boards.team_id',
        'boards.created_at',
        'boards.updated_at'
      )
      .where('user_id', userId)
      .leftJoin('boards', 'board_id', 'boards.id')
      .orderBy('boards.name', 'asc');
  },
  insertBoard(db, newBoard) {
    return db
      .insert(newBoard)
      .into('boards')
      .returning('*')
      .then(([board]) => board)
      .then((board) => BoardsService.getBoardById(db, board.id));
  },
  updateBoard(db, userId, boardId, updatedBoard) {
    return db
      .from('boards')
      .select('*')
      .where({ id: boardId, user_id: userId })
      .first()
      .update(updatedBoard);
  },
  deleteBoard(db, userId, boardId) {
    return db
      .from('boards')
      .select('*')
      .where({ id: boardId, user_id: userId })
      .first()
      .delete();
  },
  serializeBoard(board) {
    return {
      id: board.id,
      name: xss(board.name),
      owner: board.owner,
      team_id: board.team_id,
      created_at: new Date(board.created_at),
      updated_at: new Date(board.updated_at),
    };
  },
};

module.exports = BoardsService;
