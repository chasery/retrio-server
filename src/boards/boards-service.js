const xss = require('xss');

const BoardsService = {
  getUserBoards(db, userId) {
    return db
      .from('user_boards')
      .select(
        'user_boards.owner',
        'boards.id',
        'boards.name',
        'boards.created_at',
        'boards.updated_at'
      )
      .where('user_id', userId)
      .leftJoin('boards', 'user_boards.board_id', 'boards.id')
      .orderBy('boards.name', 'asc');
  },
  getBoardById(db, userId, boardId) {
    return db
      .from('user_boards')
      .where({ 'user_boards.board_id': boardId, 'user_boards.user_id': userId })
      .select(
        'user_boards.owner',
        'boards.id',
        'boards.name',
        'cards.id as card_id',
        'cards.category',
        'cards.headline',
        'cards.text',
        'cards.created_at AS card_created_at',
        'cards.updated_at AS card_updated_at',
        'users.id AS user_id',
        'users.first_name',
        'users.last_name'
      )
      .leftJoin('boards', 'user_boards.board_id', 'boards.id')
      .leftJoin('cards', 'boards.id', 'cards.board_id')
      .leftJoin('users', 'cards.created_by', 'users.id')
      .orderBy('cards.category', 'asc')
      .then((cards) => {
        // Returns all of the cards in an array to be passed into our reducer to form a nice board object
        const reducedBoard = BoardsService.boardReducer(cards);
        return reducedBoard;
      });
  },
  insertBoard(db, newBoard) {
    return db.insert(newBoard).into('boards').returning('*');
  },
  insertUserBoard(db, newUserBoard) {
    return db.insert(newUserBoard).into('user_boards').returning('*');
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
  boardReducer(cards) {
    return cards.reduce((board, card) => {
      const {
        id,
        name,
        owner,
        user_id,
        first_name,
        last_name,
        ...theCard
      } = card;
      board.id = id;
      board.name = name;
      board.owner = owner;

      if (!board.cards) {
        board.cards = [];
      }

      if (card.card_id) {
        board.cards.push({
          ...theCard,
          user: { user_id, first_name, last_name },
        });
      }
      return board;
    }, {});
  },
  serializeBoard(board) {
    let serializedBoard = {
      id: board.id,
      name: xss(board.name),
      owner: board.owner,
    };

    if (board.created_at && board.updated_at)
      serializedBoard = {
        ...serializedBoard,
        created_at: new Date(board.created_at),
        updated_at: new Date(board.updated_at),
      };

    if (board.cards)
      serializedBoard = {
        ...serializedBoard,
        cards: board.cards,
      };

    return serializedBoard;
  },
};

module.exports = BoardsService;
