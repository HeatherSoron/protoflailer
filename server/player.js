var geom = require('./geometry');

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

module.exports.Player = Player;
