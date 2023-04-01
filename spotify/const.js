const baseUrl = 'https://api.spotify.com/v1';
const authorizationUrl = 'https://accounts.spotify.com/authorize';
const scope = 'playlist-read-private';
const stateKey = 'spotify_auth_state';

module.exports = {baseUrl, authorizationUrl, scope, stateKey};