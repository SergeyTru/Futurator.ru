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
var ObjectID = require('mongodb').ObjectID; 

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
    //TODO: check that request contains airbnb and mail is not empty
var json=req.body;
json.url=json.url.trim();
json.email=json.email.trim();

    db.collection('airbnb.requests').save(json, (err, result) => {
        if (err)
            return console.log(err)

        console.log('saved to database')
        res.redirect('/')
    })
})





function render_url(url) {
    var url_instance = new URIlib.URI(url);

    path = url_instance.getPath();
    query = url_instance.getQuery()
    location = "&location=" + path.substring(3, path.length);
    new_url = url_instance.getScheme() + "://" + url_instance.getAuthority() + "/search/search_results?" + query + location;
    return new_url;
}




app.get('/', (req, res) => {

db.collection('airbnb.requests').find().toArray(function(err, results) {
   
  res.render('index.ejs', {requests:results});
})

    
})


app.get('/showmail', (req, res) => {
    res.render('mail.ejs', { json_data: test.test_data })
})


 

app.post('/set_active', (req, res) => {

    db.collection('airbnb.requests').findOneAndUpdate({_id: ObjectID(req.body.request_id)}, { $set: { active: req.body.new_active_state } }, (err, result) => {
    console.log("Yahoo! " + err + " / " + result);
    console.log(result);
    });
     res.redirect('/');
});
 




app.get('/sendmail', (req, res) => {


    res.render('mail.ejs', { json_data: test.test_data }, function(err, html) {
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
            user: '-----',
            pass: '-----'
        }
    };
    var transporter = nodemailer.createTransport(smtpConfig);
    var mailData = {
        from: 'mydiskmydisk@yandex.ru',
        to: 'amantels@gmail.com',
        subject: 'New findings on Super BnB',
        text: 'Only HTML here, sorry',
        html: html
    };

    transporter.sendMail(mailData);

    console.log('mail sent')

};






function fetch_bnb(url, resourse,final_json) {
    console.log("fetching "+url);
    var url_instance = new URIlib.URI(url);
    var transport = (url_instance.getScheme() || "").toLowerCase() === "https" ? https : http;

    //TODO - form /search/ from URL
    var httpParams = {
        host: url_instance.getAuthority(),
        headers: { 'user-agent': 'Mozilla/5.0' },
        path: (url_instance.getPath() || "") + "?" + (url_instance.getQuery() || "")
    }

    var transpot_info = transport.get(httpParams, function(result) {
        processResponse(result, resourse, final_json, url_instance);
    }).on('error', function(e) {
        res.send({ message: e.message });
    });


}
/*

        var url='https://www.airbnb.com/search/search_results?guests=1&checkin=04%2F01%2F2017&checkout=04%2F07%2F2017&price_max=2845&ss_id=dmtd8n9l&ss_preload=true&source=bb&page=2&s_tag=YA5tDrsR&allow_override%5B%5D=&location=Maldiv';
        var url_instance = new URIlib.URI(url);
        console.log(url_instance);

        page = url_instance.parseQuery().getParam("page");
        console.log(page);

*/

var processResponse = function(result, resourse, final_json, url_instance) {
    //console.log("processing");
    var data = "";
    result.on("data", function(chunk) {
        data += chunk;
    });
    result.on("end", function(chunk) {

        var room_link = "https://www.airbnb.com/rooms/";




        var result_json = final_json.result_json;
        data = JSON.parse(data).results_json;
        var results = data.search_results;
        for (i = 0; i < results.length; i++) {
            var listing = results[i].listing;
            var price_object = results[i].pricing_quote;
            json_object = {
                air_id: listing.id,
                url: room_link + listing.id,
                title: listing.name,
                price: price_object.rate.amount,
                price_currency: price_object.rate.currency,
                price_type: price_object.rate_type,
                img: listing.picture_url
            };
            result_json.push(json_object);
        }
        final_json.results = result_json;
        final_json.found_on_page = data.metadata.pagination.result_count;
        final_json.max_on_page = 18
        final_json.total = data.metadata.listings_count;
        page = url_instance.parseQuery().getParam("page");
        //console.log(page);
        if (page === null)
            page = 1;
        //console.log("processing page "+page);    
 
 
        if (final_json.total === final_json.found_on_page*1 + final_json.max_on_page * (page*1 - 1)) {
            //finished
            resourse.setHeader('Content-Type', 'application/json');
            resourse.send(final_json);
        } else {
            //load more
            var new_url=url_instance.toString().replace(/&page=\d*/,"&page="+(page*1+1));
           // console.log("load more "+new_url);
            //resourse.setHeader('Content-Type', 'application/json');
            //resourse.send(final_json);
            fetch_bnb(new_url, resourse, final_json);

        }




    });
}


app.post("/fetch", function(req, res, next) {


    if (req.body) {
        var requested_url = req.body.url.trim();
        if (requested_url === undefined) {
            res.send({ message: "url cannot be undefined" });
        }
        new_url = render_url(requested_url);
        console.log(new_url);
        fetch_bnb(new_url, res,{ result_json: [] });

    }
});
