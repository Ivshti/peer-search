var bittorrentDHT = require('bittorrent-dht')
var EventEmitter = require('events').EventEmitter

function DHT(infoHash)
{
	var self = this;
	EventEmitter.call(this);
	
	var dht = new bittorrentDHT()
	var running = false, abort

	this.run = function() {
		if (running) return;
		abort = dht.lookup(infoHash)
		running = true
	};

	this.pause = function() {
		if (!running) return
		abort()
		running = false
	};

	dht.on('peer', function(p) { self.emit('peer', p.host+":"+p.port) })
};
DHT.prototype.__proto__ = EventEmitter.prototype;
module.exports = DHT;