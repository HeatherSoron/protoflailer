var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/static', express.static('web'));

app.get('/', function(req, res) {
	res.send('Hello, world');
});

var geom = require('./geometry');


players = {};

io.on('connection', function(socket) {
	var id = socket.id;
	var colorComps = [];
	for (var i = 0; i < 3; ++i) {
		colorComps.push(Math.floor(Math.random() * 256));
	}
	var player = {
		socket: socket,
		ctrl: {},
		pos: new geom.Point(),
		flail: {
			body: new geom.Point(),
			vel: new geom.Point(),
		},
	};
	// add a couple member variables for the client to make use of
	player.pos.size = 10;
	player.flail.body.size = 5;
	player.pos.color = 'rgb(' + colorComps.join(',') + ')';
	player.flail.body.color = 'rgb(' + colorComps.map(function(val) { return Math.floor(val * 0.9);}).join(',') + ')';

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

		// INSPIRATION:
		// http://worldbuilding.stackexchange.com/questions/17239/how-to-make-flashy-fighting-practical-fighting?rq=1

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
