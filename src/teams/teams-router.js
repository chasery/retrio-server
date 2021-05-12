const express = require('express');
const path = require('path');
const TeamsService = require('./teams-service');
const UsersService = require('../users/users-service');
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

    const requestor = res.team.members.find(
      (member) => member.user_id === req.user.id
    );

    if (!requestor.owner)
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
  })
  .delete((req, res, next) => {
    const { teamId } = req.params;

    const requestor = res.team.members.find(
      (member) => member.user_id === req.user.id
    );

    if (!requestor.owner)
      return res.status(401).json({
        error: 'Unauthorized request',
      });

    TeamsService.deleteTeam(req.app.get('db'), teamId)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

teamsRouter
  .route('/:teamId/members')
  .all(requireAuth)
  .all(validateTeamRequest)
  .post(jsonBodyParser, (req, res, next) => {
    const { teamId } = req.params;
    const { email } = req.body;
    const newTeamMemberReq = { email };

    for (const [key, value] of Object.entries(newTeamMemberReq))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    const exists = res.team.members.find((member) => member.email === email);
    if (exists)
      return res.status(400).json({
        error: `Team member already exists`,
      });

    UsersService.getUserByEmail(req.app.get('db'), newTeamMemberReq.email)
      .then((user) => {
        if (!user)
          return res.status(400).json({
            error: `Invalid Retrio user`,
          });

        const newTeamMember = {
          user_id: user.id,
          team_id: teamId,
          owner: false,
        };

        TeamsService.insertTeamMember(
          req.app.get('db'),
          newTeamMember,
          req.user.id
        )
          .then(([teamMember]) => {
            res
              .status(201)
              .location(
                path.posix.join(req.originalUrl, `/${teamMember.user_id}`)
              )
              .json(teamMember);
          })
          .catch(next);
      })
      .catch(next);
  });

teamsRouter
  .route('/:teamId/members/:memberId')
  .all(requireAuth)
  .all(validateTeamRequest)
  .delete((req, res, next) => {
    const { teamId, memberId } = req.params;

    const requestor = res.team.members.find(
      (member) => member.user_id === req.user.id
    );

    if (!requestor.owner)
      return res.status(401).json({
        error: 'Unauthorized request',
      });

    const memberToDelete = res.team.members.find(
      (member) => member.user_id === parseFloat(memberId)
    );

    if (!memberToDelete)
      return res.status(404).json({
        error: `Team member doesn't exist`,
      });

    TeamsService.deleteTeamMember(req.app.get('db'), teamId, memberId)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = teamsRouter;
