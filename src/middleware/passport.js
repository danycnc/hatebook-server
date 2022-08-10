const LocalStrategy = require('passport-local').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

const localStrategy = new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password',
  },
  async function (username, password, done) {
    const users = await prisma.user.findMany();

    const user = users.find((user) => user.username === username);
    if (!user) {
      return done(null, false, { message: 'User does not exist' });
    }

    const isCorrectPwd = await bcrypt.compare(password, user.password);
    if (!isCorrectPwd) {
      return done(null, false, { message: 'Password is not valid' });
    }
    return done(null, user);
  }
);

module.exports = localStrategy;
