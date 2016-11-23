const express = require('express');
const http = require('http');
const https = require("https");
const URIlib = require('./URI')

const test = require('./testmail'); 

const nodemailer = require('nodemailer');
const later = require('later');

const app = express();

app.listen(3000, () => {
console.log('listening on 3000') 
})

 
app.get('/', (req, res) => {
   res.render('index.ejs', {}) 
})
   

app.get('/showmail', (req, res) => {

 //   console.log(test.test_data.results_json.search_results);
   res.render('mail.ejs', {json_data:test.test_data}) 
})




app.get('/sendmail', (req, res) => {

 
res.render('mail.ejs', {json_data:test.test_data}, function(err, html){
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
    