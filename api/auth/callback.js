// api/auth/callback.js
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL}/api/auth/callback`
);

const IS_PROD = process.env.NODE_ENV === "production";

module.exports = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Whitelist check (from file and/or env)
    let allowedEmails = [];
    try {
      allowedEmails = require("../whitelist.json");
    } catch (e) {
      // ignore if file missing
    }

    if (allowedEmails.length > 0 && !allowedEmails.includes(userInfo.email.toLowerCase())) {
      console.warn(`Unauthorized login attempt from: ${userInfo.email}`);
      return res.redirect(`${process.env.FRONTEND_URL}/?error=unauthorized`);
    }

    const sessionToken = jwt.sign(
      {
        sub: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set JWT as HttpOnly cookie — never readable by JavaScript,
    // sent automatically by the browser on every request (including <img src>).
    res.setHeader("Set-Cookie", [
      `session=${sessionToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${IS_PROD ? "; Secure" : ""}`,
    ]);

    // Redirect to /gallery — no token in the URL
    res.redirect(`${process.env.FRONTEND_URL}/gallery`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
  }
};
