var DHT = require("./dht");
var events = require("events");

module.exports = function peerSearch(sources, swarm, options) 
{
	var sources = sources.map(function setupSource() {
		
		//TODO
		//ev.
	});

	var ev = new events.EventEmitter();
	ev.setMaxListeners(0); // unlimited power

	this.run = function() { sources.forEach(function(x) { x.run() }) };
	this.pause = function() { sources.forEach(function(x) { x.pause() }) };

	this.run(); // All sources should be initialized paused
};