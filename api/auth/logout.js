// api/auth/logout.js
const IS_PROD = process.env.NODE_ENV === "production";

module.exports = (req, res) => {
  // Clear the cookie by setting Max-Age=0
  res.setHeader("Set-Cookie", [
    `session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${IS_PROD ? "; Secure" : ""}`,
  ]);
  res.json({ ok: true });
};
