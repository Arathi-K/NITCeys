const con = require('./dbconnection');
const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 8080;
const http = require('http');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/UI', express.static(path.join(__dirname, 'UI')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI', 'login.html'));
});

app.get('/UI/studentdashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI', 'studentdashboard.html'));
});

app.get('/UI/adminDashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI', 'adminDashboard.html'));
});

app.listen(port, () => {
  console.log(`Server successfully running on port ${port}`);

  exec(`start http://localhost:${port}`, (error) => {
    if (error) {
      console.error('Error opening browser:', error);
    }
  });
});

app.post('/', (req, res) => {
  var username = req.body.username.trim();
  var password = req.body.password.trim();
  if (username[0] === 'A') {
    var sqlQuery = "select * from admin where Admin_id = ? and Password = ?";
    con.query(sqlQuery, [username, password], function (err, result) {
      if (err) throw err;
      if (result.length == 0) {
        // res.send("User doesnt exist");
        const alertScript = `<script>alert('User does not exist.');window.location.href = '/UI/login.html';</script>`;
        res.send(alertScript);
      } else {
        res.redirect('/UI/adminDashboard.html');
      }
    });
  } else {
    var sqlQuery = "select * from user where User_id = ? and Password = ?";
    con.query(sqlQuery, [username, password], function (err, result) {
      if (err) throw err;
      if (result.length == 0) {
        // res.send("User doesnt exist");
        const alertScript = `<script>alert('User does not exist.');window.location.href = '/UI/login.html';</script>`;
        res.send(alertScript);
      } else {
        // res.send("Data received");
        res.redirect('/UI/studentdashboard.html');
      }
    });
  }
})
