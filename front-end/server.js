//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    path    = require('path'),
    fs      = require('fs');

const bodyParser = require("body-parser");
const basicAuth = require('express-basic-auth');
var mongodb = require('mongodb');
var busboy = require('connect-busboy')

var routes = require('./routes/index');

// Pass in the env
var secretUser = "admin";
var secretPassword = process.env.SERVER_PASSWORD;

//console.log(process.env);


var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "",
    mongoUser = process.env.MONGODB_USER,
    mongoPassword = process.env.MONGODB_PASSWORD,
    mongoAddress  = process.env.MONGODB_DB_URL;



mongoURL = "mongodb://" + mongoUser + ":" + mongoPassword + mongoAddress;

var db = null,
    dbDetails = new Object();

var initDb = function() {
  if (mongoURL == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      console.log(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    db.listCollections().toArray(function(err, collInfos) {
      // collInfos is an array of collection info objects that look like:
      // { name: 'test', options: {} }
      var pages = [];
      collInfos.forEach(function(col){
          pages.push(col.name);
      })
      // Make our db accessible to our router
      app.use(function(req,res,next){
        req.pages = pages;
        req.db = db;
        next();
      });
      app.use('/', routes);
    });

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};
initDb();

app.use(bodyParser.urlencoded({
  extended: true,
  defer: true
}));
app.use(bodyParser.json());
app.use(busboy());
app.engine('html', require('ejs').renderFile);
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

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
