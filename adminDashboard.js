const express = require('express');
const con = require('./dbconnection');
const fs = require('fs');
const router = express.Router();
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const { error } = require('console');
router.use(cookieParser());
let cookieObject = "";

router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.json()); // For parsing JSON bodies


var sqlQuery = 'SELECT * from key_assignment NATURAL join user NATURAL join classroom where is_verified = 0'
var sqlQuery2='SELECT * FROM hall_booking NATURAL join hall where is_approved = 0'
var sqlQuery3='select * from hall'
var sqlQuery4 = 'SELECT * from key_assignment NATURAL join user NATURAL join classroom where is_verified = 1'

router.get('/UI/adminDashboard.html', (req, res) => {
    const fp = path.join(__dirname,'UI','adminDashboard.html');
    fs.readFile(fp,'utf-8',(err,data) => {
    if(err) throw err
    let modified = data;

    con.query(sqlQuery,(err, results)=>{
        if (err) throw err;
        // console.log(results);
        let listItems = "";
            results.forEach(row => {
                listItems += `<li> <strong> Location: </strong>${row.Building} ${row.Room_no} <br> <strong>Key Holder:</strong> ${row.Name}<br> <strong>Phone Number:</strong> ${row.Phone_number}  </li><hr> <br>`;
            });
        modified=modified.replace('{{listItems}}', `${listItems}`);
    })

    con.query(sqlQuery3,(err, results)=>{
        if (err) throw err;
        let TotalHalls = "";
            results.forEach(row => {
                TotalHalls += `<li class="list-group-item d-flex justify-content-between align-items-center">
                                ${row.Hall_name}
                                <form action="/UI/bookHall.html" method="GET">
                                    <input type="text" hidden name="hallName" value="${row.Hall_name}">
                                    <input type="text" hidden name="hall_id" value="${row.Hall_id}">
                                    <button type="submit" class="btn btn-primary halls">
                                        Book Hall
                                    </button>
                                </form>
                                </li> 
                                <br>`
                                
        });
        modified=modified.replace('{{TotalHalls}}', `${TotalHalls}`);
    })

    con.query(sqlQuery4,(err, results)=>{
      if (err) throw err;
      let i=0;
      let ReturnedKeys = "";
          results.forEach(row => {
            ReturnedKeys += 
            `<div class="d-flex align-items-center" id="keyapprove${i}">
                <div class="col">
                  <li> 
                  <strong> Location: </strong>${row.Building} ${row.Room_no} <br> 
                  <strong>Key Holder:</strong> ${row.Name}<br> 
                  <strong>Phone Number:</strong> ${row.Phone_number}<br>  
                  <strong>Collected at:</strong> ${row.Taking_time}
                  </li> 
                  </div>
                  <div class="col-auto">
                      <button class="btn btn-primary key-button" id="button-key-${i++}"
                      data-roomid="${row.Room_id}" data-date="${row.Date_}" data-user="${row.User_id}" data-start="${row.Taking_time}">
                      Verify Key
                      </button>
                  </div>
              </div>
              <hr>
              <br>`;
          });
      modified=modified.replace('{{ReturnedKeys}}', `${ReturnedKeys}`);
  })

    con.query(sqlQuery2,(err, results)=>{
        if (err) throw err;
        let RequestItems = "";
        let i=0;
        let j=0;
            results.forEach(row => {
                const inputDate = new Date(row.Date_);
                const options = { month: 'short', day: 'numeric', year: 'numeric' };
                const formattedDate = inputDate.toLocaleDateString('en-US', options);

                // let namez="";
                // if(row.User_id[0]==='A'){
                //   adminQuery='select * from admin where Admin_id=?'
                //   con.query(adminQuery,[row.User_id],(err, pp)=>{
                //     if (err) throw err;
                //     namez=pp[0].Name;
                //     console.log(namez)
                //   });
                // }
                // else{
                //   userQuery='select * from user where User_id=?'
                //   con.query(userQuery,[row.User_id],(err, pp)=>{
                //     if (err) throw err;
                //     namez=pp[0].Name;
                //     console.log(namez)
                //   });
                // }

                RequestItems += 
                `<div class="d-flex align-items-center" id="box${i}">
                <div class="col">
                    <strong>Hall:</strong> ${row.Hall_name}
                    <br>
                    <strong>Location:</strong> ${row.location}
                    <br>
                    <strong>Request Date:</strong> ${formattedDate}
                    <br>
                    <strong>Requested Time:</strong> ${row.Start_time}
                    <br>
                    <strong>Ending Time:</strong> ${row.End_time}
                    <br>
                    <strong>User:</strong> ${row.User_id}
                    <br>
                    <strong>Reason:</strong> Put column in db loosus
                </div>
                <div class="col-auto">
                    <button class="btn btn-primary approve-button" id="button-container-${i++}"
                    data-hallid="${row.Hall_id}" data-date="${row.Date_}" data-start="${row.Start_time}" data-end="${row.End_time}" data-user="${row.User_id}">
                    Approve
                    </button>
                    <button class="btn btn-primary reject-button" id="button-reject-${j++}"
                    data-hallid="${row.Hall_id}" data-date="${row.Date_}" data-start="${row.Start_time}" data-end="${row.End_time}" data-user="${row.User_id}">
                    Reject
                    </button>
                </div>
                </div>
                <hr>
                <br>`;
            });
        modified=modified.replace('{{RequestItems}}', `${RequestItems}`);
        res.send(modified);
    })
    });
});

