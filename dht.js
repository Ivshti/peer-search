var bittorrentDHT = require('bittorrent-dht')
var EventEmitter = require('events').EventEmitter

var DHT_WAIT = 1500;
var DHT_LET_IT_RUN= 1500; // let it run 1500ms after pause; that allows us to 'stock up' on peers, for only one sec
var DHT_CONCURRENCY = 10; 

function DHT(infoHash)
{
	var self = this;
	EventEmitter.call(this);
	
	var dht = new bittorrentDHT({ concurrency: DHT_CONCURRENCY });
	var abort, wait;

	this.run = function() {
		if (abort || wait) return

		wait = setTimeout(function() {
			self.numRequests++
			abort = dht.lookup(infoHash)
			wait = null
		}, DHT_WAIT);
	};

	this.pause = function() {
		if (wait) { clearTimeout(wait); wait = null }
		if (abort) { setTimeout(abort, DHT_LET_IT_RUN); abort = null }
	};

	this.close = function(cb) {
		dht.destroy(cb);
	}

	dht.on('peer', function(p) { self.emit('peer', p.host+":"+p.port) })
};
DHT.prototype.__proto__ = EventEmitter.prototype;
module.exports = DHT;
