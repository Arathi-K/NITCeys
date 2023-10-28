const express = require('express');
const con = require('./dbconnection');
const router = express.Router();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { Console } = require('console');
const { promisify } = require('util');

router.use(cookieParser());
let cookieObj = "";
router.use(bodyParser.urlencoded({ extended: true }));

function renderPendingKey(data){
  let html = '';
  data.forEach(item => {
    html += '<li class="list-group-item d-flex justify-content-between align-items-center">'+  `${item.Building}` +' '+ `${item.Room_no}`+'</li>'  ;
  });
  return html;
}
function renderList(data) {
  let selectHTML = '';
  data.forEach(item => {
    selectHTML += '<li class="list-group-item d-flex justify-content-between align-items-center">'+  `${item.Hall_name}` + '<form action="/UI/bookHall.html" method="get"><div class="form-group"><input type="text" hidden name="hallName" value="' + `${item.Hall_name}` + '"></div><button class="btn btn-primary">Book Hall</button></form></li>'  ;
  });
  return selectHTML;
}
function renderPendingList(data){//add cancel request option
  let selectHTML = '';
   data.forEach(item => {
     selectHTML += '<li class="list-group-item d-flex justify-content-between align-items-center">'+  `Hall Name: ${item.Hall_name} <br>Date: ${item.Date_} <br>Time: ${item.Start_time} - ${item.End_time}` + '</li>'  ;
   });
   return selectHTML;
}


