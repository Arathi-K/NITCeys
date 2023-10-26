const express = require('express');
const con = require('./dbconnection');
const router = express.Router();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser')
router.use(cookieParser());
let cookieObj = "";

router.use(bodyParser.urlencoded({ extended: true }));

router.get('/UI/studentdashboard.html', (req, res) => {
  const cookieName = req.cookies.user;
  cookieObj = JSON.parse(cookieName);
  console.log(cookieObj[0].User_id);  //this accesses the roll number alone.
  res.sendFile(path.join(__dirname, 'UI', 'studentdashboard.html'));
});

router.get('/UI/profileDetails.html', (req, res) => {
  const cookieName = req.cookies.user;
  cookieObj = JSON.parse(cookieName);
  console.log("profile page print", cookieObj[0]);
  const htmlFilePath = path.join(__dirname, 'UI', 'profileDetails.html');
  fs.readFile(htmlFilePath, 'utf8', (err, data) => {
    if (err) throw err
    let modifiedHtml = data;
    if (cookieObj[0].role == 'student'){
      modifiedHtml = modifiedHtml.replace('{{TYPE_OF_ID}}', 'Roll No');
      const placeholders = {
        USER_ID: cookieObj[0].User_id,
        NAME: cookieObj[0].Name,
        PHONE: cookieObj[0].Phone_number,
        ROLE: cookieObj[0].role
      };
      for (const placeholder in placeholders) {
        modifiedHtml = modifiedHtml.replace(`{{${placeholder}}}`, placeholders[placeholder]);
      }
      res.send(modifiedHtml);
    } else if (cookieObj[0].role == 'teacher'){
      modifiedHtml = modifiedHtml.replace('{{TYPE_OF_ID}}', 'Teacher ID');
      const placeholders = {
        USER_ID: cookieObj[0].User_id,
        NAME: cookieObj[0].Name,
        PHONE: cookieObj[0].Phone_number,
        ROLE: cookieObj[0].role
      };
      for (const placeholder in placeholders) {
        modifiedHtml = modifiedHtml.replace(`{{${placeholder}}}`, placeholders[placeholder]);
      }
      res.send(modifiedHtml);
    } else {
      modifiedHtml = modifiedHtml.replace('{{TYPE_OF_ID}}', 'Admin ID');
      modifiedHtml = modifiedHtml.replace(/<div class="form-group">\s*<h4>Phone No : {{PHONE}}<\/h4>\s*<\/div>\s*<br>/, '');
      const placeholders = {
        USER_ID: cookieObj[0].Admin_id,
        NAME: cookieObj[0].Name,
        PHONE: cookieObj[0].Phone_number,
        ROLE: cookieObj[0].Privilege
      };
      for (const placeholder in placeholders) {
        if(placeholder == 'PHONE'){
          continue;
        }
        modifiedHtml = modifiedHtml.replace(`{{${placeholder}}}`, placeholders[placeholder]);
      }
      res.send(modifiedHtml);
    }
    
  });
});

router.post("/change", (req, res) => {
  var currentPassword = req.body.curr;
  var newPassword = req.body.new;
  var confirmPassword = req.body.confirm;
  console.log(cookieObj[0].Name);
  res.redirect("/UI/studentdashboard.html");
});

module.exports = router;