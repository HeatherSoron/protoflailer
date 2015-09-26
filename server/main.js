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
	var id = socket.id;
	var player = {
		socket: socket,
		ctrl: {},
		pos: {x: 0, y: 0},
	};
	players[id] = player;
	
	console.log("User connection: " + id);
	
	socket.on('disconnect', function() {
		console.log("Disconnection: " + id);
		players[id] = null;
		delete(players[id]);
	});

	socket.on('ctrldown', function(msg) {
		player.ctrl[msg] = true;
	});
	socket.on('ctrlup', function(msg) {
		player.ctrl[msg] = false;
	});
});

var tick = 0;
setInterval(function() {
	io.emit('tick', tick++);
	var objects = [];
	for (var id in players) {
		var p = players[id];
		if (p.ctrl.up) {
			p.pos.y--;
		}
		if (p.ctrl.down) {
			p.pos.y++;
		}
		if (p.ctrl.left) {
			p.pos.x--;
		}
		if (p.ctrl.right) {
			p.pos.x++;
		}
		p.socket.emit('pos', p.pos);
		objects.push(p.pos);
	}
	io.emit('map', {
		objects: objects
	});
}, 1000 / 30.0);



http.listen(3000, function() {
	console.log("listening on *:3000");
});
