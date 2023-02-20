var express = require('express');
var mysql = require('mysql');
var app = express();
const cors = require("cors");
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cf = require('./middleware/common_functions_server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const server = require('http').createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server:server });


// var con = mysql.createConnection({
//     host: "localhost",    // ip address of server running mysql
//     user: "root",    // user name to your mysql database
//     password: "root",    // corresponding password
//     database: "anpr"  // use this database to querying context
// });

var con = mysql.createConnection({
        host:'db-seedworks-production.cubaxiuycgsa.ap-south-1.rds.amazonaws.com',
        user:"admin",
        password:'seedworks123',
     database:'dubai'
});

app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


wss.on('connection', function connection(ws) {
//    console.log('A new client Connected!');
    con.query(
        `SELECT * FROM dubai.anpr order by id desc limit 10;`,
        (err, result) => {

           ws.send(JSON.stringify(result));
          
        });
  //  ws.send('Welcome New Client!');
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
    });
  });



app.post('/register', (req, res, next) => {
    con.query(
        `SELECT * FROM dubai.users WHERE LOWER(email) = LOWER(${con.escape(
            req.body.email
        )});`,
        (err, result) => {
            if (result.length) {
                return res.status(409).send({
                    msg: 'This user is already in use!'
                });
            } else {
                // username is available
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).send({
                            msg: err
                        });
                    } else {
                        // has hashed pw => add to database
                        con.query(
                            `INSERT INTO users (username, password, email) VALUES ('${req.body.username}',${con.escape(hash)}, ${con.escape(
                                req.body.email
                            )})`,
                            (err, result) => {
                                if (err) {
                                    throw err;
                                    return res.status(400).send({
                                        msg: err
                                    });
                                }
                                return res.status(201).send({
                                    msg: 'The user has been registerd with us!'
                                });
                            }
                        );
                    }
                });
            }
        }
    );
});


app.post('/login', (req, res, next) => {
    con.query(
        `SELECT * FROM dubai.users WHERE email = ${con.escape(req.body.email)} OR username = ${con.escape(req.body.email)};`,
        (err, result) => {
            // user does not exists
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            if (!result.length) {
                return res.status(401).send({
                    msg: 'Email or password is incorrect!'
                });
            }
            // check password
            bcrypt.compare(
                req.body.password,
                result[0]['password'],
                (bErr, bResult) => {
                    // wrong password
                    if (bErr) {
                        throw bErr;
                        return res.status(401).send({
                            msg: 'Email or password is incorrect!'
                        });
                    }
                    if (bResult) {
                        const token = jwt.sign({ id: result[0].id }, 'the-super-strong-secrect', { expiresIn: '1h' });
                        con.query(
                            `UPDATE dubai.users SET last_login = now() WHERE id = '${result[0].id}'`
                        );
                        return res.status(200).send({
                            msg: 'Logged in!',
                            token,
                            user: result[0]
                        });
                    }
                    return res.status(401).send({
                        msg: 'Username or password is incorrect!'
                    });
                }
            );
        }
    );
});


app.get('/get_vehicle_data', (req, res) => {

    con.query(
        `SELECT * FROM dubai.anpr order by id desc limit 10;`,
        (err, result) => {
           res.send(result);

        });
});

app.get('/get_vehicle_table_data', (req, res) => {
   let startDate = req.query.startDate;
   let endDate = req.query.endDate;
   let status = req.query.status;
   let query = '';
   if(status == ''){
    query = `SELECT * FROM dubai.anpr where date between '${startDate}' and '${endDate}' order by id desc;`;

   }else{
    query = `SELECT * FROM dubai.anpr where date between '${startDate}' and '${endDate}' and status = '${status}' order by id desc;`;

   }
   console.log(query);
    con.query(
        query,
        (err, result) => {
           res.send(result);

        });
});


 server.listen(5000, function () {
    // var host = server.address().address;
    // var port = server.address().port;

    console.log(`Example app listening on port 5000`);

});