function renderKeyList(data){
  let list = '';
  data.forEach( item=>{
    let btns = ["Return Key", "btn-primary"]
    if(item.is_verified===1){
      btns[0]="Returned"
      btns[1]="btn-secondary"
      list += '<li class="list-group-item d-flex justify-content-between align-items-center">'+ `${item.Building}` + ' ' + `${item.Room_no}`+ '<form action="/returned" method="post"><div class="form-group"><input type="text" hidden name="class" value="' + `${item.Room_id}` + '"></div><div class="btn-group"><button class="btn '+ `${btns[1]}`+ ' ml-1">'+ `${btns[0]}`+'</button></div></form></li>'
    }else{
    list += '<li class="list-group-item d-flex justify-content-between align-items-center">'+ `${item.Building}` + ' ' + `${item.Room_no}`+ '<form action="/UI/transferKeys.html" method="get"><div class="form-group"><input type="text" hidden name="room" value="' + `${item.Room_id}` + '"></div><div class="btn-group"><button class="btn btn-primary">Transfer Key</button></div></form><form action="/returned" method="post"><div class="form-group"><input type="text" hidden name="class" value="' + `${item.Room_id}` + '"></div><div class="btn-group"><button class="btn '+ `${btns[1]}`+ ' ml-1">'+ `${btns[0]}`+'</button></div></form></li>'
    }
  });
  return list;
}
function renderApprovedList(data){
  let selectHTML = '';
   data.forEach(item => {
     selectHTML += '<li class="list-group-item d-flex justify-content-between align-items-center">'+  `Hall Name: ${item.Hall_name} <br>Date: ${item.Date_} <br>Time: ${item.Start_time} - ${item.End_time}` + '</li>'  ;
   });
   return selectHTML;
}
function renderClassroomList(data) {
  let selectHTML = '';
  data.forEach(item => {
    selectHTML += '<li class="list-group-item d-flex justify-content-between align-items-center">'+  `${item.Building}` +' '+ `${item.Room_no}`+'<form action="/UI/takeKey.html" method="get"><div class="form-group"><input type="text" hidden name="ClassID" value="' + `${item.Room_id}` + '"></div><button class="btn btn-primary ">Choose</button></form></li>'  ;
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
      modifiedHTML = modifiedHTML.replace('{{halls}}', html);
    }
    const keyQuery = "select is_verified, Building, Room_no, classroom.Room_id from classroom, key_assignment where classroom.Room_id in (select Room_id from key_assignment where User_id=?) and classroom.Room_id = key_assignment.Room_id"
    con.query(keyQuery, [cookieObj[0].User_id], (err, results)=>{
      if(err) throw err;
      html = renderKeyList(results);
      console.log(html)
      modifiedHTML = modifiedHTML.replace('{{KEYS}}', html);
      const q = 'SELECT hall.Hall_name, hall_booking.Date_, hall_booking.Start_time,hall_booking.End_time FROM hall INNER JOIN hall_booking ON hall.Hall_id = hall_booking.Hall_id WHERE hall_booking.is_approved =0 and User_id=?';
      con.query(q, [cookieObj[0].User_id], (e, r) => {
        
        if (e) {
          throw e;
        } else {
          console.log(r)
          html2 = renderPendingList(r)
          
          modifiedHTML = modifiedHTML.replace('{{pending}}', html2)
        }
        
      const q3 = 'SELECT hall.Hall_name, hall_booking.Date_, hall_booking.Start_time,hall_booking.End_time FROM hall INNER JOIN hall_booking ON hall.Hall_id = hall_booking.Hall_id WHERE hall_booking.is_approved =1 and User_id=?';
      con.query(q3,[cookieObj[0].User_id],(e, r) => {
        if (e) {
          throw e;
        } else {
          html3 = renderApprovedList(r)
          modifiedHTML = modifiedHTML.replace('{{app}}', html3)
        }
        const q4 = 'SELECT Building,Room_no,Room_id FROM classroom WHERE is_available=1';
        con.query(q4, (e, r) => {
          if (e) {
            throw e;
          } else {
            html4 = renderClassroomList(r)
            modifiedHTML = modifiedHTML.replace('{{availroom}}', html4)
          }
          res.send(modifiedHTML);
      })
    })
     
    })
    
  } )
  
})})})


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
let currentRoom = "";
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
    console.log(req.query.hallName);
    currentHallName = req.query.hallName;
    
    modifiedHtml = modifiedHtml.replace('{{SELECTED_ROOM}}', '<p> Selected Room : ' + `${currentHallName}` + '</p>');
    res.send(modifiedHtml);
  });   
  })
  router.get("/UI/transferKeys.html", (req, res)=>{
    const cookieName = req.cookies.user;
    cookieObj = JSON.parse(cookieName);
    let attributes = Object.keys(cookieObj[0]).length
    const htmlFilePath = path.join(__dirname, 'UI', 'transferKeys.html');
    fs.readFile(htmlFilePath, 'utf8', (err, data) => {
    if (err) throw err
    let modifiedHtml = data;
    if(attributes===4){
      modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/adminDashboard.html")
    }else{
      modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/studentdashboard.html")
    }
    currentRoom = req.query.room;
    var query = "SELECT Building, Room_no from classroom where Room_id = ?"
    con.query(query,[currentRoom],(err, results)=>{
      if(err) throw err
      if(results.length===0){

      }else{
      modifiedHtml = modifiedHtml.replace('{{CLASSROOM}}', '<p> Selected Room : ' + `${results[0].Building}` + ' '+`${results[0].Room_no}`+ '</p>');
      res.send(modifiedHtml);
      }
    })
    
    
   })
   
  })
router.get("/UI/editPhoneNumber.html", (req, res)=>{
  const cookieName = req.cookies.user;
  cookieObj = JSON.parse(cookieName);
  let attributes = Object.keys(cookieObj[0]).length
  const htmlFilePath = path.join(__dirname, 'UI', 'editPhoneNumber.html');
  fs.readFile(htmlFilePath, 'utf8', (err, data) => {
  if (err) throw err
  let modifiedHtml = data;
  if(attributes===4){
    modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/adminDashboard.html")
  }else{
    modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/studentdashboard.html")
  }
  res.send(modifiedHtml);
});   
})

