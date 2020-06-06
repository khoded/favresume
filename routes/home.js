const { Router } = require("express");
const { google } = require("googleapis");
const page = require("../service/pdf");
const hbs = require("hbs");
const fs = require("fs");
const pdf = require("html-pdf");
const showdown = require("showdown");
const converter = new showdown.Converter();

const router = Router();

router.get("/", function(req, res) {
  res.render("index.hbs");
});

router.get("/editor", function(req, res) {
  // if not user
  if (typeof req.user == "undefined") res.redirect("/auth/login/google");
  else {
    let parseData = {
      title: "DASHBOARD",
      googleid: req.user._id,
      name: req.user.name,
      avatar: req.user.pic_url,
      email: req.user.email
    };

    // if redirect with google drive response
    if (req.query.file !== undefined) {
      // successfully upload
      if (req.query.file == "upload") parseData.file = "uploaded";
      else if (req.query.file == "notupload") parseData.file = "notuploaded";
    }

    res.render("editor.hbs", parseData);
  }
});

router.post("/generate", (req, res) => {
  var data = req.body;
  var webpage = page.pdfBody(data);
  //setting options for PDF
  var options = { format: "A4" };

  //Reads the Base Template from the Views Folder
  var template = hbs.compile(fs.readFileSync("./views/gen.hbs", "utf8"));
  //Proccessing the base template with the content
  var html = template({ content: webpage });
  var filename = `${data.firstname}${
    data.lastname
  }${new Date().toLocaleDateString()}`;
  //create PDF from the above generated html
  pdf
    .create(html, options)
    .toFile(`./public/${filename}.pdf`, function(err, resp) {
      if (resp) return res.json({ filename: filename + ".pdf" });
      if (err) return console.log(err);
      console.log(res);
    });
});

router.post("/upload", function(req, res) {
  // not auth
  if (!req.user) res.redirect("/auth/login/google");
  else {
    // auth user

    // config google drive with client token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: req.user.accessToken
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client
    });

    //move file to google drive

    let { name: filename, mimetype, data } = req.files.file_upload;

    const driveResponse = drive.files.create({
      requestBody: {
        name: filename,
        mimeType: mimetype
      },
      media: {
        mimeType: mimetype,
        body: Buffer.from(data).toString()
      }
    });

    driveResponse
      .then(data => {
        if (data.status == 200) res.redirect("/dashboard?file=upload");
        // success
        else res.redirect("/dashboard?file=notupload"); // unsuccess
      })
      .catch(err => {
        throw new Error(err);
      });
  }
});

module.exports = router;
