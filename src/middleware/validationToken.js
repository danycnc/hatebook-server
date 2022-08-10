const jwt = require('jsonwebtoken');

module.exports = async function validateToken(req, res, next) {
  console.log(`validationToken invoked for ${req.headers.authorization}`);
  try {
    //   get the token from the authorization header
    const token = await req.headers.authorization;

    //check if the token matches the supposed origin
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);

    // retrieve the user details of the logged in user
    const user = decodedToken;
    console.log(user);

    // pass the user down to the endpoints here
    req.user = user;
    // pass down functionality to the endpoint
    next();
  } catch (error) {
    res.status(401).json({
      //error: new Error('Invalid request!'),
      message: 'Not authorized',
      error: error.message,
    });
  }
};
