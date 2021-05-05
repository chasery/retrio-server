const xss = require('xss');
const { serializeCard } = require('../cards/cards-service');

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
        'users.email',
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
  getUserBoardById(db, boardId) {
    return db
      .from('user_boards')
      .where('board_id', boardId)
      .select('board_id', 'user_id')
      .then(([userBoard]) => userBoard);
  },
  insertBoard(db, newBoard, user) {
    return db.transaction((trx) => {
      return trx
        .insert(newBoard)
        .into('boards')
        .returning('*')
        .then(([board]) => {
          const { id } = board;
          const newUserBoard = {
            board_id: id,
            user_id: user,
            owner: true,
          };
          return this.insertUserBoard(trx, newUserBoard);
        })
        .then(([userBoard]) => {
          const { board_id, user_id } = userBoard;
          return this.getBoardById(trx, user_id, board_id);
        });
    });
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
        category,
        user_id,
        email,
        first_name,
        last_name,
        card_created_at,
        card_updated_at,
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
          category: parseFloat(category),
          created_at: card_created_at,
          updated_at: card_updated_at,
          user: { user_id, email, first_name, last_name },
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
      board.cards = board.cards.map((card) => serializeCard(card));

    serializedBoard = {
      ...serializedBoard,
      cards: board.cards,
    };

    return serializedBoard;
  },
};

module.exports = BoardsService;
