const express = require('express');
const con = require('./dbconnection');
const router = express.Router();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser')
// const fs = require('fs');
router.use(cookieParser());
let cookieObj = "";
router.use(bodyParser.urlencoded({ extended: true }));


function renderList(data) {
  let selectHTML = '';
 /* <!-- <li class="list-group-item d-flex justify-content-between align-items-center">
                                                CSED Seminar Hall
                                                
                                            </li> -->*/
  // Add options based on the data
  data.forEach(item => {
    selectHTML += '<li class="list-group-item d-flex justify-content-between align-items-center">'+  `${item.Hall_name}` + '<form action="/UI/bookHall.html" method="get"><div class="form-group"><input type="text" hidden name="hallName" value="' + `${item.Hall_name}` + '"></div><button class="btn btn-primary">Book Hall</button></form></li>'  ;
  });
  return selectHTML;
}


router.get('/UI/studentdashboard.html', (req, res) => {
  const cookieName = req.cookies.user;
  cookieObj = JSON.parse(cookieName);
  console.log(cookieObj[0].User_id);  //this accesses the roll number alone.
  const htmlFilePath = path.join(__dirname, 'UI', 'studentdashboard.html')
  fs.readFile(htmlFilePath, 'utf-8', (err,data)=>{
    if(err) throw err;
    let modifiedHTML = data
    const query = 'SELECT Hall_name FROM hall';
    con.query(query, (err, results) => {
    if (err) {
      throw err;
    } else {
      html = renderList(results)
      modifiedHTML = modifiedHTML.replace('{{halls}}', html)
      res.send(modifiedHTML);

    }
  } )
  // res.sendFile(path.join(__dirname, 'UI', 'studentdashboard.html'));
})})

router.get('/UI/changePassword.html', (req, res) => {
  const u = req.cookies.user;
  cookieObj = JSON.parse(u);
  let attributes = Object.keys(cookieObj[0]).length
  const htmlFilePath = path.join(__dirname, 'UI', 'changePassword.html')
  fs.readFile(htmlFilePath, 'utf-8', (err, data)=>{
    if(err) throw err;
    let modifiedHTML = data
    if(attributes===4){
      modifiedHTML = modifiedHTML.replace(`{{LINK}}`, "/UI/adminDashboard.html")
    }else{
      modifiedHTML = modifiedHTML.replace(`{{LINK}}`, "/UI/studentdashboard.html")
    }
    res.send(modifiedHTML);
  })
  
});
router.get('/UI/profileDetails.html', (req, res) => {
  const cookieName = req.cookies.user;
  cookieObj = JSON.parse(cookieName);
  console.log("profile page print", cookieObj[0]);
  let attributes = Object.keys(cookieObj[0]).length
  const htmlFilePath = path.join(__dirname, 'UI', 'profileDetails.html');
  fs.readFile(htmlFilePath, 'utf8', (err, data) => {
    if (err) throw err
    let modifiedHtml = data;
    if(attributes===4){
      modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/adminDashboard.html")
    }else{
      modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/studentdashboard.html")
    }
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

let currentHallName = "";

router.get("/UI/bookHall.html", (req, res)=>{
    const cookieName = req.cookies.user;
    cookieObj = JSON.parse(cookieName);
    let attributes = Object.keys(cookieObj[0]).length
    const htmlFilePath = path.join(__dirname, 'UI', 'bookHall.html');
    fs.readFile(htmlFilePath, 'utf8', (err, data) => {
    if (err) throw err
    let modifiedHtml = data;
    if(attributes===4){
      modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/adminDashboard.html")
    }else{
      modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/studentdashboard.html")
    }
    currentHallName = req.query.hallName;
    modifiedHtml = modifiedHtml.replace('{{SELECTED_ROOM}}', '<p> Selected Room : ' + `${currentHallName}` + '</p>');
    res.send(modifiedHtml);
  });   
  })

router.post("/book", (req, res) => {
  const date = req.body.date;
  const startTime = req.body.startTime;
  const endTime = req.body.endTime;
  const reason = req.body.reason;
  console.log('booking',currentHallName)
  if(endTime <= startTime){
    const alert = `<script>alert('Invalid timings.');window.history.back();</script>`
    return res.send(alert);
  }
  var sqlQuery = "select hall_id from hall where hall_name = '" + currentHallName + "';";
  var hall_id = "";
  con.query(sqlQuery, function(err, results){
    if(err) throw err;
    console.log(results[0].hall_id);
    hall_id = results[0].hall_id;
    sqlQuery = "select * from hall_booking where date_ = ? and start_time = ? and end_time = ? and hall_id = ? and is_approved = 1";
    con.query(sqlQuery, [date, startTime,endTime,hall_id], function(err, results){
      if(err) throw err;
      if(results.length == 0){
        sqlQuery = "select * from hall_booking where date_ = ? and start_time < ? and end_time > ? and hall_id = ? and is_approved = 1";
        con.query(sqlQuery, [date, startTime,startTime,hall_id], function(err, results){
          if(err) throw err;
          if(results.length == 0){
            const alert = `<script>alert('The hall is free.');window.history.back();</script>`
            res.send(alert);
          } else {
            const alert = `<script>alert('The hall is busy. Please choose another slot.');window.history.back();</script>`
            res.send(alert);
          }
        })
      } else {
        console.log(results);
        const alert = `<script>alert('The hall is busy. Please choose another slot.');window.history.back();</script>`
        res.send(alert);
      }
    })
  })
});

router.post("/change", (req, res) => {
  var currentPassword = req.body.curr;
  var newPassword = req.body.new;
  var confirmPassword = req.body.confirm;
  if(currentPassword!=cookieObj[0].Password){
    const alert = `<script>alert('Your password doesn't match with the existing password'); window.location.href = '/UI/changePassword.html';</script>`
    res.send(alert);
  }else{
    if(newPassword===confirmPassword){
      let attributes = Object.keys(cookieObj[0]).length
      if(attributes===4){
        var sqlQuery = "update admin set Password=? where Admin_id = ?";
        con.query(sqlQuery, [newPassword, cookieObj[0].Admin_id], function(err, results){
        if(err) throw err;
        const alert = `<script>alert('Your password has been updated'); window.location.href = '/UI/studentdashboard.html';</script>`;
        cookieObj[0].Password = newPassword;
        res.send(alert); 
      })
      }else{
        var sqlQuery = "update user set Password=? where User_id = ?";
        con.query(sqlQuery, [newPassword, cookieObj[0].User_id], function(err, results){
        if(err) throw err;
        const alert = `<script>alert('Your password has been updated'); window.location.href = '/UI/studentdashboard.html';</script>`;
        cookieObj[0].Password = newPassword;
        res.send(alert);
      })
      }
      
    }else{
      const alert = `<script>alert('The new passwords do not match'); window.location.href = '/UI/changePassword.html';</script>`;
      res.send(alert);
    }
  }
  
});

module.exports = router;