var express = require("express");
const db = require("../modules/db");
var router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio')('AC4d8267d10eb6739ba57ba8b2dc9e9ec2', 'ae51d7cdbeaea1d8b90fd3e8aaf34ebd');

const VERIFICATION_SID = 'VAa2e6e44f1a0164f364db8bda65f35c29';

var accessTokenSecret = "MySoundziSecretToken";
var refreshTokenSecret = "MySoundziRefreshSecretToken";
const tokenList = {};

function validateRefreshToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(token == null ) return res.status(401).send('No token provided');
  
  try{
    const user = jwt.verify(token, accessTokenSecret);
    req.user = user;
    next();
  } catch(err) {
    // We refresh the token if it's expired
    if(err.name === 'TokenExpiredError') {
      postData = req.body;
      const user = tokenList[postData.refreshToken];
      if(user){
        const accessToken = jwt.sign({id : user.id}, accessTokenSecret, {expiresIn : 60});
        tokenList[postData.refreshToken].accessToken = accessToken;
        user.accessToken = accessToken;
        req.user = user;
        next();
      } else {
        res.status(401).send('Refresh token not valid');
      }
    } else {
      res.status(400).send('Authentification token not valid');
    }
  }
}

router.get('/', function(req, res, next) {
  console.log(req.user);
  db.db.collection('users').find().toArray().then((users) => {
    res.json(users);
  });
});

router.post('/login', function(req, res, next) {    
  db.db.collection('users').findOne({ email : req.body.email }).then((user) => {
    console.log(user);
    if(user != null){
      bcrypt.compare(req.body.password, user.password, function(err, result) {
        if(result) {
          const accessToken = jwt.sign({id : user.id}, accessTokenSecret, {expiresIn : 60});
          const refreshToken = jwt.sign({id : user.id}, refreshTokenSecret, {expiresIn : 86400});
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          tokenList[refreshToken] = user;
          res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
          res.set('x-access-token', accessToken);
          res.set('x-refresh-token', refreshToken);
          res.set('x-isAuthentified', true);
          res.json(user);
        } else {
          res.status(401).send('Password is incorrect');
        } 
      });
    } else {
      res.status(401).send('Email is incorrect');
    }
  });
});


router.post('/register', function(req, res, next) {
  const { firstname, lastname, email, password, phoneNumber} = req.body;

  db.db.collection('users').findOne({ email: email}).then((user) => {
    if(user) {
      res.statusMessage = 'Email already exist';
      res.status('409').end();
    } else {
      bcrypt.hash(password, 10, function(err, hash) {
        db.db.collection('users').insertOne({
          firstname: firstname,
          lastname: lastname,
          email: email,
          password: hash,
          phoneNumber: phoneNumber,
          role: 'user',
          status: 'notVerified'
        });
        res.json(200, {});
      })
    }
  });
}); 

router.post('/verifyPhoneNumber', function(req, res, next) {
  const channel = 'sms'

  let verificationRequest;
  req.user = {
    phoneNumber: req.body.phoneNumber
  }
  
  try {
    verificationRequest = twilio.verify.services(VERIFICATION_SID)
      .verifications
      .create({ to: req.user.phoneNumber, channel });
  } catch (e) {
    console.log(e);
    return res.status(500).send(e);
  }

  res.json(200, {});
})

router.post('/verificationChecks', async function(req, res, next) {
  let {phoneNumber, code } = req.body;
  let verificationResult;
  
  try {
    verificationResult = await twilio.verify.services(VERIFICATION_SID)
      .verificationChecks
      .create({ code: code, to: phoneNumber});
  } catch (e) {
    console.log(e);
    return res.status(500).send(e);
  }

  if(verificationResult && verificationResult.status === 'approved'){
    db.db.collection('users').findOneAndUpdate({phoneNumber : phoneNumber}, {$set : {status : 'actif'}}, {returnOriginal : false}).then((result) => {
      res.status(200);
      res.json(result.value);
    }).catch((err) => {
      res.status(400).send(err);
    });
  } else {
    res.statusMessage = 'Invalid code';
    res.status('400').end();
  }

})

module.exports = {
  router: router,
  tokenList: tokenList
}