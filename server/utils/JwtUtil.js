//CLI: npm install jsonwebtoken --save
const jwt = require('jsonwebtoken');
const MyConstants = require('./MyConstants');
const JwtUtil = {
  genToken(username, password) {
    console.log('Generating token for:', username);
    try {
      const token = jwt.sign(
        { username: username, password: password },
        MyConstants.JWT_SECRET,
        { expiresIn: MyConstants.JWT_EXPIRES }
      );
      console.log('Token generated successfully');
      return token;
    } catch (err) {
      console.error('Error generating token:', err);
      throw err;
    }
  },
  checkToken(req, res, next) {
    const token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token) {
      jwt.verify(token, MyConstants.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.json({
            success: false,
            message: 'Token is not valid'
          });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      return res.json({
        success: false,
        message: 'Auth token is not supplied'
      });
    }
  }
};
module.exports = JwtUtil;