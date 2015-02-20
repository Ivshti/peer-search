var request = require("request");
var byline = require("byline");
var EventEmitter = require('events').EventEmitter;


function Pump(url)
{
	var self = this;
	EventEmitter.call(this);

	this.run = function() {
		 byline(request(url)).on("data", function(d) { self.emit("peer",d.toString()) });
	};

	this.pause = function() {
		// No point
	};
};
Pump.prototype.__proto__ = EventEmitter.prototype;
module.exports = Pump;