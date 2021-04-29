const express = require('express');
const path = require('path');
const UsersService = require('./users-service');

const usersRouter = express.Router();
const jsonBodyParser = express.json();

usersRouter.post('/', jsonBodyParser, (req, res, next) => {
  const { email, password, first_name, last_name } = req.body;

  for (const field of ['email', 'password'])
    if (!req.body[field])
      return res.status(400).json({
        error: `Missing '${field}' in request body`,
      });

  const emailError = UsersService.validateEmail(email);

  if (emailError) return res.status(400).json({ error: emailError });

  const passwordError = UsersService.validatePassword(password);

  if (passwordError) return res.status(400).json({ error: passwordError });

  UsersService.hasUserWithEmail(req.app.get('db'), email)
    .then((hasUserWithEmail) => {
      if (hasUserWithEmail)
        return res
          .status(400)
          .json({ error: `User with that email already exists` });

      return UsersService.hashPassword(password).then((hashedPassword) => {
        const newUser = {
          email,
          password: hashedPassword,
          first_name,
          last_name,
          created_at: 'now()',
        };

        return UsersService.insertUser(req.app.get('db'), newUser).then(
          (user) => {
            res
              .status(201)
              .location(path.posix.join(req.originalUrl, `/${user.id}`))
              .json(UsersService.serializeUser(user));
          }
        );
      });
    })
    .catch(next);
});

module.exports = usersRouter;
