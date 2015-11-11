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

var map = new geom.Rectangle(0, 0, 350, 350);
var bounds = map.shrink(10, 10, 10, 10);

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

		var clampDist = p.pos.clampTo(bounds);
		p.health -= clampDist.length();

		// maybe clean up the death to be less fragile?
		if (p.health < 0) {
			delete players[id];
			continue;
		}

		var rebound = 0.1;
		var swing = 1;
		var friction = 0.01;


		var accel = p.pos.minus(p.flail.body).times(rebound);
		if (accel.lenSqrd() > 0.1) {
			p.flail.vel.offsetBy(accel);
		}
		p.flail.vel.scaleBy(1 - friction);
		if (p.flail.vel.lenSqrd() < 0.5) {
			p.flail.vel = new geom.Point();
		}
		p.flail.body.offsetBy(p.flail.vel);

		// this is not going to be efficient, but oh well
		for (var otherId in players) {
			if (otherId == id) {
				continue;
			}
			var other = players[otherId];
			var offset = other.pos.minus(p.flail.body);
			var dist = offset.length();
			if (dist < other.pos.size + p.flail.body.size) {
				other.pos.offsetBy(p.flail.vel.times(2));
				var speed = p.flail.vel.length();
				p.flail.vel = offset.normalize().times(speed);
			}
		}


		if (p.ctrl.action) {
			if (!p.flail.flung) {
				var dir = p.pos.minus(p.flail.body);
				if (!dir.isZero()) {
					dir = dir.normalize();
					p.flail.vel.offsetBy(dir.times(2));
				}
			}
			p.flail.flung = true;
		} else {
			p.flail.flung = false;
		}

		p.socket.emit('pos', p.pos);
		// TODO clean this up to be on the player, not the point
		p.pos.fillPercent = p.health / p.maxHealth;
		objects.push(p.pos);
		objects.push(p.flail.body);
	}
	io.emit('map', {
		objects: objects
	});
}, 1000 / 30.0);



http.listen(3000, function() {
	console.log("listening on *:3000");
});
