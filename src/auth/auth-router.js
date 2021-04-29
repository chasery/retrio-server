const express = require('express');
const AuthService = require('./auth-service');
const { requireAuth } = require('../middleware/jwt-auth');

const authRouter = express.Router();
const jsonBodyParser = express.json();

authRouter.post('/login', jsonBodyParser, (req, res, next) => {
  const { email, password } = req.body;
  const loginUser = { email, password };

  for (const [key, value] of Object.entries(loginUser)) {
    if (value == null)
      return res.status(400).json({
        error: `Missing '${key}' in request body`,
      });
  }

  AuthService.getUserByEmail(req.app.get('db'), loginUser.email)
    .then((dbUser) => {
      if (!dbUser) {
        return res.status(400).json({
          error: 'Invalid email or password',
        });
      }

      return AuthService.comparePasswords(
        loginUser.password,
        dbUser.password
      ).then((compareMatch) => {
        if (!compareMatch) {
          return res.status(400).json({
            error: 'Invalid email or password',
          });
        }

        const subject = dbUser.email;
        const payload = { id: dbUser.id };

        res.send({
          authToken: AuthService.createJWT(subject, payload),
        });
      });
    })
    .catch(next);
});

authRouter.post('/refresh', requireAuth, (req, res) => {
  const subject = req.user.email;
  const payload = { id: req.user.id };

  res.send({
    authToken: AuthService.createJWT(subject, payload),
  });
});

module.exports = authRouter;
