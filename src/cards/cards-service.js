const xss = require('xss');

const CardsService = {
  getCardById(db, cardId) {
    return db.from('cards').select('*').where('id', cardId).first();
  },
  insertCard(db, newCard) {
    return db
      .insert(newCard)
      .into('cards')
      .returning('*')
      .then(([card]) => card)
      .then((card) => CardsService.getCardById(db, card.id));
  },
  updateCard(db, userId, cardId, updatedCard) {
    return db
      .from('cards')
      .select('*')
      .where({ id: cardId, created_by: userId })
      .first()
      .update(updatedCard);
  },
  deleteCard(db, cardId) {
    return db.from('cards').select('*').where({ id: cardId }).first().delete();
  },
  serializeBoardCard(card) {
    return {
      card_id: card.card_id,
      category: parseFloat(card.category),
      headline: xss(card.headline),
      text: xss(card.text),
      created_at: new Date(card.created_at),
      updated_at: new Date(card.updated_at),
      user: card.user,
    };
  },
  serializeCard(card) {
    return {
      id: card.id,
      board_id: card.board_id,
      category: parseFloat(card.category),
      headline: xss(card.headline),
      text: xss(card.text),
      created_by: card.created_by,
      created_at: new Date(card.created_at),
      updated_at: new Date(card.updated_at),
    };
  },
};

module.exports = CardsService;
