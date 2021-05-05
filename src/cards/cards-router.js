const express = require('express');
const path = require('path');
const RackItemsService = require('./cards-service');
const { requireAuth } = require('../middleware/jwt-auth');
const { validateRackItemRequest } = require('../middleware/validate-request');

const rackItemsRouter = express.Router();
const jsonBodyParser = express.json();

rackItemsRouter
  .route('/')
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { id } = req.user;
    const { item_name, item_url, item_price, rack_id } = req.body;
    const newRackItem = { item_name, item_price, rack_id };

    for (const [key, value] of Object.entries(newRackItem))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    newRackItem.item_url = item_url;
    newRackItem.user_id = id;

    RackItemsService.insertRackItem(req.app.get('db'), newRackItem)
      .then((item) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${item.item_id}`))
          .json(RackItemsService.serializeRackItem(item));
      })
      .catch(next);
  });

rackItemsRouter
  .route('/:itemId')
  .all(requireAuth)
  .all(validateRackItemRequest)
  .get((req, res, next) => {
    res.json(RackItemsService.serializeRackItem(res.rackItem));
  })
  .patch(jsonBodyParser, (req, res, next) => {
    const { id } = req.user;
    const { itemId } = req.params;
    const { item_name, item_price, item_url } = req.body;
    const updatedRackItem = { item_name, item_price };

    for (const [key, value] of Object.entries(updatedRackItem))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    updatedRackItem.item_url = item_url;
    updatedRackItem.user_id = id;

    RackItemsService.updateRackItem(
      req.app.get('db'),
      id,
      itemId,
      updatedRackItem
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    const { id } = req.user;
    const { itemId } = req.params;

    RackItemsService.deleteRackItem(req.app.get('db'), id, itemId)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = rackItemsRouter;
