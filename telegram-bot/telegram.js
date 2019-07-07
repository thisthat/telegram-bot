// running the telegram bot
const token= process.env.TELEGRAM_TOKEN;

const Slimbot = require('slimbot');
var fs      = require('fs');
var path    = require('path');
/*
single loop.
We create a new collection which contains docs with the following struct:
{
  type: matches | includes | random | array,
  data: regexp,
  collection : [name],
  output_type : txt | img | folder,
  output_data: [data]
}
Each that matches sends an answer

*/

class TelegramBot {
  
  constructor(db, collections){
    this.db = db;
    this.collections = collections;
    this.enable = true;
    this.slimbot = new Slimbot(token);
    this.fetch_instruction();
    this.slimbot.on('message', message => {
      if(!this.enable) return;

      var txt = message.text.toLowerCase();
      var id = message.chat.id;
      var from = message.from.username;
      this.handle_request(id, txt, from);

      //slimbot.sendMessage(message.chat.id, 'Message received');
    });
    this.slimbot.startPolling();
  }

  fetch_instruction(){
    var x = this;
    this.db.collection("telegram-instr").find().toArray(function(err, docs){
      x.instr = docs;
    });
    console.log(this.instr);
  }

  stop(){
    this.enable = false;
  }
  start(){
    this.enable = true;
  }

  takeOneRnd(collection){
    return this.db.collection(collection).aggregate([{ $sample: { size: 1 } }]);
  }
  
  randomIndex(length) {
    return Math.floor(Math.random() * (length));
  }

  handle_request(id, txt, from){
    var bot = this;
    this.instr.forEach(function(elm){
        var type = elm.type;
        var col =  elm.collection;
        var data = elm.data;
        var output_type = elm.output_type;
        var output_data = elm.output_data;
        if(type == "matches"){
          var regexp = new RegExp(data);
          var matches = txt.match(regexp);
          if(matches != null && matches.length > 1){
            var who = matches[1] || "";
            bot.process_answer(id, who, col, output_type, output_data);
          }
        } // end matches
        else if(type == "includes"){
          var matches = txt.includes(data);
          if(matches){
            bot.process_answer(id, from, col, output_type, output_data);
          }
        } // end includes
        else if(type == "random"){
          bot.db.collection(col).find().toArray(function(err, docs){
            docs.forEach(function(elm){
              var f = Math.random() < parseFloat(data);
              if(txt.includes(elm.q) && f){
                if(output_type == "txt") {
                  var what = elm.a.replace("{NAME}", from);
                  bot.slimbot.sendMessage(id, what);
                } else {
                  var what = fs.createReadStream(__dirname + '/views/' + elm.a);
                  bot.slimbot.sendPhoto(id, what);
                }
              }
            });
          });
        } // end random
        else if(type == "array"){
          data.forEach(function(elm){
            if(txt.includes(elm)){
              bot.process_answer(id, from, col, output_type, output_data);
            }
          });
        }
    });
  }

  process_answer(id, from, col, output_type, output_data){
    var bot = this;
    if(output_type == "txt"){
      this.takeOneRnd(col).toArray(function(err, doc){
        var what = doc[0].q.replace("{NAME}", from);
        bot.slimbot.sendMessage(id, what);
      });
    } else if(output_type == "img"){
      var what = fs.createReadStream(output_data);
      this.slimbot.sendPhoto(id, what);
    } else if(output_type == "folder"){
      var base = __dirname + output_data;
      const dirs = fs.readdirSync(base).map(file => {
        return path.join(base, file);
      });
      var what = fs.createReadStream(dirs[bot.randomIndex(dirs.length-1)]);
      this.slimbot.sendPhoto(id, what);
    }
  }
}

module.exports = TelegramBot;