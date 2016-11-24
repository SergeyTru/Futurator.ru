const express = require('express');
const bodyParser = require('body-parser')

const http = require('http');
const https = require("https");
const URIlib = require('./URI')

const test = require('./testmail');

const nodemailer = require('nodemailer');
const later = require('later');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }))

const MongoClient = require('mongodb').MongoClient

var mongo_url = "mongodb://root:1234@ds159517.mlab.com:59517/test_database";

var db



MongoClient.connect(mongo_url, (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
})

app.post('/save', (req, res) => {
  db.collection('airbnb').update({}, { $push: { 'requests': req.body } }, (err, result) => {
    if (err) {
      res.send({ error: err });
      return 0;
    }

    console.log('saved to database')
    res.send({ message: "ok" });
    return 1;
  })
})


app.get('/', (req, res) => {
  res.render('index.ejs', {})
})


app.get('/showmail', (req, res) => {
  res.render('mail.ejs', { json_data: test.test_data })
})








app.get('/sendmail', (req, res) => {


  res.render('mail.ejs', { json_data: test.test_data }, function (err, html) {
    if (err == null) {
      send_mail(html);
      res.send({ message: "ok" });
    } else {
      res.send({ error: err });
    }
  });

});








function send_mail(html) {

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
    subject: 'FUTUBNB',
    text: 'Only HTML here, sorry',
    html: html
  };

  transporter.sendMail(mailData);

  console.log('mail sent')

};
