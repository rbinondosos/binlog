var app = require("express")();
var mysql = require("mysql");
var http = require("http").Server(app);
var io = require("socket.io")(http);
var util = require('util');
const port = process.env.PORT || 3000;

app.get("/", function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/favicon.ico', function(req, res) {
    res.status(204);
});

app.set('port', port);

//http.listen(port, () => console.log('listening on port ' + port));
var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});
// IO

io.on('connection', function(socket){
  console.log('a connection has been establised');
  socket.on('EVENT_LOG', function(msg){
    io.emit('EVENT_LOG', msg);
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('status added', function(status){
    add_status(status, function(res){
      if(res){
        io.emit('refresh feed', status);
      }else{
        io.emit('error occured', status);
      }
    });
  });
});

// Client code
var ZongJi = require('./');

var zongji = new ZongJi({
  host     : 'localhost',
  user     : 'root',
  password : '',
  debug: true
});

zongji.on('binlog', function(evt) {
  evt.dump();
  io.emit('EVENT_LOG',util.inspect(evt, false, null));
  console.log('evt', evt);
});

zongji.start({
  includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows']
});

process.on('SIGINT', function() {
  console.log('Got SIGINT.');
  zongji.stop();
  process.exit();
});
