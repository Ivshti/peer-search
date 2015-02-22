var net = require('net');
var dgram = require('dgram');
var bncode = require('bncode');
var crypto = require('crypto');
var async = require('async');
var compact2string = require('compact2string');
var EventEmitter = require('events').EventEmitter;

var MAX_REQUESTS = 35;
var COOLOFF = 10;

var BOOTSTRAP_NODES = [
	'dht.transmissionbt.com:6881',
	'router.bittorrent.com:6881',
	'router.utorrent.com:6881'
];

var randomId = function() {
	var bytes = crypto.randomBytes(2000);
	var offset = 0;
	return function() {
		var id = bytes.slice(offset, offset + 20);
		offset = (offset + 20) % bytes.length;
		return id;
	};
}();

var parseNodeInfo = function(compact) {
	try {
		var nodes = [];
		for (var i = 0; i < compact.length; i += 26) {
			nodes.push(compact2string(compact.slice(i+20, i+26)));
		}
		return nodes;
	} catch(err) {
		return [];
	}
};

var parsePeerInfo = function(list) {
	try {
		return list.map(compact2string);
	} catch (err) {
		return [];
	}
};

var socket, requestId = 0, pendingRequests = { };

var DHT = function(infoHash, opts) {
	EventEmitter.call(this);
	
	opts = opts || {};
	opts.cooloff_time = opts.cooloff_time || COOLOFF;
	opts.cooloff_requests = opts.cooloff_requests || MAX_REQUESTS;

	var self = this;
	var node = function(addr) {
		if (self.nodes[addr]) return;
		//if (self.queue.length < 50) self.queue.push(addr);
		self.queue.push(addr);
	};
	var peer = function(addr) {
		if (self.peers[addr]) return; // WARNING: we could do something with repeating peers. prioritize?
		self.peers[addr] = true;
		process.nextTick(function() { self.emit('peer', addr) }); // if the query is satisfied now, the socket must be closed before a new query is started
	};

	this.nodes = {};
	this.peers = {};
	this.queue = async.queue(runQueue, 1);
	this.queue.pause();

	this.infoHash = infoHash;
	this.nodeId = randomId();
	this.requestId = ++requestId;
	this.message = bncode.encode({t:this.requestId.toString(),y:'q',q:'get_peers',a:{id:this.nodeId,info_hash:this.infoHash}});

	pendingRequests[self.requestId] = 1;
	
	socket = socket || dgram.createSocket('udp4'); // initialize socket only when we need it
		
	function handleMessage(message, remote) {
		self.nodes[remote.address+':'+remote.port] = true;

		try { message = bncode.decode(message); }
		catch (err) { return; }

		if (!message.t || (message.t.toString() != self.requestId))
			return;
			
		var r = message && message.r;
		var nodes = r && r.nodes || [];
		var values = r && r.values || [];

		parsePeerInfo(values).forEach(peer);
		parseNodeInfo(nodes).forEach(node);
	};
	socket.on('message', handleMessage);

	var reqs = 0;
	function runQueue(addr, cb) {
		//if (Object.keys(self.nodes).length > 500) { self.queue.pause(); return cb(); }
		try {
			socket && socket.send(self.message, 0, self.message.length, addr.split(':')[1], addr.split(':')[0]);
		} catch(e) { console.error(e) };

		reqs++;
		if (reqs>self.cooloff_requests) return setTimeout(function() { reqs=0; cb() }, self.cooloff_time);
		else setTimeout(cb, 0);
	};

	self.run = function() 
	{
		self.queue.resume();
		BOOTSTRAP_NODES.forEach(function(addr) { self.queue.push(addr) });
	};

	self.pause = function()
	{
		self.queue.pause();
	};

	// Revise?
	self.stop = function()
	{
		delete pendingRequests[self.requestId];
		socket && socket.removeListener('message', handleMessage);
		
		if (Object.keys(pendingRequests).length) return; // don't close the socket if we still have pending requests
		self.close();
	};
};

DHT.prototype.__proto__ = EventEmitter.prototype;

DHT.prototype.close = function() {
	socket && socket.close();
	socket = null;
};


module.exports = DHT;