// router.post("/book", (req, res) => {
//   const date = req.body.date;
//   const startTime = req.body.startTime;
//   const endTime = req.body.endTime;
//   const reason = req.body.reason;
//   console.log('booking',currentHallName)
//   var loggedInUser = "";
//   if(cookieObj[0].Privilege == 'admin'){
//     loggedInUser = cookieObj[0].Admin_id;
//   } else {
//     loggedInUser = cookieObj[0].User_id;
//   }
//   console.log('logged in as', loggedInUser);
//   if(endTime <= startTime){
//     const alert = `<script>alert('Invalid timings.');window.history.back();</script>`
//     return res.send(alert);
//   }
//   var sqlQuery = "select hall_id from hall where hall_name = '" + currentHallName + "';";
//   var hall_id = "";
//   con.query(sqlQuery, function(err, results){
//     if(err) throw err;
//     console.log(results[0].hall_id);
//     hall_id = results[0].hall_id;
//     sqlQuery = "select * from hall_booking where date_ = ? and start_time = ? and end_time = ? and hall_id = ? and is_approved = 1";
//     con.query(sqlQuery, [date, startTime,endTime,hall_id], function(err, results){
//       if(err) throw err;
//       if(results.length == 0){
//         sqlQuery = "select * from hall_booking where date_ = ? and start_time < ? and end_time > ? and hall_id = ? and is_approved = 1";
//         con.query(sqlQuery, [date, startTime,endTime,hall_id], function(err, results){
//           if(err) throw err;
//           if(results.length == 0){
//             sqlQuery = "select * from hall_booking where date_ = ? and start_time < ? and end_time > ? and hall_id = ? and is_approved = 1";
//             con.query(sqlQuery, [date, endTime,endTime,hall_id], function(err, results){
//               if(err) throw err;
//               if(results.length == 0){
//                 sqlQuery = "select * from hall_booking where date_ = ? and start_time > ? and end_time < ? and hall_id = ? and is_approved = 1";
//                 con.query(sqlQuery, [date, startTime,endTime,hall_id], function(err, results){
//                   if(err) throw err;
//                   if(results.length == 0){
//                     sqlQuery = "insert into hall_booking values (?,?,?,?,?,0);";
//                     con.query(sqlQuery, [date,startTime,endTime,hall_id,loggedInUser], function(err, results){
//                     if(err) throw err;
//                     if(cookieObj[0].Privilege == 'admin'){
//                       const alert = `<script>alert('Hall booking request sent. Please await approval from competent authority.'); window.location.href = '/UI/adminDashboard.html';</script>`;
//                       res.send(alert);
//                     } else {
//                       const alert = `<script>alert('Hall booking request sent. Please await approval from competent authority.'); window.location.href = '/UI/studentdashboard.html';</script>`;
//                       res.send(alert);
//                     }  
//                   })
//                   } else {
//                     const alert = `<script>alert('The hall is busy. Please choose another slot.');window.history.back();</script>`
//                     res.send(alert);
//                   }
//                 })
//               } else {
//                 const alert = `<script>alert('The hall is busy. Please choose another slot.');window.history.back();</script>`
//                 res.send(alert);
//               }
//             })
//           } else {
//             const alert = `<script>alert('The hall is busy. Please choose another slot.');window.history.back();</script>`
//             res.send(alert);
//           }
//         })
//       } else {
//         console.log(results);
//         const alert = `<script>alert('The hall is busy. Please choose another slot.');window.history.back();</script>`
//         res.send(alert);
//       }
//     })
//   })
// });

let currentClass="";
router.get("/UI/takeKey.html", (req, res)=>{
  const cookieName = req.cookies.user;
  cookieObj = JSON.parse(cookieName);
  let attributes = Object.keys(cookieObj[0]).length;
  const htmlFilePath = path.join(__dirname, 'UI', 'takeKey.html');
  fs.readFile(htmlFilePath, 'utf8', (err, data) => {
    if (err) throw err
    let modifiedHtml = data;
    if(attributes===4){
      modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/adminDashboard.html");
    }else{
      modifiedHtml = modifiedHtml.replace(`{{LINK}}`, "/UI/studentdashboard.html");
    }
    
    currentClass = req.query.ClassID;
    console.log(currentClass)
    modifiedHtml = modifiedHtml.replace('{{CLASSROOM}}', `${currentClass}`);
    res.send(modifiedHtml);
  });   
})

