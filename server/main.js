var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/static', express.static('web'));

app.get('/', function(req, res) {
	res.send('Hello, world');
});

var geom = require('./geometry');
var Player = require('./player').Player;

var map = require('./map').map;

players = {};

io.on('connection', function(socket) {
	socket.emit('mapDef', map);
	var id = socket.id;
	var player = new Player(socket);

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
	var targets = {};
	for (var id in players) {
		var p = players[id];

		p.move();

		// maybe clean up the death to be less fragile?
		if (p.health < 0) {
			delete players[id];
			continue;
		}

		p.swing();

		p.socket.emit('pos', p.pos);
		// TODO clean this up to be on the player, not the point
		p.pos.fillPercent = p.health / p.maxHealth;
		targets[id] = objects.length;
		// HACKITY HACK CLEAN UP THE RENDER CODE
		p.flail.body.connectTo = p.pos;
		objects.push(p.pos);
		objects.push(p.flail.body);
	}
	io.emit('map', {
		objects: objects,
		targets: targets,
	});
}, 1000 / 30.0);



http.listen(3000, function() {
	console.log("listening on *:3000");
});