router.post('/updateDatabase', (req, res) => {
    const hallid = req.body.hallid;

    const date = req.body.date;
    const inputDate = new Date(date);
    const year = inputDate.getFullYear();
    const month = String(inputDate.getMonth() + 1).padStart(2, '0'); 
    const day = String(inputDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const start = req.body.start;
    const end = req.body.end;
    const userId = req.body.userId
    console.log("Brr",hallid,formattedDate,start,end,userId);
    let error_flag=0;

    const checkQuery = 'Select * from hall_booking where Date_=? and Hall_id=? and is_approved=1';
    con.query(checkQuery,[formattedDate,hallid],(err, results)=>{
        if (err) throw err;
        if (results!=null && results.length>0){
            results.forEach(row => {
                if( (row.Start_time<=start && row.End_time>=start) || 
                    (row.Start_time<=end && row.End_time>=end) || 
                    (row.Start_time>=start && row.End_time<=end) ||
                    (row.Start_time<=start && row.End_time>=end))
                {
                    console.log("Cannot approve, auto rejecting due to clash.");
                    error_flag=1;
                    console.log(error_flag);
                }
            });
            console.log("gfg",error_flag);
              if(error_flag!=1){
                const sqlupd = 'UPDATE hall_booking set is_approved=1 where Date_=? and Start_time=? and End_time=? and Hall_id=? and user_id=?';
                con.query(sqlupd,[formattedDate,start,end,hallid,userId],(err, results)=>{
                    if (err) throw err;
                    res.json({ message: 'Approval Successful' });
                    console.log("ok");
                });
              }else{
                const sqldel = 'Delete from hall_booking where is_approved=0 and Date_=? and Start_time=? and End_time=? and Hall_id=? and user_id=?';
                con.query(sqldel,[formattedDate,start,end,hallid,userId],(err, results)=>{
                    if (err) throw err;
                    console.log("notok");
                    res.json({ message: 'Auto Rejecting !! Due to Clash' });
                });
              }
        }
        else{
          console.log("you can also approve this");
          const sqlupd = 'UPDATE hall_booking set is_approved=1 where Date_=? and Start_time=? and End_time=? and Hall_id=? and user_id=?';
                con.query(sqlupd,[formattedDate,start,end,hallid,userId],(err, results)=>{
                    if (err) throw err;
                    res.json({ message: 'Approval Successful' });
                });
        }
    });
});


router.post('/deleteDatabase', (req, res) => {
    const hallid = req.body.hallid;

    const date = req.body.date;
    const inputDate = new Date(date);
    const year = inputDate.getFullYear();
    const month = String(inputDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1 and pad with 0 if needed
    const day = String(inputDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const start = req.body.start;
    const end = req.body.end;
    const userId = req.body.userId
    console.log("HO",hallid,formattedDate,start,end,userId);

    const delQuery = 'Delete from hall_booking where Date_=? and Start_time=? and End_time=? and Hall_id=? and User_id=? and is_approved = 0';
    con.query(delQuery,[formattedDate,start,end,hallid,userId],(err, results)=>{
        if (err) throw err;
        console.log(results);
    });
    res.json({ message: 'Rejection Successful' });
});


router.post('/deleteKeyholder', (req, res) => {
  console.log("entering");
  
  const roomid = req.body.roomId;
  const date = req.body.date;
  const start = req.body.start;
  const userId = req.body.userId

  const inputDate = new Date(date);
  const year = inputDate.getFullYear();
  const month = String(inputDate.getMonth() + 1).padStart(2, '0'); 
  const day = String(inputDate.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  console.log("HK",roomid,formattedDate,start,userId);

  const delQuery = 'DELETE from key_assignment where Date_=? and Taking_time=? and Room_id=? and User_id=? and is_verified = 1';
  const updQuery = 'Update classroom set is_available = 1 where Room_id =?';
  con.query(delQuery,[formattedDate,start,roomid,userId],(err, results)=>{
      if (err) throw err;
  });
  con.query(updQuery,[roomid],(err, results)=>{
    if (err) throw err;
});
  res.json({ message: 'Del Post and upd room' });
});

router.get("/UI/bookHall.html", (req, res)=>{
    const cookieName = req.cookies.user;
    cookieObj = JSON.parse(cookieName);
    console.log("Hello",cookieObj[0]);
    const htmlFilePath = path.join(__dirname, 'UI', 'bookHall.html');
    fs.readFile(htmlFilePath, 'utf8', (err, data) => {
    if (err) throw err
    let modifiedHtml = data;
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
  var loggedInUser = "";
  
  if(Object.keys(cookieObj[0]).length==4){
    loggedInUser = cookieObj[0].Admin_id;
    console.log("admin")
  }
  else{
    loggedInUser = cookieObj[0].User_id;
    console.log("user")
  }
  console.log('from admin dashboard : logged in as', loggedInUser);
  const today = new Date();
  const todays_date = today.getDate();
  const month = today.getMonth() + 1;
  const year =  today.getFullYear();
  const requiredDate = String(year) + '-' + String(month) + '-' + String(todays_date);
  console.log('date',requiredDate, 'time: ', today.toTimeString());
  const hrs = today.getHours();
  const mins = today.getMinutes();
  const secs = today.getSeconds();
  const current_time = String(hrs) + ":" + String(mins);
  console.log('current time: ', current_time);
  if(date < requiredDate){
    const alert = `<script>alert('Invalid date chosen.');window.history.back();</script>`
    return res.send(alert);
  }
  if(startTime < current_time){
    const alert = `<script>alert('Invalid timings.');window.history.back();</script>`
    return res.send(alert);
  }
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
            sqlQuery = "select * from hall_booking where date_ = ? and start_time < ? and end_time > ? and hall_id = ? and is_approved = 1";
            con.query(sqlQuery, [date, endTime,endTime,hall_id], function(err, results){
              if(err) throw err;
              if(results.length == 0){
                sqlQuery = "select * from hall_booking where date_ = ? and start_time > ? and end_time < ? and hall_id = ? and is_approved = 1";
                con.query(sqlQuery, [date, startTime,endTime,hall_id], function(err, results){
                  if(err) throw err;
                  if(results.length == 0){
                    sqlQuery = "insert into hall_booking values (?,?,?,?,?,0);";
                    con.query(sqlQuery, [date,startTime,endTime,hall_id,loggedInUser], function(err, results){
                    if(err) throw err;
                    
                    if(Object.keys(cookieObj[0]).length==4){
                      const alert = `<script>alert('Hall booking request sent. Please await approval from competent authority.'); window.location.href = '/UI/adminDashboard.html';</script>`;
                      res.send(alert);
                    }
                    else{
                      const alert = `<script>alert('Hall booking request sent. Please await approval from competent authority.'); window.location.href = '/UI/studentdashboard.html';</script>`;
                      res.send(alert);
                    }

                  })
                  } else {
                    const alert = `<script>alert('The hall is busy. Please choose another slot.');window.history.back();</script>`
                    res.send(alert);
                  }
                })
              } else {
                const alert = `<script>alert('The hall is busy. Please choose another slot.');window.history.back();</script>`
                res.send(alert);
              }
            })
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

module.exports = router;