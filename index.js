var DHT = require("./dht");
var events = require("events");

module.exports = function peerSearch(sources, options) 
{
	var sources = sources.map(function setupSource() {
		//TODO
		//ev.	
	});

	var ev = new events.EventEmitter();
	ev.setMaxListeners(0); // unlimited power
	var queue = [];

	this.shift = function(cb) {
		if (!queue.length) { /* TODO */return };
		// TODO
	};
	this.length = function() { return queue.length };

	this.run = function() { sources.forEach(function(x) { x.run() }) };
	this.pause = function() { sources.forEach(function(x) { x.pause() }) };

	this.run(); // All sources should be initialized paused
};