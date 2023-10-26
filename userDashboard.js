const express = require('express');
const con = require('./dbconnection');
const router = express.Router();
const bodyParser = require('body-parser');
const path = require('path');
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


router.post("/change", (req, res) => {
  var currentPassword = req.body.curr;
  var newPassword = req.body.new;
  var confirmPassword = req.body.confirm;
  console.log(cookieObj[0].Name);
  res.redirect("/UI/studentdashboard.html");
});

module.exports = router;