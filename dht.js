var bittorrentDHT = require('bittorrent-dht')
var EventEmitter = require('events').EventEmitter

var DHT_WAIT = 1500;

function DHT(infoHash)
{
	var self = this;
	EventEmitter.call(this);
	
	var dht = new bittorrentDHT()
	var abort, wait;

	this.run = function() {
		if (abort || wait) return

		wait = setTimeout(function() {
			abort = dht.lookup(infoHash)
			wait = null
		}, DHT_WAIT);
	};

	this.pause = function() {
		if (wait) { clearTimeout(wait); wait = null }
		if (abort) { abort(); abort = null }
	};

	dht.on('peer', function(p) { self.emit('peer', p.host+":"+p.port) })
};
DHT.prototype.__proto__ = EventEmitter.prototype;
module.exports = DHT;
