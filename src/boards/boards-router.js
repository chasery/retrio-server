const express = require('express');
const path = require('path');
const BoardsService = require('./boards-service');
const { requireAuth } = require('../middleware/jwt-auth');
// const { validateBoardRequest } = require('../middleware/validate-request');

const boardsRouter = express.Router();
const jsonBodyParser = express.json();

boardsRouter
  .route('/')
  .all(requireAuth)
  .get((req, res, next) => {
    const { id } = req.user;

    BoardsService.getUserBoards(req.app.get('db'), id)
      .then((boards) => {
        res.json(boards.map(BoardsService.serializeBoard));
      })
      .catch(next);
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { name } = req.body;
    const newBoard = { name };

    for (const [key, value] of Object.entries(newBoard))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    newBoard.user_id = req.user.id;

    BoardsService.insertRack(req.app.get('db'), newBoard)
      .then((board) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${board.id}`))
          .json(BoardsService.serializeBoard(board));
      })
      .catch(next);
  });

// boardsRouter
//   .route('/:rackId')
//   .all(requireAuth)
//   .all(validateBoardRequest)
//   .get((req, res) => {
//     res.json(BoardsService.serializeRack(res.rack));
//   })
//   .patch(jsonBodyParser, (req, res, next) => {
//     const { id } = req.user;
//     const { rackId } = req.params;
//     const { rack_name } = req.body;
//     const updatedRack = { rack_name };

//     for (const [key, value] of Object.entries(updatedRack))
//       if (value == null)
//         return res.status(400).json({
//           error: `Missing '${key}' in request body`,
//         });

//     BoardsService.updateRack(req.app.get('db'), id, rackId, updatedRack)
//       .then((numRowsAffected) => {
//         res.status(204).end();
//       })
//       .catch(next);
//   })
//   .delete((req, res, next) => {
//     const { id } = req.user;
//     const { rackId } = req.params;

//     BoardsService.deleteRack(req.app.get('db'), id, rackId)
//       .then(() => {
//         res.status(204).end();
//       })
//       .catch(next);
//   });

module.exports = boardsRouter;
