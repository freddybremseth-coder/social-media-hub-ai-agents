/**
 * YouTube OAuth2 Token Helper
 *
 * Run: npx tsx scripts/get-youtube-token.ts
 *
 * Step 1: Opens a browser URL for Google OAuth consent
 * Step 2: You authorize and get a code from the redirect
 * Step 3: Paste the code here to exchange it for a refresh token
 */

import { google } from 'googleapis';
import * as readline from 'readline';

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET in environment variables.');
  console.error('   Make sure your .env.local file is loaded or set them manually.');
  process.exit(1);
}
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.readonly',
];

async function main() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n🔗 Open this URL in your browser to authorize:\n');
  console.log(authUrl);
  console.log('\n📋 After authorizing, Google will give you a code.');
  console.log('   Paste that code below:\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Authorization code: ', async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(code.trim());
      console.log('\n✅ Success! Here are your tokens:\n');
      console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log(`\nAccess Token: ${tokens.access_token?.substring(0, 30)}...`);
      console.log(`Expiry: ${tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A'}`);
      console.log('\n📌 Add the YOUTUBE_REFRESH_TOKEN to your .env.local file.');
    } catch (err) {
      console.error('\n❌ Error exchanging code:', err);
    }
    rl.close();
  });
}

main();
