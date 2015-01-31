var express = require("express");
var app = express();
var port = 3700;

var lessMiddleware = require('less-middleware');

var bt = require('bing-translate').init({
    client_id: 'marielb', 
    client_secret: 'ot1gR3iJCmPsq3+WSyqCoU9TTU1Gs8fGJLxirwUMsvs='
  });

app.set('views', __dirname + '/views');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/controllers'));
app.use(express.static(__dirname + '/css'));

app.configure(function(){
  app.use(lessMiddleware({
    src      : __dirname + "/css",
    compress : true
  }));
  app.use(express.static(__dirname + '/css'));
});

app.get("/", function(req, res){
	res.render("page");
});

var io = require('socket.io').listen(app.listen(port));

var count = 0;

io.sockets.on('connection', function (socket) {
	socket.join('lobby');
	socket.on('send', function (data) {
		io.sockets.in(data.room).emit('message', data);
	});
	socket.on('to_trans', function (data) {
		translate(data.message, data.from, data.to, function(translation) {	
			console.log('room ' + data.room);
			io.sockets.in(data.room).emit('translated', { origMessage: data.message, message: translation, lang: data.to, username: data.username });
		});
	});
	socket.on('enter room', function (data) {
		var room;

		if (data.mylang.localeCompare(data.learning) <= 0)
			room = 'room' + data.mylang + data.learning + count;
		else
			room = 'room' + data.learning + data.mylang + count;

		console.log(io.sockets.clients(room).length);
		if (io.sockets.clients(room).length >= 2) {
			count = count + 1;
			room = room.substring(0, room.length - 1) + count;
		}

		socket.join(room);
		socket.emit('joined room', { room: room});
		console.log(data.username + ' joined ' + room);
		if (io.sockets.clients(room).length == 2){
			io.sockets.in(room).emit('message', { username: "Server", message: 'You have just entered a chat!', mylang: 'en'});
		}

	});
});

console.log("Listening on port " + port);

//strip the \n out
function translate(text, from, to, callback) {
	text = text.replace(/(\r\n|\n|\r)/gm,"");
	console.log('text ' + text + ' from ' + from + ' to ' + to);
	bt.translate(text, from, to, function(err, res){
	 	callback(res.translated_text);
	});
}