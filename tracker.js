var request = require("request");
var byline = require("byline");
var EventEmitter = require("events").EventEmitter;
var Client = require("bittorrent-tracker");

function Tracker(url, options, infoHash)
{
	var self = this;
	EventEmitter.call(this);

	var c = new Client(new Buffer("01234567890123456789"), 6881, { infoHash: infoHash, announce: [ url ] });
	c.on("peer", function(addr) { self.emit("peer", addr) });

	this.run = function() {
		c.start(); // apparently we can call that multiple times
	};

	this.pause = function() {
		// No point
	};
};
Pump.prototype.__proto__ = EventEmitter.prototype;
module.exports = Tracker;