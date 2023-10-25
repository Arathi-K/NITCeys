const con = require('./dbconnection');
const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 8080;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'UI', 'login.html'));
});

app.listen(port, () => {
    console.log(`Server successfully running on port ${port}`);

    exec(`start http://localhost:${port}`, (error) => {
        if (error) {
            console.error('Error opening browser:', error);
        }
    });
});

app.post('/',(req,res)=>{
    var username = req.body.username.trim();
    var password = req.body.password.trim();
    var sqlQuery = "select * from user where User_id = ? and Password = ?";
    con.query(sqlQuery,[username, password],function(err,result){
      if(err) throw err;
      if(result.length==0){
        res.send("User doesnt exist");
      }else{
        res.send("Data received");
      }
    });
})
