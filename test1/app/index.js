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






app.get('/', (req, res) => {
    db.collection('airbnb.requests').find().toArray(function (err, results) {

        res.render('index.ejs', { requests: results });
    })


})


app.get('/showmail', (req, res) => {
    res.render('mail.ejs', { json_data: test.test_data.results_json.search_results })
})



app.post('/save', (req, res) => {
    //TODO: check that request contains airbnb and mail is not empty
    var json = req.body;
    json.url = json.url.trim();
    json.email = json.email.trim();

    db.collection('airbnb.requests').save(json, (err, result) => {
        if (err)
            return console.log(err)

        console.log('saved to database')
        res.redirect('/')
    })
})






app.post('/set_active', (req, res) => {

    db.collection('airbnb.requests').findOneAndUpdate({ _id: ObjectID(req.body.request_id) }, { $set: { active: req.body.new_active_state } }, (err, result) => {
        console.log("Yahoo! " + err + " / " + result);
        console.log(result);
    });
    res.redirect('/');
});





app.get('/sendmail', (req, res) => {
    send_mail_from_DB(res, true);
});







function render_url(url) {
    var url_instance = new URIlib.URI(url);

    path = url_instance.getPath();
    query = url_instance.getQuery()
    location = "&location=" + path.substring(3, path.length);
    new_url = url_instance.getScheme() + "://" + url_instance.getAuthority() + "/search/search_results?" + query + location;
    return new_url;
}




function send_mail(email, html) {

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
        to: email,
        subject: 'New findings on Super BnB',
        text: 'Only HTML here, sorry',
        html: html
    };

    transporter.sendMail(mailData);

    console.log('mail sent');
    return true;

};





//https://www.airbnb.com/search/search_results?%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0--%D0%B3%D0%BE%D1%80%D0%BE%D0%B4-%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0?page=1&allow_override%5B%5D=&ss_id=cr55kq37&price_max=653&ne_lat=55.76371669547501&ne_lng=37.649681311595714&sw_lat=55.75426077896213&sw_lng=37.62255881403712&zoom=15&search_by_map=true&s_tag=fG-hoEkr
app.get("/fetch", function (req, res) {

    var httpParams = {
        host: "airbnb.com",
        headers: { 'user-agent': 'Mozilla/5.0' },
        path: "/search/search_results?%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0--%D0%B3%D0%BE%D1%80%D0%BE%D0%B4-%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0?page=1&allow_override%5B%5D=&ss_id=cr55kq37&price_max=653&ne_lat=55.76371669547501&ne_lng=37.649681311595714&sw_lat=55.75426077896213&sw_lng=37.62255881403712&zoom=15&search_by_map=true&s_tag=fG-hoEkr"
    }
    https.get(httpParams, function (result) {
        console.log(result)
        res.send({ message: "ok" });
    }).on('error', function (e) {
        res.send({ message: e.message });
    });
    
});



function fetch_bnb(url, resourse, final_json) {
    console.log("fetching " + url);
    var url_instance = new URIlib.URI(url);
    var transport = (url_instance.getScheme() || "").toLowerCase() === "https" ? https : http;

    var httpParams = {
        host: url_instance.getAuthority(),
        headers: { 'user-agent': 'Mozilla/5.0' },
        path: (url_instance.getPath() || "") + "?" + (url_instance.getQuery() || "")
    }


    var transpot_info = transport.get(httpParams, function (result) {
        console.log("ok");
        processResponse(result, resourse, final_json, url_instance);
    }).on('error', function (e) {
        console.log("not ok");
        res.send({ message: e.message });
    });
   // return final_json; 

}


var processResponse = function (result, resourse, final_json, url_instance) {
    //console.log("processing");
    var data = "";
    result.on("data", function (chunk) {
        data += chunk;
    });
    result.on("end", function (chunk) {

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


        if (final_json.total === final_json.found_on_page * 1 + final_json.max_on_page * (page * 1 - 1)) {
            //finished
            onComplete(finalJSON);
            resourse.setHeader('Content-Type', 'application/json');
            resourse.send(final_json);
        } else {
            //load more
            var new_url = url_instance.toString().replace(/&page=\d*/, "&page=" + (page * 1 + 1));
            // console.log("load more "+new_url);
            //resourse.setHeader('Content-Type', 'application/json');
            //resourse.send(final_json);
            fetch_bnb(new_url, resourse, final_json);

        }




    });
}


/*
app.post("/fetch", function (req, res, next) {


    if (req.body) {
        var requested_url = req.body.url.trim();
        if (requested_url === undefined) {
            res.send({ message: "url cannot be undefined" });
        }
        new_url = render_url(requested_url);
        console.log(new_url);
        fetch_bnb(new_url, res, { result_json: [] });

    }
});
*/


function doCrawl(url) {
   // crawlPage(url, resp => filterResponses(resp, filtered => putToDB(filtered)))
    var result = [];
    for (var i = 1; i < 27; ++i) {
        result.push({
            listing: {
                id: i,
                name: "Super flat " + i,
                picture_url: "http://satyr.io/200x300/red?a=" + i
            },
            pricing_quote: {
                rate: {
                    amount: i * 100,
                    currency: "RUB"
                },
                rate_type: "nightly",
            }
        });
    }
    return result;
    /*
        
          var actualUrl = render_url(actualUrl);
          var url_instance = new URIlib.URI(url);
          var transport = (url_instance.getScheme() || "").toLowerCase() === "https" ? https : http;
      
          
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
          return final_json;
          */
}




function send_mail_from_DB(res, del) {
    db.collection('airbnb.tomail').find().toArray(function (err, results) {
        results.forEach(function (elem) {


            res.render('mail.ejs', { json_data: elem.responses }, function (err, html) {

                if (err == null) {
                    if (send_mail(elem.email, html))
                        if (del)
                            db.collection('airbnb.tomail').deleteOne({ _id: elem._id }, (err, result) => { });;
                } else {
                    console.log(err);
                }
            });


        });

        res.send({ message: "ok" });
    })
}


app.get("/crawl", function (req, res, next) {

    db.collection('airbnb.requests').find({ active: { $eq: "1" } }).toArray((err, result) => {

        var founded = result.map(elem => {
            new_url = render_url(elem.url);
            //var crawled = fetch_bnb(new_url, res, { result_json: [] });
            var crawled = doCrawl();
            if (elem.responses) {
                var existed = elem.responses.map(resp => resp.listing.id);
                crawled = crawled.filter(function (resp) {
                    return existed.indexOf(resp.listing.id) < 0
                });
            }
            if (crawled.length > 0) {
                db.collection('airbnb.requests').update({ _id: ObjectID(elem._id) }, { $push: { 'responses': { $each: crawled } } }, (err, result) => { });

                mail = {}
                mail.url = elem.url;
                mail.email = elem.email;
                mail.responses = crawled;

                db.collection('airbnb.tomail').save(mail, (err, result) => { });

            }
            return crawled;
        });
        res.send(founded);
    });
});

