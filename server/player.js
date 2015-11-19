var geom = require('./geometry');
var bounds = require('./map').bounds;

function Player(socket) {
	var colorComps = [];
	for (var i = 0; i < 3; ++i) {
		colorComps.push(Math.floor(Math.random() * 256));
	}
	
	this.socket = socket;
	this.ctrl = {};
	this.pos = new geom.Point(20, 20);
	this.flail = {
		body: new geom.Point(),
		vel: new geom.Point(),
	};
	this.health = 100;
	this.maxHealth = 100.0;
	
	// add a couple member variables for the client to make use of
	this.pos.size = 10;
	this.flail.body.size = 5;
	this.pos.color = 'rgb(' + colorComps.join(',') + ')';
	this.flail.body.color = 'rgb(' + colorComps.map(function(val) { return Math.floor(val * 0.9);}).join(',') + ')';
}

Player.prototype.move = function() {
	if (this.ctrl.up) {
		this.pos.y--;
	}
	if (this.ctrl.down) {
		this.pos.y++;
	}
	if (this.ctrl.left) {
		this.pos.x--;
	}
	if (this.ctrl.right) {
		this.pos.x++;
	}

	var clampDist = this.pos.clampTo(bounds);
	this.health -= clampDist.length();
}

Player.prototype.swing = function() {
	var rebound = 0.1;
	var swing = 1;
	var friction = 0.01;


	var accel = this.pos.minus(this.flail.body).times(rebound);
	if (accel.lenSqrd() > 0.1) {
		this.flail.vel.offsetBy(accel);
	}
	this.flail.vel.scaleBy(1 - friction);
	if (this.flail.vel.lenSqrd() < 0.5) {
		this.flail.vel = new geom.Point();
	}
	this.flail.body.offsetBy(this.flail.vel);

	/* check if any other player is hit by our flail */

	// this is not going to be efficient, but oh well
	for (var otherId in players) {
		if (otherId == this.socket.id) {
			continue;
		}
		var other = players[otherId];
		var offset = other.pos.minus(this.flail.body);
		var dist = offset.length();
		if (dist < other.pos.size + this.flail.body.size) {
			var blowVec = this.flail.vel.times(2);
			other.pos.offsetBy(blowVec);
			other.flail.body.offsetBy(blowVec);
			var speed = this.flail.vel.length();
			this.flail.vel = offset.normalize().times(speed);
		}
	}


	if (this.ctrl.action) {
		if (!this.flail.flung) {
			var nearest = this.findNearestOther();
			if (nearest) {
				var speed = this.flail.vel.length();
				var dir = nearest.pos.minus(this.flail.body);
				this.flail.vel = dir.normalize().times(speed);
			}
		}
		this.flail.flung = true;
	} else {
		this.flail.flung = false;
	}
}

Player.prototype.findNearestOther = function() {
	var nearest = null;
	// the dist doesn't actually need to be stored, but caching it could help performance
	var nearestDistSqr;
	for (var otherId in players) {
		if (otherId == this.socket.id) {
			continue;
		}
		var other = players[otherId];
		var offset = other.pos.minus(this.pos);
		var distSqr = offset.lenSqrd();
		if (nearest === null || distSqr < nearestDistSqr) {
			nearest = other;
			nearestDistSqr = distSqr;
		}
	}
	return nearest;
}

module.exports.Player = Player;
