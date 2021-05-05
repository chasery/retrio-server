const xss = require('xss');

const CardsService = {
  // getRackItemById(db, itemId) {
  //   return db
  //     .from('ru_rack_items')
  //     .select('*')
  //     .where({ item_id: itemId })
  //     .first();
  // },
  // insertRackItem(db, newRackItem) {
  //   return db
  //     .insert(newRackItem)
  //     .into('ru_rack_items')
  //     .returning('*')
  //     .then(([rackItem]) => rackItem)
  //     .then((rackItem) =>
  //       RackItemsService.getRackItemById(db, rackItem.item_id)
  //     );
  // },
  // updateRackItem(db, userId, itemId, updatedRackItem) {
  //   return db
  //     .from('ru_rack_items')
  //     .select('*')
  //     .where({ item_id: itemId, user_id: userId })
  //     .first()
  //     .update(updatedRackItem);
  // },
  // deleteRackItem(db, userId, itemId) {
  //   return db
  //     .from('ru_rack_items')
  //     .select('*')
  //     .where({ item_id: itemId, user_id: userId })
  //     .first()
  //     .delete();
  // },
  serializeCard(card) {
    return {
      card_id: card.card_id,
      category: card.category,
      headline: xss(card.headline),
      text: xss(card.text),
      created_at: new Date(card.created_at),
      updated_at: new Date(card.updated_at),
      user: card.user,
    };
  },
};

module.exports = CardsService;
