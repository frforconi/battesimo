// api/auth/me.js
const { requireAuth } = require("../_auth");

module.exports = (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  res.json({
    id: user.sub,
    email: user.email,
    name: user.name,
    picture: user.picture,
  });
};
