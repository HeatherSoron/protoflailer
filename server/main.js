var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/static', express.static('web'));

app.get('/', function(req, res) {
	res.send('Hello, world');
});


players = {};

io.on('connection', function(socket) {
	console.log("User connection: " + socket.id);
	players[socket.id] = socket;
	socket.on('disconnect', function() {
		console.log("Disconnection: " + socket.id);
		players[socket.id] = null;
	});
});

var tick = 0;
setInterval(function() {
	io.emit('tick', tick++);
}, 1000 / 30.0);



http.listen(3000, function() {
	console.log("listening on *:3000");
});
