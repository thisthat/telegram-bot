var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    path    = require('path'),
    fs      = require('fs');
const bodyParser = require("body-parser");
const basicAuth = require('express-basic-auth');
var busboy = require('connect-busboy');
var mongodb = require('mongodb');
const TelegramBot = require('./telegram');

var port = process.env.TELEGRAM_PORT || process.env.OPENSHIFT_NODEJS_PORT || 3030,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "",
    mongoUser = process.env.MONGODB_USER,
    mongoPassword = process.env.MONGODB_PASSWORD,
    mongoAddress  = process.env.MONGODB_DB_URL;

mongoURL = "mongodb://" + mongoUser + ":" + mongoPassword + mongoAddress;

var db = null;
var collections = [];
var bot;
mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('Connected to MongoDB at: %s', mongoURL);
    db = conn;
    db.listCollections().toArray(function(err, collInfos) {
      // collInfos is an array of collection info objects that look like:
      // { name: 'test', options: {} }
      collInfos.forEach(function(col){
        collections.push(col.name);
      })
    });
    bot = new TelegramBot(db, collections);
    bot.start();
    
});



// Pass in the env
var secretUser = "admin";
var secretPassword = process.env.SERVER_PASSWORD;

app.use(bodyParser.urlencoded({
  extended: true,
  defer: true
}));
app.use(bodyParser.json());
app.use(busboy());
app.use(morgan('combined'))
app.set('json spaces', 4);
app.use(basicAuth({
  users: { secretUser : secretPassword },
  challenge: true
}))

app.use('/static', express.static('static'))
app.use('/static', express.static(path.join(__dirname, 'views/static')))


// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

var status = "ok";
var enable = true;

app.get('/', function (req, res) {
    var output = {
        status: status,
        enable: enable
    };
    res.json(output);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);
