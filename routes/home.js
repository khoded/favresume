const { Router } = require("express");
const { google } = require("googleapis");
const page = require("../service/pdf");
const hbs = require("hbs");
const fs = require("fs");
const pdf = require("html-pdf");
const showdown = require("showdown");
const converter = new showdown.Converter();
const shareMail = require("../utils/email");

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
  var filename = `${data.firstname}${data.lastname}`;
  //create PDF from the above generated html
  pdf
    .create(html, options)
    .toFile(`./public/${filename}.pdf`, function(err, resp) {
      console.log(resp);
      if (resp) return res.json({ filename: filename + ".pdf" });
      if (err) return console.log(err);
    });
});

router.post("/email", (req, res) => {
  // console.log(req.body);
  var data = req.body.json;
  var mail = req.body.mail;
  var webpage = page.pdfBody(data);
  //setting options for PDF
  var options = { format: "A4" };

  //Reads the Base Template from the Views Folder
  var template = hbs.compile(fs.readFileSync("./views/gen.hbs", "utf8"));
  //Proccessing the base template with the content
  var html = template({ content: webpage });
  var filename = `${data.firstname}${data.lastname}`;
  //create PDF from the above generated html
  pdf
    .create(html, options)
    .toFile(`./public/${filename}.pdf`, function(err, resp) {
      const email = {
        from: `${mail.name} <hire@favresume.mailgun.org>`,
        to: mail.email,
        subject: `Application for the Position of ${mail.position}`,
        html: `<p style="text-align: justify;">Dear Hiring Manager,&nbsp;</p>
  <p style="text-align: justify;">I am writing you to set up an interview for the position of ${mail.position} ,</p>
 
  <p style="text-align: justify;">If you think I’d be a good fit at your company then please reach out to set up an interview at your earliest convenience.</p>
 
  <p style="text-align: justify;">Sincerely,</p>
  
  <p style="text-align: justify;">${mail.name}</p>`,
        attachment: `./public/${filename}.pdf`
      };

      shareMail.messages().send(email, function(error, body) {
        console.log(body);
      });
      res.json("done");
    });
});

router.post("/upload", function(req, res) {
  var data = req.body;
  var webpage = page.pdfBody(data);
  //setting options for PDF
  var options = { format: "A4" };

  //Reads the Base Template from the Views Folder
  var template = hbs.compile(fs.readFileSync("./views/gen.hbs", "utf8"));
  //Proccessing the base template with the content
  var html = template({ content: webpage });
  var filename = `${data.firstname}${data.lastname}`;
  //create PDF from the above generated html
  pdf
    .create(html, options)
    .toFile(`./public/${filename}.pdf`, function(err, resp) {
      30;
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

        //   let  data  = fs.createReadStream(`./public/${filename}.pdf`);

        const driveResponse = drive.files.create({
          requestBody: {
            name: `${filename}.pdf`,
            mimeType: "application/pdf"
          },
          media: {
            mimeType: "application/pdf",
            body: fs.createReadStream(`./public/${filename}.pdf`)
          }
        });

        driveResponse
          .then(data => {
            if (data.status == 200) {
              console.log("uploaded");
              res.json("done");
            }

            // success
            else {
              console.log("ouch");
              res.json("err");
            } // unsuccess
          })
          .catch(err => {
            throw new Error(err);
          });
      }
    });
});

module.exports = router;
