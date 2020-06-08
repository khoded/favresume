const { Router } = require("express");
const passport = require("passport");

// init router for auth
let router = Router();

router.get("/login", function(req, res) {
  if (req.user) res.redirect("/editor");
  // if auth
  else res.redirect("http://favresume-hack.herokuapp.com/auth/google/"); // if not auth
});

// login redirect
router.get(
  "/login/google",
  passport.authenticate("google", {
    scope: ["profile", "https://www.googleapis.com/auth/drive.file", "email"]
  })
);

// callback from google oauth (with token)
router.get("/google/redirect", passport.authenticate("google"), function(
  req,
  res
) {
  res.redirect("https://favresume-hack.herokuapp.com/editor");
});

// logout
router.get("/logout", function(req, res) {
  req.logOut();
  res.redirect("/");
});

module.exports = router;
