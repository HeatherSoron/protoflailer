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
		flail: {
			body: {x: 0, y: 0, size: 5},
			vel: {x: 0, y: 0},
		},
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

		var rebound = 0.1;
		var swing = 1;
		var friction = 0.01;

		// doing velocity on the two linear components, separately, is NOT physically accurate.
		// so, eventually, we do want to get a proper Point class in here, and do it THAT way
		// but, this will do for a start
		function doVel(comp) {
			var accel = (p.pos[comp] - p.flail.body[comp]) * rebound;
			if (Math.abs(accel) > 0.1) {
				p.flail.vel[comp] += accel;
			}

			p.flail.vel[comp] *= (1 - friction);
			if (Math.abs(p.flail.vel[comp]) < 0.5) {
				p.flail.vel[comp] = 0;
			}
			p.flail.body[comp] += p.flail.vel[comp];
		}
		doVel('x');
		doVel('y');

		if (p.ctrl.action) {
			if (!p.flail.flung) {
				
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
