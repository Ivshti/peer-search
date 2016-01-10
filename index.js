var DHT = require("./dht");
//var Pump = require("./pump");
var Tracker = require("./tracker");
var events = require("events");

module.exports = function peerSearch(sources, swarm, options) 
{
	var self = this;

	var sources = sources.map(function setupSource(src) {
		if (src.match("^dht:")) return new DHT(src.split(":")[1], options);
		//if (src.match("^pump:")) return new Pump(src.slice("pump:.length));
		if (src.match("^tracker:")) return new Tracker(src.slice("tracker:".length), { }, swarm.infoHash);
	})
	.map(function(x, i) { if (x) x.url = sources[i]; return x }) // Attach url to each one
	.filter(function(x) { return x });
	sources.forEach(function(x) { 
		x.numFound = 0; x.numRequests = 0;
		x.on("peer", function(addr) { x.numFound++; swarm.add(addr) });
	});

	var running = false;
	this.run = function() { running=true; sources.forEach(function(x) { 
		if (sources.length > 2 && x.url.match("^dht")) x.queue.unshift(800); // wait 800ms for the DHT if we have a lot of sources
		x.run();
	}) };
	this.pause = function() { running=false; sources.forEach(function(x) { x.pause() }) };
	this.close = function() { sources.forEach(function(x) { 
		if (x.removeAllListeners) x.removeAllListeners();
		if (x.close) x.close();
	}) };
	this.stats = function() { return sources.map(function(x) { return { numFound: x.numFound, numRequests: x.numRequests, url: x.url } }) };

	this.run(); // All sources should be initialized paused

	var update = function() {
		var len = swarm.queued;
		if (swarm.paused && running) return self.pause(); // swarm is paused, no point
		if (options.hasOwnProperty("min") && (len < options.min) && !running) return self.run();
		if (options.hasOwnProperty("max") && (len > options.max) && running) return self.pause();
	};
	swarm.on("wire", update); swarm.on("wire-disconnect", update);
	swarm.on("resume", update); swarm.on("pause", update);
	// Call self.run() (if running) every 30s to re-try/boost some sources
	var runIntvl = setInterval(function() { if (running) self.run() }, 30*1000);
	
	// if needed we can use swarm._destroyed ?
	swarm.on("close", function() {
		swarm.removeAllListeners();
		self.pause(); 
		self.close(); sources = [];
		if (runIntvl) clearInterval(runIntvl);
	});
	
	swarm.peerSearch = self;
};