router.post("/takeKey", (req, res) => {
  const boxkey = req.body.boxkey || 0;  // corrected the sequence of OR (||) operation
  const date = req.body.date;
  const takingTime = req.body.takingTime;
  const returningTime = null; //fake
  const room_id = currentClass;
  console.log('taking ', currentClass);

  const insertSqlQuery = "INSERT INTO key_assignment (Date_, Taking_time, Returning_time, User_id, Room_id, Box_key, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)";
  con.query(insertSqlQuery, [date, takingTime, returningTime, cookieObj[0].User_id, room_id, boxkey, 0], function(err, insertResults) {
      if (err) throw err;
      else {
        const updateSqlQuery = "UPDATE Classroom SET is_available = 0 WHERE Room_id = ?";
        con.query(updateSqlQuery, [room_id], function(err, updateResults) {
            if (err) throw err;
            const alert = `<script>alert('You can take this key');window.location.href="/UI/studentdashboard.html";</script>`;
            res.send(alert);
        });
      }
  });

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

router.post("/changePhone", (req,res) => {
  const cookieName = req.cookies.user;
  cookieObj = JSON.parse(cookieName);
  var currentPhone = req.body.currentPhone;
  var newPhone = req.body.newPhone;
  var confirmPhone = req.body.confirmNewPhone;
  console.log('digits',newPhone.length)
  if(currentPhone!=cookieObj[0].Phone_number){
    const alert = `<script>alert('Incorrect current phone number.'); window.location.href = '/UI/editPhoneNumber.html';</script>`
    res.send(alert);
  } else if(newPhone.length != 10){
    const alert = `<script>alert('Phone number needs to be 10 digits.'); window.location.href = '/UI/editPhoneNumber.html';</script>`
    res.send(alert);
  }else{
    if(newPhone===confirmPhone){
      cookieObj[0].Phone_number = newPhone;
      var sqlQuery = "update user set Phone_number=? where User_id = ?";
        con.query(sqlQuery, [newPhone, cookieObj[0].User_id], function(err, results){
        if(err) throw err;
        const alert = `<script>alert('Your phone number has been updated'); window.location.href = '/UI/profileDetails.html';</script>`;
        var newQuery = "select * from user where User_id = ?";
        con.query(newQuery, [cookieObj[0].User_id], function(err, results) {
          if(err) throw err;
          const newQueryHash = JSON.stringify(results);
          res.cookie("user",newQueryHash);
          res.send(alert);
        })
        // res.send(alert);
       })
    }else{
      const alert = `<script>alert('The new phone numbers do not match.'); window.location.href = '/UI/editPhoneNumber.html';</script>`;
      res.send(alert);
    }
  }
})



router.post("/transfer",(req,resp)=>{
   const date = req.body.theDate
   const time = req.body.Time
   const phoneNo = req.body.phone
   console.log(currentRoom)
   const regex = /^\d{10}$/; // Regular expression to match exactly 10 digits
   if (regex.test(phoneNo)) {
    const phoneQuery = "Select User_id from user where Phone_number = ?"
    con.query(phoneQuery, [phoneNo], (err,results)=>{
      if(err) throw err
      console.log(results);
      if(results.length===0){
        const alert =`<script>alert('Phone no entered is incorrect'); window.history.back();</script>`;
        resp.send(alert)
      }else{
        const updateQuery = "Update key_assignment set Date_ = ? ,Taking_time = ? , User_id = ? where Room_id = ?"
        con.query(updateQuery,[date,time,results[0].User_id,currentRoom],(err, results)=>{
          if(err) throw err
          const alert = `<script>alert('The key has been transferred'); window.location.href = '/UI/studentdashboard.html';</script>`
          resp.send(alert)
        })
      }
    })
  } else {
     const alert =`<script>alert('Phone no should contain 10 digits'); window.location.href = '/UI/transferKeys.html';</script>`;
     resp.send(alert)
  }
   
})
router.post("/returned",(req,res)=>{
    let room = req.body.class;
    // console.log(req.body.class);
    const query = "update key_assignment set is_verified = 1 where Room_id = ?"
    con.query(query,[room],(err, results)=>{
      const alert =`<script>alert('Key return request submitted. Please await approval.'); window.location.href = '/UI/studentdashboard.html';</script>`;
      res.send(alert)
    })
})

module.exports = router;