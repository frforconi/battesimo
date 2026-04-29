// api/auth/login.js
// Redirects the user to Google's OAuth consent screen

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL}/api/auth/callback`
);

module.exports = (req, res) => {
  const scopes = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "online",
    scope: scopes,
    prompt: "select_account",
  });

  res.redirect(url);
};
