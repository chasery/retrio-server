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
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { name } = req.body;
    const newTeam = { name };

    for (const [key, value] of Object.entries(newTeam))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    TeamsService.insertTeam(req.app.get('db'), newTeam, req.user.id)
      .then((team) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${team.id}`))
          .json(TeamsService.serializeTeam(team));
      })
      .catch(next);
  });

teamsRouter
  .route('/:teamId')
  .all(requireAuth)
  .all(validateTeamRequest)
  .get((req, res) => {
    res.json(TeamsService.serializeTeam(res.team));
  })
  .patch(jsonBodyParser, (req, res, next) => {
    const { teamId } = req.params;
    const { name } = req.body;
    const updatedTeam = { name };

    const teamMember = res.team.members.find(
      (member) => member.user_id === req.user.id
    );

    if (!teamMember.owner)
      return res.status(401).json({
        error: 'Unauthorized request',
      });

    for (const [key, value] of Object.entries(updatedTeam))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    TeamsService.updateTeam(req.app.get('db'), teamId, updatedTeam)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });
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
