var request = require("request");
var byline = require("byline");
var EventEmitter = require("events").EventEmitter;
var async = require("async");

var REFRESH_INTERVAL = 25*1000;

function Pump(url)
{
	var self = this;
	EventEmitter.call(this);

	var refreshInterval = null;
	
	this.run = function() {
		 byline(request(url)).on("data", function(d) { self.emit("peer",d.toString()) });
		 if (!refreshInterval) refreshInterval = setInterval(function() { self.run()  }, REFRESH_INTERVAL);
	};

	this.pause = function() {
		clearInterval(refreshInterval);
	};
};
Pump.prototype.__proto__ = EventEmitter.prototype;
module.exports = Pump;
