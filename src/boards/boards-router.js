const express = require('express');
const path = require('path');
const BoardsService = require('./boards-service');
const { requireAuth } = require('../middleware/jwt-auth');
const { validateBoardRequest } = require('../middleware/validate-request');

const boardsRouter = express.Router();
const jsonBodyParser = express.json();

boardsRouter
  .route('/')
  .all(requireAuth)
  .get((req, res, next) => {
    const { id } = req.user;

    BoardsService.getUserBoards(req.app.get('db'), id)
      .then((boards) => {
        res.json(boards.map((board) => BoardsService.serializeBoard(board)));
      })
      .catch(next);
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { name, team_id } = req.body;
    const newBoard = { name, team_id };

    for (const [key, value] of Object.entries(newBoard))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    BoardsService.insertBoard(req.app.get('db'), newBoard, req.user.id)
      .then((board) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${board.id}`))
          .json(BoardsService.serializeBoard(board));
      })
      .catch(next);
  });

boardsRouter
  .route('/:boardId')
  .all(requireAuth)
  .all(validateBoardRequest)
  .get((req, res) => {
    res.json(BoardsService.serializeBoard(res.board));
  })
  .patch(jsonBodyParser, (req, res, next) => {
    const { id } = req.user;
    const { boardId } = req.params;
    const { name, team_id } = req.body;
    const updatedBoard = { name, team_id };

    if (!res.board.owner)
      return res.status(401).json({
        error: 'Unauthorized request',
      });

    for (const [key, value] of Object.entries(updatedBoard))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    BoardsService.updateBoard(req.app.get('db'), boardId, updatedBoard)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });
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
