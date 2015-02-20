var DHT = require("./dht");
var events = require("events");

function setupSource(source)
{

};


module.exports = function peerSearch(sources, options) 
{
	var ev = new events.EventEmitter();
	ev.setMaxListeners(0); // unlimited power
	var queue = [];

	this.shift = function(cb) {
		// TODO
	};
	this.length = function() { return queue.length };
};