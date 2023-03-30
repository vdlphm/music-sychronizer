var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
require('dotenv').config();

// read env file
CLIENT_ID=process.env.CLIENT_ID;
CLIENT_SECRET=process.env.CLIENT_SECRET;
PORT=process.env.PORT;
CALL_BACK_URI=`http://localhost:${PORT}/callback`;

// const
const base_url = 'https://api.spotify.com/v1';
const authorization_url = 'https://accounts.spotify.com/authorize'

// start an app
const app = express();
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
var stateKey = 'spotify_auth_state';
app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

// authorization
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

app.get('/', function(req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);
  
    // your application requests authorization
    var scope = 'playlist-read-private';
    console.debug('Redirecting to Spotify for authentiaction and authorization');
    res.redirect(authorization_url + '?' +
      querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: CALL_BACK_URI,
        state: state
      }));
});

app.get('/callback', function(req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
            error: 'state_mismatch'
            }));
    } else {
      res.clearCookie(stateKey);
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
        } else {
            res.redirect('/#' + 
                querystring.stringify({
                    error: 'invalid_token'
                }));
        }
      });
    }
});
