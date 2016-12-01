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
    sendMailDB(res, true);
    res.redirect('/');
});


function logError(err, result) {
    if (err) {
      console.log("");
      console.log("Error: ");
      console.log(err);
      console.trace();
      console.log("");
    }
}



function renderUrl(url) {
    var url_instance = new URIlib.URI(url);
    path = url_instance.getPath();
    query = url_instance.getQuery()
    location = "&location=" + path.substring(3, path.length);
    new_url = url_instance.getScheme() + "://" + url_instance.getAuthority() + "/search/search_results?" + query + location;
    return new_url;
}


function sendMailDB(res, del) {
    db.collection('airbnb.tomail').find().toArray(function (err, results) {
        results.forEach(function (elem) {


            res.render('mail.ejs', { json_data: elem.responses }, function (err, html) {

                if (err == null) {
                    if (sendMail(elem.email, html))
                        if (del)
                            db.collection('airbnb.tomail').deleteOne({ _id: elem._id }, logError);
                } else {
                    console.log(err);
                }
            });


        });

        res.send({ message: "ok" });
    })
}



function sendMail(email, html) {

    var smtpConfig = {
        host: 'smtp.yandex.ru',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: '*****',
            pass:  '*****'

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



//--------------------------------
function doCrawlTest(url) {
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
}




function iterateActiveRequests(iterator) {
    db.collection('airbnb.requests').find({ active: { $eq: "1" } }).toArray((err, result) => result.forEach(iterator))
}

function crawlMultiplePage(baseUrl, onComplete) {
    var url_instance = new URIlib.URI(baseUrl);
    var transport = (url_instance.getScheme() || "").toLowerCase() === "https" ? https : http;

    var queryParams = url_instance.parseQuery();
    var httpParams = {
        host: url_instance.getAuthority(),
        headers: { 'user-agent': 'Mozilla/5.0' }
    }

    var hotelsArray = [];
    var crawlOnePage = function (pageNum) {
        queryParams.params.page = ["" + pageNum];
        httpParams.path = (url_instance.getPath() || "") + "?" + queryParams.toString();
        var transpot_info = transport.get(httpParams, function (result) {
            var data = "";
            result.on("data", function (chunk) {
                data += chunk;
            }).on("end", function (chunk) {
                var json = JSON.parse(data).results_json;
                hotelsArray = hotelsArray.concat(json.search_results);
                if (json.metadata.listings_count <= hotelsArray.length) {
                    onComplete(hotelsArray);
                } else {
                    crawlOnePage(pageNum + 1);
                }
            })

        }).on('error', function (e) {
            console.log("not ok");
        });
    }
    crawlOnePage(1);
}

app.get("/crawl", function (req, res) {
    var handleCrawledData = function (crawled, request) {
        console.log("Before filter: " + crawled.length);
        if (request.responses) {
            var existed = request.responses.map(resp => resp.listing.id);
            crawled = crawled.filter(function (resp) {
                return existed.indexOf(resp.listing.id) < 0
            });
            console.log("After filter: " + crawled.length);
        }
        else 
          console.log("No filter");
        if (crawled.length > 0) {
            db.collection('airbnb.requests').update({ _id: ObjectID(request._id) }, { $push: { 'responses': { $each: crawled } } }, logError);

            mail = {url: request.url, email: request.email, responses :crawled};

            db.collection('airbnb.tomail').save(mail, logError);
        }

        
    }

    iterateActiveRequests(function (request) {
        crawlMultiplePage(renderUrl(request.url), function (newResponses) {
            handleCrawledData(newResponses, request);
        })
    });

            res.redirect('/')
});