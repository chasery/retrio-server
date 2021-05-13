const express = require('express');
const path = require('path');
const { getUsersByBoardId } = require('../boards/boards-service');
const CardsService = require('./cards-service');
const { requireAuth } = require('../middleware/jwt-auth');
const { validateCardRequest } = require('../middleware/validate-request');

const cardsRouter = express.Router();
const jsonBodyParser = express.json();

cardsRouter.route('/').post(requireAuth, jsonBodyParser, (req, res, next) => {
  const { id } = req.user;
  const { board_id, category, headline, text } = req.body;
  const newCard = { board_id, category, text };

  for (const [key, value] of Object.entries(newCard))
    if (value == null)
      return res.status(400).json({
        error: `Missing '${key}' in request body`,
      });

  newCard.headline = headline;
  newCard.created_by = id;

  getUsersByBoardId(req.app.get('db'), board_id).then((users) => {
    const user = users.find((user) => user.user_id === id);
    if (!user)
      return res.status(401).json({
        error: `Unauthorized request`,
      });

    CardsService.insertCard(req.app.get('db'), newCard)
      .then((card) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${card.id}`))
          .json(CardsService.serializeCard(card));
      })
      .catch(next);
  });
});

cardsRouter
  .route('/:cardId')
  .all(requireAuth)
  .all(validateCardRequest)
  .get((req, res, next) => {
    res.json(CardsService.serializeCard(res.card));
  })
  .patch(jsonBodyParser, (req, res, next) => {
    const { id } = req.user;
    const { cardId } = req.params;
    const { category, headline, text } = req.body;
    const updatedCard = { category, text };

    for (const [key, value] of Object.entries(updatedCard))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    updatedCard.headline = headline;
    updatedCard.created_by = id;

    CardsService.updateCard(req.app.get('db'), id, cardId, updatedCard)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    const { id } = req.user;
    const { cardId } = req.params;

    CardsService.deleteCard(req.app.get('db'), cardId)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = cardsRouter;
