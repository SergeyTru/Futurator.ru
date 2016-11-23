 

const ft = require('./ft')

const cheerio =  require('cheerio')
const http = require('http');
const https = require("https");
const nodemailer = require('nodemailer');
const later = require('later');

 
const express = require('express');
const bodyParser= require('body-parser')


const app = express();

const MongoClient = require('mongodb').MongoClient

var mongo_url="mongodb://root:1234@ds159517.mlab.com:59517/test_database";

var db


MongoClient.connect(mongo_url, (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
})



app.use(bodyParser.urlencoded({extended: true}))

app.set('view engine', 'ejs') 



 
  

app.get('/', (req, res) => {
  
  db.collection('quotes').find().toArray((err, result) => {
    if (err) return console.log(err)
    // renders index.ejs
    res.render('index.ejs', {quotes: result}) 
  })
})


app.post('/quotes', (req, res) => {

 //req.body
//save_to_db={website:ft.website,input_json:ft.input_json}
  db.collection('quotes').save(req.body, (err, result) => {
    if (err) return console.log(err)

    console.log('saved to database')
    res.redirect('/')
  })
})
 




app.get('/mail', (req, res) => {

 
  send_mail();
  console.log('mail sent')


  res.send({ message: "sent" });
})



function send_mail() {

 var smtpConfig = {
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: '----',
        pass: '----'
    }
};
  var transporter = nodemailer.createTransport(smtpConfig);
  var mailData = {
    from: 'mydiskmydisk@yandex.ru',
    to: 'amantels@gmail.com',
    subject: 'Message title',
    text: 'Plaintext version of the message',
    html: 'HTML version of the message'
  };

  transporter.sendMail(mailData);

  console.log('mail sent')

};






app.get("/fetch", function (req, res, next) {
  if (req.query) {
    if (req.query.url === undefined) {
      res.send({ message: "url cannot be undefined" });
    }
    var urlPrefix = req.query.url.match(/.*?:\/\//g);
    
    

    if (urlPrefix !== undefined && urlPrefix !== null && urlPrefix[0] === "https://") {
      https.get(req.query.url, function (result) {
        processResponse(result);
      }).on('error', function (e) {
        res.send({ message: e.message });
      });
    } else {
      http.get(req.query.url, function (result) {
        processResponse(result);
      }).on('error', function (e) {
        res.send({ message: e.message });
      });
    }

    var processResponse = function (result) {
      var data = "";
      result.on("data", function (chunk) {
        data += chunk;
      });
      result.on("end", function (chunk) {

        $ = cheerio.load(data);


        json_result=ft.check(ft.input_json);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(json_result));

      });
    }

  }
});


//later.setInterval(send_mail, later.parse.text('every 20 secs'));
