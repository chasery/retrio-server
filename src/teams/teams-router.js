const express = require('express');
const path = require('path');
const TeamsService = require('./teams-service');
const { requireAuth } = require('../middleware/jwt-auth');
const { validateTeamRequest } = require('../middleware/validate-request');

const teamsRouter = express.Router();
const jsonBodyParser = express.json();

teamsRouter
  .route('/')
  .all(requireAuth)
  .get((req, res, next) => {
    const { id } = req.user;

    TeamsService.getUserTeams(req.app.get('db'), id)
      .then((teams) => {
        res.json(teams.map((team) => TeamsService.serializeTeam(team)));
      })
      .catch(next);
  });
// .post(jsonBodyParser, (req, res, next) => {
//   const { name, team_id } = req.body;
//   const newBoard = { name, team_id };

//   for (const [key, value] of Object.entries(newBoard))
//     if (value == null)
//       return res.status(400).json({
//         error: `Missing '${key}' in request body`,
//       });

//   TeamsService.insertBoard(req.app.get('db'), newBoard, req.user.id)
//     .then((board) => {
//       res
//         .status(201)
//         .location(path.posix.join(req.originalUrl, `/${board.id}`))
//         .json(TeamsService.serializeBoard(board));
//     })
//     .catch(next);
// });

teamsRouter
  .route('/:teamId')
  .all(requireAuth)
  .all(validateTeamRequest)
  .get((req, res) => {
    res.json(TeamsService.serializeTeam(res.team));
  });
//   .patch(jsonBodyParser, (req, res, next) => {
//     const { boardId } = req.params;
//     const { name, team_id } = req.body;
//     const updatedBoard = { name, team_id };

//     if (!res.board.owner)
//       return res.status(401).json({
//         error: 'Unauthorized request',
//       });

//     for (const [key, value] of Object.entries(updatedBoard))
//       if (value == null)
//         return res.status(400).json({
//           error: `Missing '${key}' in request body`,
//         });

//     TeamsService.updateBoard(req.app.get('db'), boardId, updatedBoard)
//       .then((numRowsAffected) => {
//         res.status(204).end();
//       })
//       .catch(next);
//   })
//   .delete((req, res, next) => {
//     const { boardId } = req.params;

//     if (!res.board.owner)
//       return res.status(401).json({
//         error: 'Unauthorized request',
//       });

//     TeamsService.deleteBoard(req.app.get('db'), boardId)
//       .then(() => {
//         res.status(204).end();
//       })
//       .catch(next);
//   });

module.exports = teamsRouter;
