const express = require("express");
const homeRouter = require("./routes/home");
const authRouter = require("./routes/auth");
const passportConfig = require("./configs/passport");
const passport = require("passport");
const cookieSession = require("cookie-session");
const KEYS = require("./configs/keys");
const nunjucks = require("nunjucks");
const fileUpload = require("express-fileupload");
const hbs = require("hbs");
const bodyParser = require("body-parser");
var cors = require("cors");

// init app
let app = express();
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`server is running on ${port}`));

// init view
nunjucks.configure("views", {
  autoescape: true,
  express: app
});

// init middlewares
app.set("view engine", "hbs");
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

// init session
app.use(
  cookieSession({
    keys: [KEYS.session_key]
  })
);

// init passport
app.use(passport.initialize());
app.use(passport.session());

// file upload
app.use(fileUpload());

// init routes
app.use("", homeRouter); // home
app.use("/auth", authRouter); // auth
