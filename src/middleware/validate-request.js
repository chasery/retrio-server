const BoardsService = require('../boards/boards-service');
// const RackItemsService = require('../rackItems/rackItems-service');

async function validateBoardRequest(req, res, next) {
  try {
    const userBoard = await BoardsService.getUserBoardById(
      req.app.get('db'),
      req.params.boardId
    );

    if (!userBoard)
      return res.status(404).json({
        error: `Board doesn't exist`,
      });
    else if (userBoard.user_id !== req.user.id)
      return res.status(401).json({
        error: 'Unauthorized request',
      });

    res.board = await BoardsService.getBoardById(
      req.app.get('db'),
      userBoard.user_id,
      userBoard.board_id
    );
    next();
  } catch (error) {
    next(error);
  }
}

// async function validateRackItemRequest(req, res, next) {
//   try {
//     const rackItem = await RackItemsService.getRackItemById(
//       req.app.get('db'),
//       req.params.itemId
//     );

//     if (!rackItem)
//       return res.status(404).json({
//         error: `Rack item doesn't exist`,
//       });
//     else if (rackItem.user_id !== req.user.id)
//       return res.status(401).json({
//         error: 'Unauthorized request',
//       });

//     res.rackItem = rackItem;
//     next();
//   } catch (error) {
//     next(error);
//   }
// }

module.exports = {
  validateBoardRequest,
  // validateRackItemRequest,
};
