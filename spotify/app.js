const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const cors = require('cors');
const cookieParser = require('cookie-parser');
const querystring = require('querystring');
const mongoose = require('mongoose');
require('dotenv').config();
const util = require('./util.js');
const constant = require('./const.js');

// read env file
CLIENT_ID=process.env.CLIENT_ID;
CLIENT_SECRET=process.env.CLIENT_SECRET;
PORT=process.env.PORT;
CALL_BACK_URI=`http://localhost:${PORT}/callback`;

// start an app
const app = express();
mongoose.connect(
    process.env.MONGODB_URI, 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
);
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

// authorization
app.get('/', function(req, res) {

  var state = util.generateRandomString(16);
  res.cookie(constant.stateKey, state);

  // your application requests authorization
  console.debug('Redirecting to Spotify for authentiaction and authorization');
  res.redirect(constant.authorizationUrl + '?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: constant.scope,
      redirect_uri: CALL_BACK_URI,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[constant.stateKey] : null;

  if (state === null || state !== storedState) {
      res.redirect('/#' +
          querystring.stringify({
          error: 'state_mismatch'
          }));
  } else {
    res.clearCookie(constant.stateKey);
    // prepare access token request
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: CALL_BACK_URI,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
      },
      json: true
    };
    // request access token
    console.log('Request access token');
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
          var access_token = body.access_token, 
              refresh_token = body.refresh_token;
          console.log(access_token);
          
          res.redirect('/playlists?authorization=' + access_token);
      } else {
          res.sendStatus(response.statusCode);
      }
    });
  }
});

app.get('/playlists', function(req, res) {
  var access_token = req.headers.authorization? req.headers.authorization: 'Bearer ' + req.query.authorization;
  var options = {
      url: `${constant.baseUrl}/me/playlists`,
      headers: { 'Authorization': access_token },
      json: true
  };
  console.log('Get user playlists');
  request.get(options, function(error, response, body) {
    if(!error && response.statusCode === 200) {
      var playlists = [];
      var getPlaylistInfo = function getPlaylistInfo(item) {
        playlists.push({'id': item.id, 'name': item.name});
      }
      body.items.forEach(getPlaylistInfo);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({playlists: playlists}));
    } else {
      res.sendStatus(response.statusCode);
    }
  });
});