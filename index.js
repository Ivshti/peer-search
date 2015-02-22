var DHT = require("./dht");
var Pump = require("./pump");
var events = require("events");

module.exports = function peerSearch(sources, swarm, options) 
{
	var self = this;

	var sources = sources.map(function setupSource(src) {
		if (src.match("^dht:")) return new DHT(new Buffer(src.split(":")[1],"hex"), options);
		if (src.match("^pump:")) return new Pump(src.slice("pump:".length));
		if (src.match("^tracker:")) return new Tracker(src.slice("tracker:".length),{ }, options);
		// TODO: tracker // bittorrent-tracker
	})
	.filter(function(x){ return x });
	sources.forEach(function(x) { x.on("peer", function(addr) { swarm.add(addr) }) });

	var running = false;
	this.run = function() { running=true; sources.forEach(function(x) { x.run() }) };
	this.pause = function() { running=false; sources.forEach(function(x) { x.pause() }) };
	this.close = function() { sources.forEach(function(x) { if (x.close) x.close() }) };

	this.run(); // All sources should be initialized paused

	var update = function() {
		var len = Object.keys(swarm._peers).length;
		if (options.hasOwnProperty("min") && (len < options.min) && !running) return self.run();
		if (options.hasOwnProperty("max") && (len > options.max) && running) return self.pause();
	};
	swarm.on("wire", update);
	swarm.on("wire-disconnect", update);
};