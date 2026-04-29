// api/_drive.js
const { google } = require("googleapis");

let driveClient = null;

function getDriveClient() {
  if (driveClient) return driveClient;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  });

  driveClient = google.drive({ version: "v3", auth: oauth2Client });
  return driveClient;
}

module.exports = { getDriveClient };
