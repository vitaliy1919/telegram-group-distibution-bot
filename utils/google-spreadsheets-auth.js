const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'];
let credentials = null;
const fs = require('fs');
const TOKEN_PATH = 'token.json';
const { google } = require('googleapis');
const readline = require('readline');

let loadCredentials = async () => {
    if (!credentials) {
        return new Promise((resolve, reject) => {
            fs.readFile('credentials.json', (err, content) => {
                if (err) {
                    console.log('Error loading client secret file:', err);
                    reject(err);
                    return;
                }
                credentials = JSON.parse(content);
                console.log("Credentials loaded");
                resolve(credentials);
            });
        })
    } else {
        return Promise.resolve(credentials);
    }
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return Promise((resolve, reject) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return reject('Error while trying to retrieve access token ' + err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) reject(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                resolve(oAuth2Client);
            });
        });
    });
}

function authorize() {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    return new Promise((resolve, reject) => {
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getNewToken(oAuth2Client);
            oAuth2Client.setCredentials(JSON.parse(token));
            resolve(oAuth2Client);
        });
      //  callback(oAuth2Client);
    });
}

module.exports = {
    authorize,
    loadCredentials
}