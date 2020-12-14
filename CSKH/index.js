const fs = require('fs');
const readline = require('readline');
const {
    google
} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
/*

The first time you run the sample, it will prompt you to authorize access:

Browse to the provided URL in your web browser.

If you are not already logged into your Google account, you will be prompted to log in. If you are logged into multiple Google accounts, you will be asked to select one account to use for the authorization.

If you don't have a browser on the machine running the code, and you've selected "Desktop app" when creating the OAuth client, you can browse to the URL provided on another machine, and then copy the authorization code back to the running sample.

Click the Accept button.
Copy the code you're given, paste it into the command-line prompt, and press Enter.

https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https://www.googleapis.com/auth/spreadsheets.readonly&response_type=code&client_id=99743406262-ot2nsglbf14ubji6vr5o2oot9bs4tm8e.apps.googleusercontent.com&redirect_uri=urn:ietf:wg:oath:2.0:oob

https://accounts.google.com/signin/oauth/consent/oauthchooseaccount?authuser=0&part=AJi8hAPiirTmHfhjBvd6BFzoZLLjP81UsyF7Di9B1SPod-YEmf3Tleua822fARM_0CQvOQuZ0t2YxiDkwRflFTv-xa0CzPVIp4zO2wox6EPY0aaR33GMUNWg7N1Wp4amm_aRPObCPruTgpyTAaeSgkGDQdhsjBP1AKUmQygyzMO4RMyLZxav34LjIQMhuO7I1lp6E4GMuFDAL_QvNvFlsTQObKc4H-jBkj37et_d_T31Lo0iXVk_MzsKgeSwPXP_qNOBrMBh5lc9CQCYKUCGu6v3wrpzodD0LmNBKyle3lmc-7YYVuZksCn8_zk13TDX06rFYpSglN06f0HwTiM-KZU2lrWathK2bQ44AefPob-OKLD0zHIOtFgWlboYJgYVkGEfLJNuTXYKmhl-4xpftX5yrQmPZiF7nap1MIONpy8BZCFfZ3kipH7Zh6oZ592LR3IOS9qsV0WG8JANKJtc7AJSwNV84pDqIyzsNQKr4XfcNt73Vlf1CVGUGUtWnUOnkULFGtKEU1-cy6aD72VvYjja4jpEJcBs0FPBhSFdzLv1JgHOVcqjYgcr2uS8g8-UB03sTG0NqT10js4qdbaMd7RLB-Ln8r43wQ&hl=vi&as=S-133234036%3A1607919901444294&rapt=AEjHL4N-67czXBDL612eNxyAQCAgIVD_cEmSFBRWUbpTZZQAgkcttdV_fJijEhlBiYqvkM4INU3N1Xi1pItCjltyV6uu3w6XqQ&client_id=990743406262-ot2nsglbf14ubji6vr5o2oot9bs4tm8e.apps.googleusercontent.com&approval_state=!ChQzangzSWZlcTdpTDFZajYweHV4OBIfby1mZWphSVl1eW9mNEJxcmlYbTVkb21pWU92M1pSYw%E2%88%99AF-3PDcAAAAAX9g6pDnyaW-8zB4O_VEbxt-G6DugP3ei&flowName=GeneralOAuthFlow

*/
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), listMajors);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
      spreadsheetId: '1pvopS2offE-ckY8qKDxyFSniLCIyvNIcQZaa7AbVztk',
      range: 'C2:E',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const rows = res.data.values;
      if (rows.length) {
        console.log('Email, Mobile:');
        // Print columns A and E, which correspond to indices 0 and 4.
        rows.map((row) => {
          console.log(`${row[0]}, ${row[2]}`);
        });
      } else {
        console.log('No data found.');
      }
    });
  }