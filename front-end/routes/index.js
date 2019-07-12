var express = require('express');
var app = express.Router();
var mongodb = require('mongodb');


app.get('/', function (req, res) {
  res.render('index.html', { title : "", pages : req.pages});
});

app.get('/:route', function (req, res) {
    var r = req.params.route;
    res.render('page.html', { title : r, pages : req.pages});
});

app.post('/read-data', function (req, res) {
    var db = req.db;
    var post = req.body;
    var col = post.type;
    getData(col, db, res);
});

function getData(collection, db, res){
  var r = db.collection(collection).find();
  db.collection(collection).find().toArray(function(err, docs){
    res.jsonp(docs);
  });
}


app.post('/delete', function (req, res) {
  //console.log(req.body);
  var _id = req.body.id;
  var col = req.body.col;
  var db = req.db;
  //var theid = new mongodb.ObjectID(_id);
  //console.log(_id, theid);
  var r = db.collection(col).deleteOne( {"_id": mongodb.ObjectId(_id)});
  console.log(r, r.nRemoved);
  res.sendStatus(200);
});


app.get('/images', function (req, res) {
  res.render('images.tmpl.html', { });
});
app.post('/images', function (req, res) {
  getData(img, res);
});
app.post('/upload', function (req, res){
  var fstream;
  var q = req.body.botta;
  req.busboy.on('field', function(key, value, keyTruncated, valueTruncated) {
    if(key == "msg")
      q = value;
  });
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
      console.log("Uploading: " + filename);
      //Path where image will be uploaded
      var name = '/static/img/' + filename;
      fstream = fs.createWriteStream(__dirname + "/views" + name);
      file.pipe(fstream);
      fstream.on('close', function (err) {    
          //console.log("Upload Finished in " + name, err);    
          saveData(q,name,img);          
          //res.redirect('back');           //where to go next
          res.redirect('back');
      });
  });
})


app.post('/insBotta', function (req, res) {
  var q = req.body.botta;
  var a = req.body.risposta;
  var col = req.body.col;
  var db = req.db;
  saveData(q,a,col, db);
  res.sendStatus(200);
});


function saveData(q,a, col, db){
  db.collection(col).insertOne({q: q, a: a});
}

module.exports = app;