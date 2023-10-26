const express = require('express');
const {username, password, role} = require('./index')
const con = require('./dbconnection');
const router = express.Router();
const bodyParser = require('body-parser');

router.get('UI/studentdashboard.html', (req, res) => {
  
  console.log(req);
});

// router.use(bodyParser.urlencoded({ extended: true }));

router.post("/change", (req, res) => {
  var currentPassword = req.body.curr;
  var newPassword = req.body.new;
  var confirmPassword = req.body.confirm;
  console.log(currentPassword, newPassword, confirmPassword, username, password, role);
  res.redirect("/UI/studentdashboard.html");
});

module.exports = router;
