const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('./middleware/passport');
const prisma = new PrismaClient();
const photoUploaderMiddleware = require('./middleware/multer');
const upload = photoUploaderMiddleware();
const validateToken = require('./middleware/validationToken');
require('dotenv').config();

function generateAccessToken(id) {
  return jwt.sign({ id }, process.env.TOKEN_SECRET);
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(passport.initialize());
app.use(passport.session());
passport.use(localStrategy);

// GET ALL POSTS
app.get('/posts', validateToken, async (req, res) => {
  const posts = await prisma.post.findMany({
    include: { Comment: true },
    include: { Comment: { include: { User: { select: { username: true } } } } },
  });
  res.status(200);
  res.json(posts);
});

// GET ALL SPECIFIC USER'S POST
app.get('/posts/:user_id(\\d+)', async (req, res) => {
  const user_id = Number(req.params.user_id);
  const userPosts = await prisma.post.findMany({
    where: { author_id: user_id },
  });
  res.status(200);
  res.json(userPosts);
});

// CREATE NEW POST
app.post('/posts', validateToken, async (req, res) => {
  const { user_id, user_name, contentPost } = req.body;
  const newPost = {
    author_id: user_id,
    author_name: user_name,
    content: contentPost,
  };
  if (contentPost < 1) {
    res.status(400).json({ message: 'No text' });
    return;
  }
  try {
    await prisma.post.create({ data: newPost });
    res.status(200);
    res.json({ message: 'success' });
  } catch (err) {
    res.status(500).json({ message: 'Something gone wrong' });
  }
});

// EDIT POST
app.put('/posts/:id(\\d+)', validateToken, async (req, res) => {
  const post_id_toEdit = Number(req.params.id);
  const { user_id, user_name, modifiedContent } = req.body;
  const modifiedPost = {
    author_id: user_id,
    author_name: user_name,
    content: modifiedContent,
  };
  try {
    await prisma.post.update({
      where: { id: post_id_toEdit },
      data: modifiedPost,
    });
    res.status(200);
    res.json({ message: 'success' });
  } catch (err) {
    res.status(401);
    res.json({ message: 'nope' });
    console.log(err.message);
  }
});

// GET ALL USER'S LIKED POST
app.get('/posts/likes/:user_id(\\d+)', validateToken, async (req, res) => {
  const uid = Number(req.params.user_id);

  const likedPosts = await prisma.like.findMany({ where: { user_id: uid } });

  res.status(200).json(likedPosts);
});

// ADD-REMOVE LIKE POST
app.post(
  '/posts/:id(\\d+)/like/:user_id(\\d+)',
  validateToken,
  async (req, res) => {
    const pid = Number(req.params.id);
    const uid = Number(req.params.user_id);

    try {
      const likeExists = await prisma.post.findUnique({
        where: { id: pid },
        select: {
          Like: { where: { user_id: uid, post_id: pid } },
        },
      });

      if (likeExists.Like.length) {
        await prisma.like.delete({
          where: { id: likeExists.Like[0].id },
        });
        res.status(200).json({ message: 'like removed' });
        return;
      }

      await prisma.like.create({ data: { user_id: uid, post_id: pid } });
      res.status(200).json({ message: 'success' });
    } catch (err) {
      res.status(500).json({ message: 'Something gone wrong' });
    }
  }
);

// GET POST'S COMMENTS
app.get('/posts/comments/:post_id(\\d+)', validateToken, async (req, res) => {
  const pid = Number(req.params.post_id);

  try {
    const comments = await prisma.comment.findMany({
      where: { post_id: pid },
      include: { User: { select: { username: true } } },
    });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Something gone wrong' });
    console.log(err);
  }
});

// POST COMMENT
app.post('/posts/comments/:post_id(\\d+)', validateToken, async (req, res) => {
  const pid = Number(req.params.post_id);
  const { content, uid } = req.body;
  console.log(content, uid);
  const newComment = {
    content: content,
    post_id: pid,
    user_id: uid,
  };

  if (content < 1) {
    res.status(400).json({ message: 'No text' });
    return;
  }

  try {
    await prisma.comment.create({ data: newComment });
    res.status(200).json({ message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ message: 'Something gone wrong' });
    console.log(err);
  }
});

// DELETE POST
app.delete('/posts/:id(\\d+)', validateToken, async (req, res) => {
  const post_id_toDelete = Number(req.params.id);
  try {
    await prisma.post.delete({ where: { id: post_id_toDelete } });
    res.status(200);
    res.json({ message: 'success' });
  } catch (err) {
    res.status(401);
    res.json({ message: 'nope', error: err.message });
    console.log(err.message);
  }
});

// GET ALL USERS
app.get('/users', async (req, res) => {
  console.log('request recevied');
  const users = await prisma.user.findMany();
  res.status(200);
  res.json(users);
});

// GET SPECIFIC USER (UNUSED)
app.get('/user', async (req, res) => {
  const { id } = req.body;
  const user = await prisma.user.findUnique({ where: { id: id } });
  res.status(200);
  res.json(user);
});

// GET SPECIFIC USER BY ID
app.get('/users/:id(\\d+)', validateToken, async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    res.status(200);
    res.json(user);
  } catch (err) {
    res.status(401).json({
      message: 'Not authorized',
    });
  }
});

