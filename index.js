var DHT = require("./dht");
var Pump = require("./pump");
var events = require("events");

module.exports = function peerSearch(sources, swarm, options) 
{
	var self = this;

	var sources = sources.map(function setupSource(src) {
		if (src.match("^dht:")) return new DHT(new Buffer(src.split(":")[1],"hex"), options);
		if (src.match("^pump:")) return new Pump(src.split(":")[1]);
	}).filter(function(x){ return x });

	var running = false;
	this.run = function() { running=true; sources.forEach(function(x) { x.run() }) };
	this.pause = function() { running=false; sources.forEach(function(x) { x.pause() }) };

	this.run(); // All sources should be initialized paused

	var update = function() {
		var len = Object.keys(swarm._peers).length;
		if (options.hasOwnProperty("min") && (len < options.min) && !running) return self.run();
		if (options.hasOwnProperty("max") && (len > options.max) && running) return self.pause();
	};
	swarm.on("wire", update);
	swarm.on("wire-disconnect", update);

};