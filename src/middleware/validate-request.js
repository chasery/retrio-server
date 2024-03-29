const BoardsService = require('../boards/boards-service');
const CardsService = require('../cards/cards-service');
const TeamsService = require('../teams/teams-service');

async function validateBoardRequest(req, res, next) {
  try {
    const userBoard = await BoardsService.getUsersByBoardId(
      req.app.get('db'),
      req.params.boardId
    );

    if (!userBoard.length)
      return res.status(404).json({
        error: `Board doesn't exist`,
      });

    const user = userBoard.find((user) => user.user_id === req.user.id);

    if (!user)
      return res.status(401).json({
        error: 'Unauthorized request',
      });

    res.board = await BoardsService.getBoardById(
      req.app.get('db'),
      user.user_id,
      user.board_id
    );
    next();
  } catch (error) {
    next(error);
  }
}

async function validateCardRequest(req, res, next) {
  try {
    const card = await CardsService.getCardById(
      req.app.get('db'),
      req.params.cardId
    );

    if (!card)
      return res.status(404).json({
        error: `Card doesn't exist`,
      });

    const userBoard = await BoardsService.getUsersByBoardId(
      req.app.get('db'),
      card.board_id
    );

    const currentUser = userBoard.find((user) => user.user_id === req.user.id);

    if (
      !currentUser ||
      (card.created_by !== currentUser.user_id && !currentUser.owner)
    ) {
      return res.status(401).json({
        error: 'Unauthorized request',
      });
    }

    res.card = card;
    next();
  } catch (error) {
    next(error);
  }
}

async function validateTeamRequest(req, res, next) {
  try {
    const teamMembers = await TeamsService.getMembersByTeamId(
      req.app.get('db'),
      req.params.teamId
    );

    if (!teamMembers.length)
      return res.status(404).json({
        error: `Team doesn't exist`,
      });

    const member = teamMembers.find((member) => member.user_id === req.user.id);

    if (!member)
      return res.status(401).json({
        error: 'Unauthorized request',
      });

    res.team = await TeamsService.getTeamById(
      req.app.get('db'),
      member.team_id
    );
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateBoardRequest,
  validateCardRequest,
  validateTeamRequest,
};