// LOGIN
app.post('/users/login', async (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info.message,
      });
    }
    const token = generateAccessToken(user?.id);
    console.log(token);
    return res.status(200).json({ token });
  })(req, res, next);
});

// REGISTRATION
app.post('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const {
      name,
      surname,
      username,
      password,
      email,
      city,
      address,
      gender,
      age,
    } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name: name,
      surname: surname,
      username: username,
      password: hashedPassword,
      email: email,
      city: city,
      address: address,
      gender: gender,
      age: age,
    };

    const checkUsername = users.find(
      (user) => user.username === newUser.username
    );

    if (checkUsername) {
      res.status(400).send('Username already exists');
    } else {
      await prisma.user.create({ data: newUser });

      res.status(200).send('User added correctly');
    }
  } catch (err) {
    console.log(err.message);
    res.status(400).send('Something gone wrong');
  }
});

// MODIFY USER
app.put('/user/:id(\\d+)', async (req, res, next) => {
  const { data, password } = req.body;
  console.log(data);
  const userId = Number(req.params.id);

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const isCorrectPwd = await bcrypt.compare(password, user.password);

  if (isCorrectPwd) {
    try {
      const user = await prisma.user.update({
        where: { id: Number(userId) },
        data: data,
      });

      res.status(200).json({ message: 'Changes saved successfully', user });
    } catch (err) {
      res.status(404);
      next(`Cannot PUT /user/${userId}`);
    }
  } else {
    res.status(401).json({ message: 'Password not correct' });
  }
});

// DELETE USER
app.delete('/user', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await prisma.user.findMany();

    const userToDelete = users.find((user) => user.username === username);

    if (userToDelete == null) {
      res.status(404).send('User not found');
      return;
    }

    console.log(userToDelete);

    if (await bcrypt.compare(password, userToDelete.password)) {
      try {
        await prisma.user.delete({
          where: { id: userToDelete.id },
        });

        res.status(204).end();
      } catch (err) {
        console.log(err);
        res.status(404).send('Cannot delete user');
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(400).send('Something gone wrong');
  }
});

// UPLOAD AVATAR
app.post(
  '/photo/upload/:id_user(\\d+)',
  validateToken,
  upload.single('image'),
  async (req, res, next) => {
    const id_user = Number(req.params.id_user);
    console.log(req.authorization);
    if (!req.file) {
      res.status(400).json({ message: 'No file selected' });
      console.log('no file');
      return;
    }

    await prisma.user.update({
      where: { id: id_user },
      data: { image_profile: req.file.filename },
    });

    console.log(req.file);
    res
      .status(201)
      .json({ message: 'Photo upload successfully, please refresh page' });
  }
);

app.use(express.static('upload'));

app.listen(process.env.PORT || 3000);
